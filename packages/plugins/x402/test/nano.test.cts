import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import {
  blake2b,
  isValidNanoAddress,
  isValidNanoOrderId,
  nanoAddressToPublicKey,
  nanoOrderCommitment,
  newNanoOrderId,
  publicKeyToNanoAddress,
  verifyNanoPayment,
  type NanoRpc,
} from "../src/nano.js";
import { createNanoFileStore } from "../src/nano-store.js";
import { priceToAtomicUnits } from "../src/verify.js";
import { payment, x402Provider } from "../src/index.js";
import { x402Registry } from "../src/registry.js";

const WALLET =
  "nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3";
const WALLET_KEY =
  "E89208DD038FBB269987689621D52292AE9C35941A7484756ECCED92A65093BA";
const OTHER =
  "nano_1111111111111111111111111111111111111111111111111111hifc8npp";
const PAYER = publicKeyToNanoAddress("AB".repeat(32));
const RAW_PER_XNO = 10n ** 30n;
const PRICE_RAW = (RAW_PER_XNO / 100n).toString(); // 0.01 XNO

let hashCounter = 0;
function newHash(): string {
  hashCounter += 1;
  return hashCounter.toString(16).toUpperCase().padStart(64, "0");
}

interface MockBlock {
  hash: string;
  previous: string;
  sent: bigint;
  destination?: string;
  confirmed?: string;
  subtype?: string;
  localTimestamp?: number;
  representative?: string;
}

/** Mocked node RPC: a send block and the previous block in the payer's chain */
function mockRpc(block: MockBlock): NanoRpc & { calls: string[] } {
  const previousBalance = 5n * RAW_PER_XNO;
  const calls: string[] = [];
  const rpc = async (body: Record<string, string>) => {
    calls.push(body.hash);
    assert.equal(body.action, "block_info");
    if (body.hash === block.hash) {
      const balance = (previousBalance - block.sent).toString();
      return {
        block_account: PAYER,
        amount: block.sent.toString(),
        balance,
        confirmed: block.confirmed ?? "true",
        subtype: block.subtype ?? "send",
        local_timestamp: String(
          block.localTimestamp ?? Math.floor(Date.now() / 1000)
        ),
        contents: {
          type: "state",
          account: PAYER,
          previous: block.previous,
          balance,
          link_as_account: block.destination ?? WALLET,
          representative: block.representative ?? PAYER,
        },
      };
    }
    if (body.hash === block.previous) {
      return {
        block_account: PAYER,
        balance: previousBalance.toString(),
        confirmed: "true",
        subtype: "receive",
        contents: { type: "state", balance: previousBalance.toString() },
      };
    }
    return { error: "Block not found" };
  };
  return Object.assign(rpc, { calls });
}

function verify(block: MockBlock, overrides: Record<string, unknown> = {}) {
  return verifyNanoPayment({
    blockHash: block.hash,
    payTo: WALLET,
    amount: PRICE_RAW,
    rpc: mockRpc(block),
    usedBlocks: new Set(),
    maxPaymentAgeSeconds: 300,
    ...overrides,
  });
}

test("blake2b matches node's blake2b512", () => {
  for (const input of ["", "abc", "x".repeat(128), "y".repeat(300)]) {
    const expected = createHash("blake2b512").update(input).digest("hex");
    const actual = Buffer.from(blake2b(Buffer.from(input), 64)).toString("hex");
    assert.equal(actual, expected);
  }
});

test("nano addresses are decoded and checksummed", () => {
  assert.equal(nanoAddressToPublicKey(WALLET), WALLET_KEY);
  assert.equal(publicKeyToNanoAddress(WALLET_KEY), WALLET);
  assert.equal(
    nanoAddressToPublicKey(WALLET.replace("nano_", "xrb_")),
    WALLET_KEY
  );
  assert.equal(publicKeyToNanoAddress("00".repeat(32)), OTHER);

  const badChecksum = WALLET.slice(0, -1) + (WALLET.endsWith("3") ? "4" : "3");
  assert.equal(isValidNanoAddress(badChecksum), false);
  assert.equal(isValidNanoAddress("nano_123"), false);
  assert.equal(
    isValidNanoAddress("0x1111111111111111111111111111111111111111"),
    false
  );
});

