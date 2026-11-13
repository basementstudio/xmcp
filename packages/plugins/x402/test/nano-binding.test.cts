import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  isValidNanoOrderId,
  nanoOrderCommitment,
  newNanoOrderId,
  publicKeyToNanoAddress,
  verifyNanoPayment,
  type NanoRpc,
} from "../src/nano.js";
import { createNanoFileStore } from "../src/nano-store.js";

// Imports only nano.ts and nano-store.ts, so it runs without the x402 core packages

const WALLET =
  "nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3";
const PAYER = publicKeyToNanoAddress("AB".repeat(32));
const RAW_PER_XNO = 10n ** 30n;
const PRICE_RAW = (RAW_PER_XNO / 100n).toString(); // 0.01 XNO
const ORDER_ID = "0f1e2d3c4b5a69788796a5b4c3d2e1f0";

let hashCounter = 0x1000;
function newHash(): string {
  hashCounter += 1;
  return hashCounter.toString(16).toUpperCase().padStart(64, "0");
}

interface Block {
  hash: string;
  previous: string;
  sent: bigint;
  representative?: string;
}

function rpcFor(block: Block): NanoRpc & { calls: number } {
  const previousBalance = 5n * RAW_PER_XNO;
  const rpc = async (body: Record<string, string>) => {
    rpc.calls += 1;
    if (body.hash === block.hash) {
      const balance = (previousBalance - block.sent).toString();
      return {
        block_account: PAYER,
        balance,
        confirmed: "true",
        subtype: "send",
        local_timestamp: String(Math.floor(Date.now() / 1000)),
        contents: {
          type: "state",
          previous: block.previous,
          balance,
          link_as_account: WALLET,
          ...(block.representative
            ? { representative: block.representative }
            : {}),
        },
      };
    }
    if (body.hash === block.previous) {
      return {
        balance: previousBalance.toString(),
        confirmed: "true",
        contents: { type: "state", balance: previousBalance.toString() },
      };
    }
    return { error: "Block not found" };
  };
  rpc.calls = 0;
  return rpc;
}

async function boundBlock(
  orderId: string,
  sent = BigInt(PRICE_RAW)
): Promise<Block> {
  return {
    hash: newHash(),
    previous: newHash(),
    sent,
    representative: await nanoOrderCommitment(orderId, WALLET, PRICE_RAW),
  };
}

/** `null` verifies without an order id */
function verifyBound(block: Block, orderId: string | null = ORDER_ID) {
  return verifyNanoPayment({
    blockHash: block.hash,
    payTo: WALLET,
    amount: PRICE_RAW,
    rpc: rpcFor(block),
    usedBlocks: new Set(),
    orderId: orderId ?? undefined,
  });
}

// --- Order binding ---

test("the order commitment matches the xno-binding v1 test vector", async () => {
  assert.equal(
    await nanoOrderCommitment(
      "order-0001",
      "nano_1111111111111111111111111111111111111111111111111111hifc8npp",
      (RAW_PER_XNO / 20n).toString()
    ),
    "nano_33q9dassq66es6mcay83n5kypqgpzjikr9bkc9ope9xch1borfphgehj4ozj"
  );
});

test("order ids are opaque, URL-safe and at least 128 bits long", () => {
  const id = newNanoOrderId();
  assert.match(id, /^[0-9a-f]{32}$/);
  assert.notEqual(id, newNanoOrderId());
  assert.equal(isValidNanoOrderId(id), true);
  assert.equal(isValidNanoOrderId("order-0001"), false);
  assert.equal(isValidNanoOrderId(`${ORDER_ID}|x`), false);
  assert.equal(isValidNanoOrderId(42), false);
});

test("a send carrying the order commitment is accepted", async () => {
  const block = await boundBlock(ORDER_ID);
  const result = await verifyBound(block);
  assert.deepEqual(result, {
    valid: true,
    blockHash: block.hash,
    payer: PAYER,
    amount: PRICE_RAW,
  });
});

test("rejects: a block bound to another order, or to none", async () => {
  const other = await boundBlock("ffffffffffffffffffffffffffffffff");
  assert.deepEqual(await verifyBound(other), {
    valid: false,
    error: "Nano block is not bound to this order",
  });

  const unbound = { ...(await boundBlock(ORDER_ID)), representative: PAYER };
  assert.deepEqual(await verifyBound(unbound), {
    valid: false,
    error: "Nano block is not bound to this order",
  });

  const missing = {
    ...(await boundBlock(ORDER_ID)),
    representative: undefined,
  };
  assert.equal((await verifyBound(missing)).valid, false);
});

