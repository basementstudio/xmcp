import assert from "node:assert/strict";
import { test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import {
  nanoOrderCommitment,
  publicKeyToNanoAddress,
  type NanoRpc,
} from "../src/nano.js";
import { payment, x402Provider } from "../src/index.js";
import { x402Registry } from "../src/registry.js";
import type { X402Config } from "../src/types.js";

// The shape of the 402 offer of an unpaid call to a tool on `nano`, by
// `nano.x402Version`, and a v2 payment made from a v2 offer.

const WALLET =
  "nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3";
const EVM_WALLET = "0x1111111111111111111111111111111111111111";
const PAYER = publicKeyToNanoAddress("AB".repeat(32));
const RAW_PER_XNO = 10n ** 30n;
const PRICE_RAW = (RAW_PER_XNO / 100n).toString(); // 0.01 XNO

let hashCounter = 0;
function newHash(): string {
  hashCounter += 1;
  return (0x0ffe0000 + hashCounter)
    .toString(16)
    .toUpperCase()
    .padStart(64, "0");
}

/** Mocked node RPC holding one confirmed send block to WALLET */
function mockRpc(block: {
  hash: string;
  previous: string;
  representative: string;
}): NanoRpc {
  const previousBalance = 5n * RAW_PER_XNO;
  const balance = (previousBalance - BigInt(PRICE_RAW)).toString();
  return async (body: Record<string, string>) => {
    if (body.hash === block.hash) {
      return {
        block_account: PAYER,
        amount: PRICE_RAW,
        balance,
        confirmed: "true",
        subtype: "send",
        local_timestamp: String(Math.floor(Date.now() / 1000)),
        contents: {
          type: "state",
          account: PAYER,
          previous: block.previous,
          balance,
          link_as_account: WALLET,
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
  paymentHeader?: string
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
      result.context = payment();
      res.end(
        JSON.stringify({ jsonrpc: "2.0", id: 1, result: { content: [] } })
      );
    };
    middleware(req, res, next);
  });
}

async function unpaidOffer(config: X402Config, toolName = "nano-offer-tool") {
  const { body } = await callTool(x402Provider(config), toolName);
  return body.result.structuredContent;
}

x402Registry.register("nano-offer-tool", {
  network: "nano",
  price: 0.01,
  description: "Count words",
});
x402Registry.register("usdc-offer-tool", { network: "base", price: 0.01 });

test("without nano.x402Version the unpaid nano offer is still x402 v1", async () => {
  const offer = await unpaidOffer({
    wallet: EVM_WALLET,
    nano: { wallet: WALLET },
  });
  assert.equal(offer.x402Version, 1);
  assert.equal(offer.resource, undefined);
  const [accepts] = offer.accepts;
  assert.equal(accepts.network, "nano");
  assert.equal(accepts.maxAmountRequired, PRICE_RAW);
  assert.equal(accepts.amount, undefined);
  assert.equal(accepts.resource, "mcp://tool/nano-offer-tool");
});

test("nano.x402Version 2 sends the unpaid nano offer as x402 v2", async () => {
  const offer = await unpaidOffer({
    wallet: EVM_WALLET,
    nano: { wallet: WALLET, x402Version: 2 },
  });
  assert.deepEqual(offer, {
    x402Version: 2,
    error: "Payment required",
    resource: {
      url: "mcp://tool/nano-offer-tool",
      description: "Count words",
      mimeType: "application/json",
    },
    accepts: [
      {
        scheme: "exact",
        network: "nano:mainnet",
        amount: PRICE_RAW,
        payTo: WALLET,
        asset: "XNO",
        maxTimeoutSeconds: 300,
        extra: { name: "XNO", decimals: 30 },
      },
    ],
  });
});

test("nano.x402Version 2 leaves the offer of a tool on base at v1", async () => {
  const offer = await unpaidOffer(
    { wallet: EVM_WALLET, nano: { wallet: WALLET, x402Version: 2 } },
    "usdc-offer-tool"
  );
  assert.equal(offer.x402Version, 1);
  assert.equal(offer.resource, undefined);
  const [accepts] = offer.accepts;
  assert.equal(accepts.network, "base");
  assert.equal(accepts.maxAmountRequired, "10000");
});

test("nano.x402Version accepts only 1 or 2", () => {
  assert.throws(
    () =>
      x402Provider({
        wallet: EVM_WALLET,
        nano: { wallet: WALLET, x402Version: 3 as 2 },
      }),
    /x402Provider configuration error/
  );
});

test("a bound v2 offer is paid with a v2 payload, once", async () => {
  const middleware = x402Provider({
    wallet: EVM_WALLET,
    nano: {
      wallet: WALLET,
      x402Version: 2,
      requireBinding: true,
      rpc: async (body) => rpc(body),
    },
  });
  let rpc: NanoRpc = async () => ({ error: "Block not found" });

  const offer = (await callTool(middleware, "nano-offer-tool")).body.result
    .structuredContent;
  assert.equal(offer.x402Version, 2);
  const [accepts] = offer.accepts;
  assert.equal(accepts.extra.binding, "xno-binding/v1/rep");
  assert.match(accepts.extra.orderId, /^[0-9a-f]{32}$/);

  // The payer pays exactly `amount` to `payTo`, bound to the offer's order id
  const block = {
    hash: newHash(),
    previous: newHash(),
    representative: await nanoOrderCommitment(
      accepts.extra.orderId,
      accepts.payTo,
      accepts.amount
    ),
  };
  rpc = mockRpc(block);
  const header = Buffer.from(
    JSON.stringify({
      x402Version: 2,
      resource: offer.resource,
      accepted: accepts,
      payload: { blockHash: block.hash, orderId: accepts.extra.orderId },
    })
  ).toString("base64");

  const paid = await callTool(middleware, "nano-offer-tool", header);
  assert.equal(paid.nextCalled, true);
  assert.deepEqual(paid.context, {
    payer: PAYER,
    amount: PRICE_RAW,
    network: "nano:mainnet",
    asset: "XNO",
    transactionHash: block.hash,
    toolName: "nano-offer-tool",
  });

  // The same block cannot pay twice, and the refusal is a v2 offer again
  const replay = await callTool(middleware, "nano-offer-tool", header);
  assert.equal(replay.nextCalled, false);
  const refused = replay.body.result.structuredContent;
  assert.equal(refused.x402Version, 2);
  assert.equal(refused.accepts[0].network, "nano:mainnet");
  assert.match(refused.error, /already/i);
});