test("prices convert to atomic units without floating point", () => {
  assert.equal(priceToAtomicUnits(0.01, 6), "10000");
  assert.equal(priceToAtomicUnits(0.05, 6), "50000");
  assert.equal(priceToAtomicUnits(1, 6), "1000000");
  assert.equal(priceToAtomicUnits(0.0000005, 6), "1");
  assert.equal(priceToAtomicUnits(0.01, 30), PRICE_RAW);
  assert.equal(priceToAtomicUnits(1e-7, 30), "100000000000000000000000");
  assert.equal(priceToAtomicUnits(123.456, 30), "123456" + "0".repeat(27));
  assert.throws(() => priceToAtomicUnits(-1, 6), /Invalid price/);
  assert.throws(() => priceToAtomicUnits(Number.NaN, 6), /Invalid price/);
});

test("a confirmed send of the price to the wallet is accepted", async () => {
  const block = {
    hash: newHash(),
    previous: newHash(),
    sent: BigInt(PRICE_RAW),
  };
  const result = await verify(block);
  assert.deepEqual(result, {
    valid: true,
    blockHash: block.hash,
    payer: PAYER,
    amount: PRICE_RAW,
  });
});

test("overpaying is accepted and lowercase hashes are normalized", async () => {
  const block = { hash: newHash(), previous: newHash(), sent: RAW_PER_XNO };
  const result = await verify(block, { blockHash: block.hash.toLowerCase() });
  assert.equal(result.valid, true);
  assert.equal(result.valid && result.amount, RAW_PER_XNO.toString());
});

const rejections: Array<
  [string, Partial<MockBlock>, Record<string, unknown>, RegExp]
> = [
  ["underpaid", { sent: BigInt(PRICE_RAW) - 1n }, {}, /too small/],
  ["unconfirmed", { confirmed: "false" }, {}, /not confirmed/],
  ["wrong destination", { destination: OTHER }, {}, /different account/],
  ["receive block", { subtype: "receive" }, {}, /not a send block/],
  [
    "stale",
    { localTimestamp: Math.floor(Date.now() / 1000) - 3600 },
    {},
    /older than/,
  ],
  [
    "malformed hash",
    {},
    { blockHash: "not-a-hash" },
    /Invalid Nano block hash/,
  ],
  ["missing hash", {}, { blockHash: undefined }, /Invalid Nano block hash/],
  [
    "bad wallet checksum",
    {},
    { payTo: WALLET.slice(0, -1) + "1" },
    /Invalid Nano wallet/,
  ],
];

for (const [name, blockOverrides, overrides, error] of rejections) {
  test(`rejects: ${name}`, async () => {
    const block = {
      hash: newHash(),
      previous: newHash(),
      sent: BigInt(PRICE_RAW),
      ...blockOverrides,
    };
    const result = await verify(block, overrides);
    assert.equal(result.valid, false);
    assert.match(!result.valid ? result.error : "", error);
  });
}

test("rejects: RPC errors and unknown blocks", async () => {
  const block = {
    hash: newHash(),
    previous: newHash(),
    sent: BigInt(PRICE_RAW),
  };

  const unknown = await verify(block, { blockHash: newHash() });
  assert.deepEqual(unknown, {
    valid: false,
    error: "Nano RPC error: Block not found",
  });

  const failing = await verify(block, {
    rpc: async () => {
      throw new Error("Nano RPC responded with HTTP 503");
    },
  });
  assert.deepEqual(failing, {
    valid: false,
    error: "Nano RPC responded with HTTP 503",
  });
});

test("rejects: replay of a block that already paid", async () => {
  const block = {
    hash: newHash(),
    previous: newHash(),
    sent: BigInt(PRICE_RAW),
  };
  const usedBlocks = new Set<string>();
  const rpc = mockRpc(block);
  const options = {
    blockHash: block.hash,
    payTo: WALLET,
    amount: PRICE_RAW,
    rpc,
    usedBlocks,
  };

  assert.equal((await verifyNanoPayment(options)).valid, true);
  const replay = await verifyNanoPayment(options);
  assert.deepEqual(replay, {
    valid: false,
    error: "Nano block has already been used",
  });
  assert.equal(
    rpc.calls.length,
    2,
    "replay is rejected before calling the node"
  );

  const concurrent = {
    hash: newHash(),
    previous: newHash(),
    sent: BigInt(PRICE_RAW),
  };
  const both = await Promise.all([
    verifyNanoPayment({
      ...options,
      blockHash: concurrent.hash,
      rpc: mockRpc(concurrent),
    }),
    verifyNanoPayment({
      ...options,
      blockHash: concurrent.hash,
      rpc: mockRpc(concurrent),
    }),
  ]);
  assert.deepEqual(
    both.map((r) => r.valid),
    [true, false]
  );
});

