import assert from "node:assert/strict";
import { test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import {
  hashNanoStateBlock,
  publicKeyToNanoAddress,
  type NanoRpc,
} from "../src/nano.js";
import { payment, x402Provider } from "../src/index.js";
import { x402Registry } from "../src/registry.js";

// A paid tool charged with a signed send block (`payload.block`) through the
// provider; the block checks themselves are in nano-block.test.cts.

const WALLET =
  "nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3";
const WALLET_PUBLIC_KEY =
  "E89208DD038FBB269987689621D52292AE9C35941A7484756ECCED92A65093BA";
const PAYER = publicKeyToNanoAddress("AB".repeat(32));
const RAW_PER_XNO = 10n ** 30n;
const PRICE_RAW = (RAW_PER_XNO / 100n).toString(); // 0.01 XNO

let hashCounter = 0;
function newHash(): string {
  hashCounter += 1;
  return hashCounter.toString(16).toUpperCase().padStart(64, "0");
}

interface CallResult {
  nextCalled: boolean;
  paymentContext?: ReturnType<typeof payment>;
  body: any;
}

function callTool(
  middleware: ReturnType<typeof x402Provider>,
  paymentHeader: string | object | undefined,
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

test("x402Provider takes a nano payment sent as a signed block", async () => {
  x402Registry.register("nano-tool", { network: "nano", price: 0.01 });
  const previousBalance = 5n * RAW_PER_XNO;
  const block = {
    type: "state",
    account: PAYER,
    previous: newHash(),
    representative: PAYER,
    balance: (previousBalance - BigInt(PRICE_RAW)).toString(),
    link: WALLET_PUBLIC_KEY,
    link_as_account: WALLET,
    signature: "AB".repeat(64),
    work: "0123456789abcdef",
  } as const;
  const hash = hashNanoStateBlock(block);
  const published: unknown[] = [];
  const rpc: NanoRpc = async (body) => {
    if (body.action === "process") {
      published.push(JSON.parse(body.block));
      return { hash };
    }
    if (body.hash === hash && published.length > 0) {
      return {
        block_account: PAYER,
        balance: block.balance,
        confirmed: "true",
        subtype: "send",
        contents: { ...block },
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
  const middleware = x402Provider({
    wallet: "0x1111111111111111111111111111111111111111",
    nano: { wallet: WALLET, rpc },
  });
  const header = Buffer.from(
    JSON.stringify({
      x402Version: 2,
      accepted: { scheme: "exact", network: "nano:mainnet" },
      payload: { block },
    })
  ).toString("base64");

  const paid = await callTool(middleware, header);
  assert.equal(paid.nextCalled, true);
  assert.equal(paid.paymentContext?.transactionHash, hash);
  assert.equal(paid.paymentContext?.amount, PRICE_RAW);
  assert.deepEqual(published, [block]);

  const replay = await callTool(middleware, header);
  assert.equal(replay.nextCalled, false);
  assert.equal(
    replay.body.result.structuredContent.error,
    "Nano block has already been used"
  );
  assert.equal(published.length, 1);
});

test("x402Provider takes the MCP transport's PaymentPayload object in _meta", async () => {
  // The x402 MCP transport puts the PaymentPayload in _meta as an object, not
  // as the base64 header string.
  x402Registry.register("nano-tool", { network: "nano", price: 0.01 });
  const previousBalance = 5n * RAW_PER_XNO;
  const block = {
    type: "state",
    account: PAYER,
    previous: newHash(),
    representative: PAYER,
    balance: (previousBalance - BigInt(PRICE_RAW)).toString(),
    link: WALLET_PUBLIC_KEY,
    link_as_account: WALLET,
    signature: "AB".repeat(64),
    work: "0123456789abcdef",
  } as const;
  const hash = hashNanoStateBlock(block);
  const published: unknown[] = [];
  const rpc: NanoRpc = async (body) => {
    if (body.action === "process") {
      published.push(JSON.parse(body.block));
      return { hash };
    }
    if (body.hash === hash && published.length > 0) {
      return {
        block_account: PAYER,
        balance: block.balance,
        confirmed: "true",
        subtype: "send",
        contents: { ...block },
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
  const middleware = x402Provider({
    wallet: "0x1111111111111111111111111111111111111111",
    nano: { wallet: WALLET, rpc },
  });
  const header = {
    x402Version: 2,
    accepted: { scheme: "exact", network: "nano:mainnet" },
    payload: { block },
  };

  const paid = await callTool(middleware, header);
  assert.equal(paid.nextCalled, true);
  assert.equal(paid.paymentContext?.transactionHash, hash);
  assert.equal(paid.paymentContext?.amount, PRICE_RAW);
  assert.deepEqual(published, [block]);

  const replay = await callTool(middleware, header);
  assert.equal(replay.nextCalled, false);
  assert.equal(
    replay.body.result.structuredContent.error,
    "Nano block has already been used"
  );
  assert.equal(published.length, 1);
});
