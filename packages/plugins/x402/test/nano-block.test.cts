import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hashNanoStateBlock,
  NANO_CONFIRM_ATTEMPTS,
  nanoBlockNotConfirmedError,
  nanoOrderCommitment,
  newNanoOrderId,
  parseNanoStateBlock,
  publicKeyToNanoAddress,
  publishNanoPayment,
  verifyNanoPayment,
  type NanoRpc,
  type NanoStateBlock,
} from "../src/nano.js";

// Payments sent as a signed send block (`payload.block`), the form clients of
// the x402 Nano exact scheme send. Imports only src/nano.ts.

const WALLET =
  "nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3";
const WALLET_PUBLIC_KEY =
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

/** A send block on the Nano mainnet ledger: its hash is the successor of `previous` */
const MAINNET_SEND_BLOCK: NanoStateBlock = {
  type: "state",
  account: "nano_1dz4mfgu5a1iq1zmnfcui1kwuno3nw9togicmmszm4ci7w51nqjd3sbej48e",
  previous: "6DA647EA687DC1F5E9C16D1ED200D4DE1EB645DF24448FC4A8F77C6D82D706AC",
  representative:
    "nano_3chartsi6ja8ay1qq9xg3xegqnbg1qx76nouw6jedyb8wx3r4wu94rxap7hg",
  balance: "126888409999999999999876600000",
  link: "3C64F70AA4866905632537314E3CE21B0210499DB17A4F335F9E3CE2C59D3BF8",
  link_as_account:
    "nano_1h56yw7cb3mb1ojkcfsjbryg68r4436suedtbwsoz9jwwd4stgzr744ft7es",
  signature:
    "CDD6791BD5421134E55BD18CA792C6AC8C5DF8721B1501CBFF3FED7F12370C090091B3401562DCA13D3D5D77705BC1E10B0C76E5C4DC9A4D628428EB149FD101",
  work: "5112cd36bb3270be",
};

const PAYER_BALANCE = 5n * RAW_PER_XNO;

function signedSend(overrides: Partial<NanoStateBlock> = {}): NanoStateBlock {
  return {
    type: "state",
    account: PAYER,
    previous: newHash(),
    representative: PAYER,
    balance: (PAYER_BALANCE - BigInt(PRICE_RAW)).toString(),
    link: WALLET_PUBLIC_KEY,
    link_as_account: WALLET,
    signature: "AB".repeat(64),
    work: "0123456789abcdef",
    ...overrides,
  };
}

interface NodeOptions {
  /** The block is on the ledger before the payment arrives */
  published?: boolean;
  /** Number of reads after publishing that still report it unconfirmed */
  unconfirmedReads?: number;
  /** Answer of `process`, default: the block's hash */
  processAnswer?: Record<string, string>;
  /** Account that owns `previous`, default: the block's account */
  previousAccount?: string;
}

/** Mocked node RPC that holds the payer's previous block and publishes `block` */
function mockNode(block: NanoStateBlock, options: NodeOptions = {}) {
  const hash = hashNanoStateBlock(block);
  const calls: string[] = [];
  const processed: unknown[] = [];
  let published = options.published ?? false;
  let unconfirmed = options.unconfirmedReads ?? 0;
  const rpc: NanoRpc = async (body) => {
    calls.push(body.action === "process" ? "process" : body.hash);
    if (body.action === "process") {
      assert.equal(body.subtype, "send");
      processed.push(JSON.parse(body.block));
      const answer = options.processAnswer ?? { hash };
      if (!answer.error) published = true;
      return answer;
    }
    assert.equal(body.action, "block_info");
    if (body.hash === hash && published) {
      const confirmed = unconfirmed > 0 ? "false" : "true";
      if (unconfirmed > 0) unconfirmed -= 1;
      return {
        block_account: block.account,
        balance: block.balance,
        confirmed,
        subtype: "send",
        local_timestamp: String(Math.floor(Date.now() / 1000)),
        contents: { ...block },
      };
    }
    if (body.hash === block.previous) {
      return {
        block_account: options.previousAccount ?? block.account,
        balance: PAYER_BALANCE.toString(),
        confirmed: "true",
        subtype: "receive",
        contents: { type: "state", balance: PAYER_BALANCE.toString() },
      };
    }
    return { error: "Block not found" };
  };
  return { rpc, hash, calls, processed };
}