// --- Through the provider middleware ---

function encodePayment(blockHash: string, orderId?: string): string {
  return Buffer.from(
    JSON.stringify({
      x402Version: 2,
      accepted: { scheme: "exact", network: "nano:mainnet" },
      payload: orderId ? { blockHash, orderId } : { blockHash },
    })
  ).toString("base64");
}

interface CallResult {
  nextCalled: boolean;
  paymentContext?: ReturnType<typeof payment>;
  body: any;
}

function callTool(
  middleware: ReturnType<typeof x402Provider>,
  paymentHeader: string | undefined,
  toolResult: unknown = { content: [{ type: "text", text: "ok" }] }
): Promise<CallResult> {
  return new Promise((resolve) => {
    const result: CallResult = { nextCalled: false, body: undefined };
    const req = {
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "nano-tool",
          arguments: {},
          ...(paymentHeader
            ? { _meta: { "x402/payment": paymentHeader } }
            : {}),
        },
      },
    } as unknown as Request;
    const res = {
      status() {
        return res;
      },
      json(body: unknown) {
        result.body = body;
        resolve(result);
      },
      end(chunk: string) {
        result.body = JSON.parse(chunk);
        resolve(result);
      },
    } as unknown as Response;
    const next: NextFunction = () => {
      result.nextCalled = true;
      result.paymentContext = payment();
      res.end(JSON.stringify({ jsonrpc: "2.0", id: 1, result: toolResult }));
    };
    middleware(req, res, next);
  });
}

test("x402Provider charges a nano tool end to end with a mocked node", async () => {
  x402Registry.register("nano-tool", { network: "nano", price: 0.01 });
  const block = {
    hash: newHash(),
    previous: newHash(),
    sent: BigInt(PRICE_RAW),
  };
  const middleware = x402Provider({
    wallet: "0x1111111111111111111111111111111111111111",
    nano: { wallet: WALLET, rpc: mockRpc(block) },
  });

  const unpaid = await callTool(middleware, undefined);
  assert.equal(unpaid.nextCalled, false);
  const [accepts] = unpaid.body.result.structuredContent.accepts;
  assert.equal(accepts.network, "nano");
  assert.equal(accepts.maxAmountRequired, PRICE_RAW);
  assert.equal(accepts.asset, "XNO");
  assert.equal(accepts.payTo, WALLET);

  const paid = await callTool(middleware, encodePayment(block.hash));
  assert.equal(paid.nextCalled, true);
  assert.deepEqual(paid.paymentContext, {
    payer: PAYER,
    amount: PRICE_RAW,
    network: "nano:mainnet",
    asset: "XNO",
    transactionHash: block.hash,
    toolName: "nano-tool",
  });
  assert.deepEqual(paid.body.result._meta["x402/payment-response"], {
    success: true,
    transaction: block.hash,
    network: "nano:mainnet",
    payer: PAYER,
  });

  const replay = await callTool(middleware, encodePayment(block.hash));
  assert.equal(replay.nextCalled, false);
  assert.equal(
    replay.body.result.structuredContent.error,
    "Nano block has already been used"
  );
});

test("a nano payment is released when the tool fails", async () => {
  x402Registry.register("nano-tool", { network: "nano", price: 0.01 });
  const block = {
    hash: newHash(),
    previous: newHash(),
    sent: BigInt(PRICE_RAW),
  };
  const middleware = x402Provider({
    wallet: WALLET,
    nano: { rpc: mockRpc(block) },
  });

  const failed = await callTool(middleware, encodePayment(block.hash), {
    isError: true,
    content: [{ type: "text", text: "failed" }],
  });
  assert.equal(failed.nextCalled, true);
  assert.equal(failed.body.result._meta, undefined);

  const retried = await callTool(middleware, encodePayment(block.hash));
  assert.equal(
    retried.body.result._meta["x402/payment-response"].success,
    true
  );
});