test("rejects: a bound payment that is not exactly the price", async () => {
  const over = await boundBlock(ORDER_ID, BigInt(PRICE_RAW) + 1n);
  assert.deepEqual(await verifyBound(over), {
    valid: false,
    error: `Nano payment must be exactly ${PRICE_RAW} raw, ${BigInt(PRICE_RAW) + 1n} raw sent`,
  });
  const short = await boundBlock(ORDER_ID, BigInt(PRICE_RAW) - 1n);
  assert.equal((await verifyBound(short)).valid, false);
});

test("rejects: a malformed order id before calling the node", async () => {
  const block = await boundBlock(ORDER_ID);
  const rpc = rpcFor(block);
  const result = await verifyNanoPayment({
    blockHash: block.hash,
    payTo: WALLET,
    amount: PRICE_RAW,
    rpc,
    usedBlocks: new Set(),
    orderId: "short",
  });
  assert.deepEqual(result, { valid: false, error: "Invalid Nano order id" });
  assert.equal(rpc.calls, 0);
});

test("without an order id, behaviour is unchanged (overpaying is accepted)", async () => {
  const block = await boundBlock(ORDER_ID, BigInt(PRICE_RAW) * 2n);
  const result = await verifyBound({ ...block, representative: PAYER }, null);
  assert.equal(result.valid, true);
});

// --- Claims file ---

function tempFile(): { path: string; done: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "xmcp-nano-claims-"));
  return {
    path: join(dir, "claims.txt"),
    done: () => rmSync(dir, { recursive: true, force: true }),
  };
}

test("a claimed block is still refused after a restart", async () => {
  const { path, done } = tempFile();
  try {
    const block = await boundBlock(ORDER_ID);
    const first = await verifyNanoPayment({
      blockHash: block.hash.toLowerCase(),
      payTo: WALLET,
      amount: PRICE_RAW,
      rpc: rpcFor(block),
      usedBlocks: createNanoFileStore(path),
      orderId: ORDER_ID,
    });
    assert.equal(first.valid, true);
    assert.equal(readFileSync(path, "utf8"), `${block.hash}\n`);

    // A new store on the same file stands for the restarted server
    const rpc = rpcFor(block);
    const replay = await verifyNanoPayment({
      blockHash: block.hash,
      payTo: WALLET,
      amount: PRICE_RAW,
      rpc,
      usedBlocks: createNanoFileStore(path),
      orderId: ORDER_ID,
    });
    assert.deepEqual(replay, {
      valid: false,
      error: "Nano block has already been used",
    });
    assert.equal(rpc.calls, 0);
  } finally {
    done();
  }
});

test("a released claim is removed from the file", () => {
  const { path, done } = tempFile();
  try {
    const store = createNanoFileStore(path);
    const kept = newHash();
    const released = newHash();
    store.add(kept);
    store.add(released);
    store.add(released);
    store.delete(released);
    assert.equal(store.has(released), false);
    assert.equal(readFileSync(path, "utf8"), `${kept}\n`);

    const reopened = createNanoFileStore(path);
    assert.equal(reopened.has(kept), true);
    assert.equal(reopened.has(released), false);
  } finally {
    done();
  }
});

test("a line cut short by a crash is dropped, a damaged line is an error", () => {
  const { path, done } = tempFile();
  try {
    const kept = newHash();
    writeFileSync(path, `${kept}\n${newHash().slice(0, 20)}`);
    const store = createNanoFileStore(path);
    assert.equal(store.has(kept), true);
    assert.equal(readFileSync(path, "utf8"), `${kept}\n`);

    const next = newHash();
    store.add(next);
    assert.equal(readFileSync(path, "utf8"), `${kept}\n${next}\n`);

    writeFileSync(path, `${kept}\nnot-a-hash\n`);
    assert.throws(
      () => createNanoFileStore(path),
      /line 2 is not a block hash/
    );
    assert.throws(() => store.add("abc"), /not an upper-case block hash/);
  } finally {
    done();
  }
});