function publish(
  block: unknown,
  rpc: NanoRpc,
  overrides: Record<string, unknown> = {}
) {
  return publishNanoPayment({
    block,
    payTo: WALLET,
    amount: PRICE_RAW,
    rpc,
    usedBlocks: new Set(),
    maxPaymentAgeSeconds: 300,
    wait: async () => {},
    ...overrides,
  });
}

test("a state block hashes to the hash the mainnet ledger gives it", () => {
  assert.equal(
    hashNanoStateBlock(MAINNET_SEND_BLOCK),
    "5CD780E29198BCC008D330800363373763B7AB9594AFC490E5E8BD98662C14A7"
  );
  assert.deepEqual(parseNanoStateBlock(MAINNET_SEND_BLOCK), MAINNET_SEND_BLOCK);
  assert.deepEqual(
    parseNanoStateBlock({ ...MAINNET_SEND_BLOCK, note: "not a block field" }),
    MAINNET_SEND_BLOCK
  );
});

test("rejects: malformed signed blocks", () => {
  const cases: Record<string, unknown> = {
    "not an object": "5CD780E2",
    "legacy type": { ...MAINNET_SEND_BLOCK, type: "send" },
    "no signature": { ...MAINNET_SEND_BLOCK, signature: undefined },
    "short work": { ...MAINNET_SEND_BLOCK, work: "5112cd36" },
    "bad account checksum": {
      ...MAINNET_SEND_BLOCK,
      account: MAINNET_SEND_BLOCK.account.slice(0, -1) + "f",
    },
    "balance above 128 bits": {
      ...MAINNET_SEND_BLOCK,
      balance: (1n << 128n).toString(),
    },
    "link_as_account differs from link": {
      ...MAINNET_SEND_BLOCK,
      link_as_account: WALLET,
    },
  };
  for (const [name, block] of Object.entries(cases)) {
    assert.equal(parseNanoStateBlock(block), undefined, name);
  }
});

test("a signed send of the price is published, confirmed and claimed once", async () => {
  const block = signedSend();
  const node = mockNode(block);
  const usedBlocks = new Set<string>();

  const result = await publish(block, node.rpc, { usedBlocks });
  assert.deepEqual(result, {
    valid: true,
    blockHash: node.hash,
    payer: PAYER,
    amount: PRICE_RAW,
  });
  assert.deepEqual(node.processed, [block]);
  assert.deepEqual(node.calls.slice(0, 3), [
    node.hash,
    block.previous,
    "process",
  ]);
  assert.equal(usedBlocks.has(node.hash), true);

  const replay = await publish(block, node.rpc, { usedBlocks });
  assert.deepEqual(replay, {
    valid: false,
    error: "Nano block has already been used",
  });
  assert.equal(node.processed.length, 1);
});

test("a published block is read back until the node confirms it", async () => {
  const block = signedSend();
  const node = mockNode(block, { unconfirmedReads: 2 });
  let waits = 0;
  const result = await publish(block, node.rpc, {
    wait: async () => {
      waits += 1;
    },
  });
  assert.equal(result.valid, true);
  assert.equal(waits, 2);

  const slow = signedSend();
  const slowNode = mockNode(slow, { unconfirmedReads: 10 });
  const usedBlocks = new Set<string>();
  const late = await publish(slow, slowNode.rpc, {
    confirmAttempts: 3,
    usedBlocks,
  });
  assert.deepEqual(late, {
    valid: false,
    error: nanoBlockNotConfirmedError(slowNode.hash),
  });
  assert.equal(usedBlocks.size, 0);
});