test("x402Provider rejects a nano default network without a nano wallet", () => {
  assert.throws(
    () =>
      x402Provider({
        wallet: "0x1111111111111111111111111111111111111111",
        defaults: { network: "nano" },
      }),
    /valid nano_ address is required/
  );
  assert.throws(
    () =>
      x402Provider({
        wallet: "0x1",
        nano: { wallet: WALLET.slice(0, -1) + "1" },
      }),
    /Invalid Nano address/
  );
});

test("requireBinding offers an order id and accepts only a block bound to it", async () => {
  x402Registry.register("nano-tool", { network: "nano", price: 0.01 });
  const middleware = (block: MockBlock) =>
    x402Provider({
      wallet: WALLET,
      nano: { rpc: mockRpc(block), requireBinding: true },
    });

  const offer = await callTool(
    middleware({ hash: newHash(), previous: newHash(), sent: 0n }),
    undefined
  );
  const [accepts] = offer.body.result.structuredContent.accepts;
  assert.equal(accepts.extra.binding, "xno-binding/v1/rep");
  assert.match(accepts.extra.orderId, /^[0-9a-f]{32}$/);
  const orderId: string = accepts.extra.orderId;

  const bound = {
    hash: newHash(),
    previous: newHash(),
    sent: BigInt(PRICE_RAW),
    representative: await nanoOrderCommitment(orderId, WALLET, PRICE_RAW),
  };

  const withoutOrder = await callTool(
    middleware(bound),
    encodePayment(bound.hash)
  );
  assert.equal(withoutOrder.nextCalled, false);
  assert.equal(
    withoutOrder.body.result.structuredContent.error,
    "Nano payment needs the orderId of its 402 offer"
  );

  const otherOrder = await callTool(
    middleware(bound),
    encodePayment(bound.hash, "ffffffffffffffffffffffffffffffff")
  );
  assert.equal(otherOrder.nextCalled, false);
  assert.equal(
    otherOrder.body.result.structuredContent.error,
    "Nano block is not bound to this order"
  );

  const paid = await callTool(
    middleware(bound),
    encodePayment(bound.hash, orderId)
  );
  assert.equal(paid.nextCalled, true);
  assert.equal(paid.paymentContext?.transactionHash, bound.hash);
});

