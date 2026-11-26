import assert from "node:assert/strict";
import { test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import {
  nanoOrderCommitment,
  publicKeyToNanoAddress,
  type NanoRpc,
} from "../src/nano.js";
import type { PlanNanoPaymentOptions } from "../src/nano-payer.js";
import {
  nanoPaymentPayload,
  payment,
  planNanoPayment,
  x402Provider,
} from "../src/index.js";
import { x402Registry } from "../src/registry.js";
import type { X402Config } from "../src/types.js";

// The payer side: a client reads the 402 offer of a tool on `nano`, its
// wallet sends what the plan says, and the payment built from the plan is
// accepted by the provider that made the offer.

const WALLET =
  "nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3";
const EVM_WALLET = "0x1111111111111111111111111111111111111111";
const PAYER = publicKeyToNanoAddress("CD".repeat(32));
const RAW_PER_XNO = 10n ** 30n;
const PRICE_RAW = (RAW_PER_XNO / 100n).toString(); // 0.01 XNO
const CAP_RAW = (RAW_PER_XNO / 10n).toString(); // 0.1 XNO

let hashCounter = 0;
function newHash(): string {
  hashCounter += 1;
  return (0x0aaa0000 + hashCounter)
    .toString(16)
    .toUpperCase()
    .padStart(64, "0");
}

/** Mocked node RPC holding the confirmed send block a wallet published */
function mockRpc(block: {
  hash: string;
  previous: string;
  representative: string;
  link: string;
  amount: string;
}): NanoRpc {
  const previousBalance = 5n * RAW_PER_XNO;
  const balance = (previousBalance - BigInt(block.amount)).toString();
  return async (body: Record<string, string>) => {
    if (body.hash === block.hash) {
      return {
        block_account: PAYER,
        amount: block.amount,
        balance,
        confirmed: "true",
        subtype: "send",
        local_timestamp: String(Math.floor(Date.now() / 1000)),
        contents: {
          type: "state",
          account: PAYER,
          previous: block.previous,
          balance,
          link_as_account: block.link,
          representative: block.representative,
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
}

function callTool(
  middleware: ReturnType<typeof x402Provider>,
  toolName: string,
  paymentMeta?: unknown
): Promise<{ nextCalled: boolean; body: any; context?: unknown }> {
  return new Promise((resolve) => {
    const result: { nextCalled: boolean; body: any; context?: unknown } = {
      nextCalled: false,
      body: undefined,
    };
    const req = {
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: {},
          ...(paymentMeta !== undefined
            ? { _meta: { "x402/payment": paymentMeta } }
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
      result.context = payment();
      res.end(
        JSON.stringify({ jsonrpc: "2.0", id: 1, result: { content: [] } })
      );
    };
    middleware(req, res, next);
  });
}

x402Registry.register("nano-payer-tool", { network: "nano", price: 0.01 });

/** A provider whose node answers with whatever block the test published */
function provider(nano: Partial<NonNullable<X402Config["nano"]>>) {
  let rpc: NanoRpc = async () => ({ error: "Block not found" });
  const middleware = x402Provider({
    wallet: EVM_WALLET,
    nano: { wallet: WALLET, rpc: async (body) => rpc(body), ...nano },
  });
  return {
    middleware,
    publish(block: Parameters<typeof mockRpc>[0]) {
      rpc = mockRpc(block);
    },
  };
}

test("a bound v2 offer is planned, paid once and refused on replay", async () => {
  const server = provider({ x402Version: 2, requireBinding: true });
  const unpaid = await callTool(server.middleware, "nano-payer-tool");

  // The client passes the tools/call result as it came back
  const plan = await planNanoPayment(unpaid.body.result, {
    maxAmountRaw: CAP_RAW,
    allowedPayees: [WALLET],
  });
  const offer = unpaid.body.result.structuredContent;
  assert.equal(plan.x402Version, 2);
  assert.equal(plan.payTo, WALLET);
  assert.equal(plan.amountRaw, PRICE_RAW);
  assert.equal(plan.orderId, offer.accepts[0].extra.orderId);
  assert.equal(
    plan.representative,
    await nanoOrderCommitment(plan.orderId!, WALLET, PRICE_RAW)
  );
  assert.deepEqual(plan.resource, offer.resource);

  // The wallet sends exactly the plan: amount, account and representative
  const block = {
    hash: newHash(),
    previous: newHash(),
    representative: plan.representative!,
    link: plan.payTo,
    amount: plan.amountRaw,
  };
  server.publish(block);
  const meta = nanoPaymentPayload(plan, block.hash.toLowerCase());
  assert.deepEqual(meta.payload, {
    blockHash: block.hash,
    orderId: plan.orderId,
  });

  const paid = await callTool(server.middleware, "nano-payer-tool", meta);
  assert.equal(paid.nextCalled, true);
  assert.deepEqual(paid.context, {
    payer: PAYER,
    amount: PRICE_RAW,
    network: "nano:mainnet",
    asset: "XNO",
    transactionHash: block.hash,
    toolName: "nano-payer-tool",
  });

  const replay = await callTool(server.middleware, "nano-payer-tool", meta);
  assert.equal(replay.nextCalled, false);
  assert.match(replay.body.result.structuredContent.error, /already/i);
});

test("a v1 offer is planned from its text content and paid in v1", async () => {
  const server = provider({});
  const unpaid = await callTool(server.middleware, "nano-payer-tool");
  const text = unpaid.body.result.content[0].text;

  const plan = await planNanoPayment(
    { content: [{ type: "text", text }] },
    { maxAmountRaw: BigInt(CAP_RAW) }
  );
  assert.equal(plan.x402Version, 1);
  assert.equal(plan.accepted.network, "nano");
  assert.equal(plan.amountRaw, PRICE_RAW);
  assert.equal(plan.representative, undefined);
  assert.equal(plan.orderId, undefined);

  const block = {
    hash: newHash(),
    previous: newHash(),
    representative: PAYER,
    link: plan.payTo,
    amount: plan.amountRaw,
  };
  server.publish(block);
  const meta = nanoPaymentPayload(plan, block.hash);
  assert.deepEqual(meta, {
    x402Version: 1,
    scheme: "exact",
    network: "nano",
    payload: { blockHash: block.hash },
  });
  const paid = await callTool(server.middleware, "nano-payer-tool", meta);
  assert.equal(paid.nextCalled, true);
});

test("a send planned for one order does not pay another order", async () => {
  const server = provider({ x402Version: 2, requireBinding: true });
  const first = await planNanoPayment(
    (await callTool(server.middleware, "nano-payer-tool")).body.result,
    { maxAmountRaw: CAP_RAW }
  );
  const second = await planNanoPayment(
    (await callTool(server.middleware, "nano-payer-tool")).body.result,
    { maxAmountRaw: CAP_RAW }
  );
  assert.notEqual(first.orderId, second.orderId);
  assert.notEqual(first.representative, second.representative);

  // The wallet paid the first order; the payment names the second
  const block = {
    hash: newHash(),
    previous: newHash(),
    representative: first.representative!,
    link: first.payTo,
    amount: first.amountRaw,
  };
  server.publish(block);
  const paid = await callTool(
    server.middleware,
    "nano-payer-tool",
    nanoPaymentPayload(second, block.hash)
  );
  assert.equal(paid.nextCalled, false);
});

function offer(entry: Record<string, unknown>, x402Version = 2) {
  return {
    x402Version,
    error: "Payment required",
    accepts: [
      {
        scheme: "exact",
        network: "nano:mainnet",
        amount: PRICE_RAW,
        payTo: WALLET,
        asset: "XNO",
        extra: { name: "XNO", decimals: 30 },
        ...entry,
      },
    ],
  };
}

test("planNanoPayment refuses offers the wallet must not pay", async () => {
  const cap: PlanNanoPaymentOptions = { maxAmountRaw: CAP_RAW };
  const refuse = (value: unknown, pattern: RegExp, options = cap) =>
    assert.rejects(planNanoPayment(value, options), pattern);

  await refuse({ x402Version: 2 }, /no accepts/);
  await refuse(offer({ network: "eip155:8453" }), /no exact payment on nano/);
  await refuse(offer({ scheme: "upto" }), /no exact payment on nano/);
  // One character changed: the checksum no longer matches
  await refuse(offer({ payTo: WALLET.slice(0, -1) + "4" }), /payTo/);
  await refuse(offer({}), /not an allowed payee/, {
    maxAmountRaw: CAP_RAW,
    allowedPayees: [publicKeyToNanoAddress("01".repeat(32))],
  });
  await refuse(
    offer({ amount: (BigInt(CAP_RAW) + 1n).toString() }),
    /more than maxAmountRaw/
  );
  await refuse(offer({ amount: "0" }), /amount/);
  await refuse(offer({ amount: "1.5" }), /amount/);
  await refuse(offer({ amount: 1000 }), /amount/);
  await refuse(offer({}), /maxAmountRaw/, { maxAmountRaw: "-1" });
  await refuse(
    offer({
      extra: { binding: "xno-binding/v9/other", orderId: "a".repeat(32) },
    }),
    /Unknown Nano binding/
  );
  await refuse(
    offer({ extra: { binding: "xno-binding/v1/rep", orderId: "short" } }),
    /orderId/
  );
  // A v1 offer states its amount as maxAmountRequired
  await refuse(offer({ network: "nano" }, 1), /amount/);
});

test("nanoPaymentPayload needs a 64 hex character block hash", async () => {
  const plan = await planNanoPayment(offer({}), { maxAmountRaw: CAP_RAW });
  assert.throws(() => nanoPaymentPayload(plan, "ABC"), /64 hex/);
  assert.throws(() => nanoPaymentPayload(plan, "G".repeat(64)), /64 hex/);
});