test("a confirmation timeout after publishing names the published hash, and that hash can be retried", async () => {
  const block = signedSend();
  const node = mockNode(block, { unconfirmedReads: NANO_CONFIRM_ATTEMPTS });
  const usedBlocks = new Set<string>();
  let waits = 0;
  const late = await publish(block, node.rpc, {
    usedBlocks,
    wait: async () => {
      waits += 1;
    },
  });
  assert.equal(late.valid, false);
  const error = late.valid ? "" : late.error;
  assert.ok(error.includes(node.hash));
  assert.match(error, /may still confirm/);
  assert.equal(waits, NANO_CONFIRM_ATTEMPTS - 1);
  assert.equal(node.processed.length, 1);
  assert.equal(usedBlocks.size, 0);

  // The node confirms the block later: retrying with its hash pays once,
  // without publishing anything again
  const retry = await verifyNanoPayment({
    blockHash: node.hash,
    payTo: WALLET,
    amount: PRICE_RAW,
    rpc: node.rpc,
    usedBlocks,
    maxPaymentAgeSeconds: 300,
  });
  assert.equal(retry.valid, true);
  assert.equal(node.processed.length, 1);
});

test("a block already on the ledger is verified by its hash, not published again", async () => {
  const block = signedSend();
  const node = mockNode(block, { published: true });
  const result = await publish(block, node.rpc);
  assert.equal(result.valid, true);
  assert.deepEqual(node.processed, []);
});

test("rejects before publishing: a block that does not pay this offer", async () => {
  const orderId = newNanoOrderId();
  const cases: Array<
    [string, NanoStateBlock, string, NodeOptions?, Record<string, unknown>?]
  > = [
    [
      "another destination",
      signedSend({ link: "00".repeat(32), link_as_account: OTHER }),
      "Nano block pays a different account",
    ],
    [
      "less than the price",
      signedSend({ balance: (PAYER_BALANCE - 1n).toString() }),
      `Nano payment must be at least ${PRICE_RAW} raw, 1 raw sent`,
    ],
    [
      "a previous block of another account",
      signedSend(),
      "Nano block does not follow its previous block",
      { previousAccount: WALLET },
    ],
    [
      "an open block",
      signedSend({ previous: "0".repeat(64) }),
      "Nano block is not a send block",
    ],
    [
      "a plain representative on a bound order",
      signedSend(),
      "Nano block is not bound to this order",
      {},
      { orderId },
    ],
    [
      "more than the price on a bound order",
      signedSend({
        balance: (PAYER_BALANCE - 2n * BigInt(PRICE_RAW)).toString(),
        representative: await nanoOrderCommitment(
          orderId,
          WALLET,
          (2n * BigInt(PRICE_RAW)).toString()
        ),
      }),
      "Nano block is not bound to this order",
      {},
      { orderId },
    ],
  ];
  for (const [name, block, error, nodeOptions, overrides] of cases) {
    const node = mockNode(block, nodeOptions);
    assert.deepEqual(
      await publish(block, node.rpc, overrides),
      { valid: false, error },
      name
    );
    assert.deepEqual(node.processed, [], name);
  }
});

test("a bound order accepts a signed block carrying its commitment", async () => {
  const orderId = newNanoOrderId();
  const block = signedSend({
    representative: await nanoOrderCommitment(orderId, WALLET, PRICE_RAW),
  });
  const node = mockNode(block);
  const result = await publish(block, node.rpc, { orderId });
  assert.equal(result.valid, true);
  assert.equal(node.processed.length, 1);
});

test("rejects: a block the node refuses to publish is not claimed", async () => {
  const block = signedSend();
  const usedBlocks = new Set<string>();
  const refused = mockNode(block, {
    processAnswer: { error: "Bad signature" },
  });
  assert.deepEqual(await publish(block, refused.rpc, { usedBlocks }), {
    valid: false,
    error: "Nano node did not publish the block: Bad signature",
  });
  const other = mockNode(block, { processAnswer: { hash: "AB".repeat(32) } });
  assert.deepEqual(await publish(block, other.rpc, { usedBlocks }), {
    valid: false,
    error: "Nano node published a different block",
  });
  assert.equal(usedBlocks.size, 0);
});