test("nano.claimsFile refuses a block that paid before a restart", async () => {
  x402Registry.register("nano-tool", { network: "nano", price: 0.01 });
  const dir = mkdtempSync(join(tmpdir(), "xmcp-nano-"));
  try {
    const claimsFile = join(dir, "claims.txt");
    const block = {
      hash: newHash(),
      previous: newHash(),
      sent: BigInt(PRICE_RAW),
    };
    const start = () =>
      x402Provider({
        wallet: WALLET,
        nano: { rpc: mockRpc(block), claimsFile },
      });

    const paid = await callTool(start(), encodePayment(block.hash));
    assert.equal(paid.nextCalled, true);

    const afterRestart = await callTool(start(), encodePayment(block.hash));
    assert.equal(afterRestart.nextCalled, false);
    assert.equal(
      afterRestart.body.result.structuredContent.error,
      "Nano block has already been used"
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- Order binding (verifier) ---

const ORDER_ID = "0f1e2d3c4b5a69788796a5b4c3d2e1f0";

async function boundBlock(
  orderId: string,
  sent = BigInt(PRICE_RAW)
): Promise<MockBlock> {
  return {
    hash: newHash(),
    previous: newHash(),
    sent,
    representative: await nanoOrderCommitment(orderId, WALLET, PRICE_RAW),
  };
}

test("the order commitment matches the xno-binding v1 test vector", async () => {
  assert.equal(
    await nanoOrderCommitment(
      "order-0001",
      OTHER,
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

test("rejects: a bound order whose block has a plain or no representative", async () => {
  const unbound = { ...(await boundBlock(ORDER_ID)), representative: PAYER };
  assert.deepEqual(await verify(unbound, { orderId: ORDER_ID }), {
    valid: false,
    error: "Nano block is not bound to this order",
  });

  const missing = await boundBlock(ORDER_ID);
  const withRepresentative = mockRpc(missing);
  const withoutRepresentative = async (body: Record<string, string>) => {
    const info = (await withRepresentative(body)) as {
      contents?: Record<string, unknown>;
    };
    if (info.contents) delete info.contents.representative;
    return info;
  };
  const result = await verify(missing, {
    orderId: ORDER_ID,
    rpc: withoutRepresentative,
  });
  assert.equal(result.valid, false);
});

test("rejects: a bound payment that is not exactly the price", async () => {
  const over = await boundBlock(ORDER_ID, BigInt(PRICE_RAW) + 1n);
  assert.deepEqual(await verify(over, { orderId: ORDER_ID }), {
    valid: false,
    error: `Nano payment must be exactly ${PRICE_RAW} raw, ${BigInt(PRICE_RAW) + 1n} raw sent`,
  });
  const short = await boundBlock(ORDER_ID, BigInt(PRICE_RAW) - 1n);
  assert.equal((await verify(short, { orderId: ORDER_ID })).valid, false);
});

test("rejects: a malformed order id before calling the node", async () => {
  const block = await boundBlock(ORDER_ID);
  const rpc = mockRpc(block);
  const result = await verify(block, { rpc, orderId: "short" });
  assert.deepEqual(result, { valid: false, error: "Invalid Nano order id" });
  assert.equal(rpc.calls.length, 0);
});

// --- Claims file ---

function withClaimsFile(run: (path: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "xmcp-nano-claims-"));
  try {
    run(join(dir, "claims.txt"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("a released claim is appended as a tombstone and compacted on open", () => {
  withClaimsFile((path) => {
    const store = createNanoFileStore(path);
    const kept = newHash();
    const released = newHash();
    store.add(kept);
    store.add(released);
    store.add(released);
    store.delete(released);
    assert.equal(store.has(released), false);
    // Releasing appends one line instead of rewriting the file
    assert.equal(
      readFileSync(path, "utf8"),
      `${kept}\n${released}\n-${released}\n`
    );

    const reopened = createNanoFileStore(path);
    assert.equal(reopened.has(kept), true);
    assert.equal(reopened.has(released), false);
    assert.equal(readFileSync(path, "utf8"), `${kept}\n`);

    // A released block can be claimed again, and that claim survives a restart
    reopened.add(released);
    assert.equal(createNanoFileStore(path).has(released), true);
  });
});

test("a release followed by a new claim of the same block keeps it claimed", () => {
  withClaimsFile((path) => {
    const hash = newHash();
    writeFileSync(path, `${hash}\n-${hash}\n${hash}\n`);
    assert.equal(createNanoFileStore(path).has(hash), true);
    assert.equal(readFileSync(path, "utf8"), `${hash}\n`);
  });
});

test("a line cut short by a crash is dropped, a damaged line is an error", () => {
  withClaimsFile((path) => {
    const kept = newHash();
    writeFileSync(path, `${kept}\n${newHash().slice(0, 20)}`);
    const store = createNanoFileStore(path);
    assert.equal(store.has(kept), true);
    assert.equal(readFileSync(path, "utf8"), `${kept}\n`);

    const next = newHash();
    store.add(next);
    assert.equal(readFileSync(path, "utf8"), `${kept}\n${next}\n`);

    // A torn tombstone leaves the block claimed
    writeFileSync(path, `${kept}\n-${kept.slice(0, 30)}`);
    assert.equal(createNanoFileStore(path).has(kept), true);

    for (const damaged of ["not-a-hash", `-${"ab".repeat(32)}`, "-"]) {
      writeFileSync(path, `${kept}\n${damaged}\n`);
      assert.throws(
        () => createNanoFileStore(path),
        /line 2 is not a block hash/
      );
    }
    assert.throws(() => store.add("abc"), /not an upper-case block hash/);
  });
});

test("the claims log is compacted while running once releases pile up", () => {
  withClaimsFile((path) => {
    const store = createNanoFileStore(path);
    const kept = newHash();
    store.add(kept);
    const reused = newHash();
    let longest = 0;
    for (let i = 0; i < 5000; i += 1) {
      store.add(reused);
      store.delete(reused);
      if (i % 50 === 0) {
        longest = Math.max(longest, readFileSync(path, "utf8").length);
      }
    }
    // 4096 released lines of 65 or 66 bytes, plus the live claim
    assert.ok(longest < 4100 * 66, `log grew to ${longest} bytes`);
    assert.equal(store.has(reused), false);
    const reopened = createNanoFileStore(path);
    assert.equal(reopened.has(kept), true);
    assert.equal(reopened.has(reused), false);
  });
});
