import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import express from "express";
import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { coinbasePayments } from "../src/index.js";

test("real x402 middleware gates paid calls, leaves discovery free, and rejects batches/replay", async (context) => {
  let executions = 0,
    settled = false,
    settlementAllowed = true;
  const payTo = "0x1111111111111111111111111111111111111111";
  const resourceServer = new x402ResourceServer({
    getSupported: async () => ({
      kinds: [{ x402Version: 2, scheme: "exact", network: "eip155:84532" }],
      extensions: [],
      signers: {},
    }),
    verify: async () => ({
      isValid: !settled,
      payer: payTo,
      ...(settled ? { invalidReason: "already_paid" } : {}),
    }),
    settle: async () => {
      if (!settlementAllowed || settled)
        return {
          success: false,
          network: "eip155:84532",
          transaction: "",
          errorReason: "failed",
        };
      settled = true;
      return {
        success: true,
        network: "eip155:84532",
        transaction: "0xtransaction",
        payer: payTo,
      };
    },
  }).register("eip155:84532", new ExactEvmScheme());
  const app = express();
  app.use(express.json());
  app.use(
    coinbasePayments({
      server: resourceServer,
      tools: {
        report: {
          accepts: {
            scheme: "exact",
            network: "eip155:84532",
            payTo,
            price: "$0.01",
            extra: { paymentFlow: "upfront" },
          },
        },
      },
    }) as express.RequestHandler
  );
  app.post("/mcp", (request, response) => {
    if (request.body.method === "tools/call") executions++;
    response.json({
      jsonrpc: "2.0",
      id: request.body.id,
      result: { content: [] },
    });
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(
    () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      })
  );
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`;
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "report" },
  };
  const call = (value: unknown, payment?: string) =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(payment ? { "PAYMENT-SIGNATURE": payment } : {}),
      },
      body: JSON.stringify(value),
    });
  assert.equal((await call({ ...body, method: "initialize" })).status, 200);
  assert.equal((await call({ ...body, method: "tools/list" })).status, 200);
  const required = await call(body);
  assert.equal(required.status, 402);
  assert.equal(executions, 0);
  const challenge = JSON.parse(
    Buffer.from(required.headers.get("payment-required")!, "base64").toString()
  );
  assert.equal(challenge.accepts[0].amount, "10000");
  assert.equal((await call([body, body])).status, 400);
  assert.equal((await call({ ...body, id: undefined })).status, 400);
  const payment = Buffer.from(
    JSON.stringify({
      x402Version: 2,
      accepted: challenge.accepts[0],
      payload: {
        signature: "0xsignature",
        authorization: {
          from: payTo,
          to: payTo,
          value: "10000",
          validAfter: "0",
          validBefore: "9999999999",
          nonce: "0xnonce",
        },
      },
    })
  ).toString("base64");
  settlementAllowed = false;
  assert.equal((await call(body, payment)).status, 402);
  assert.equal(executions, 0);
  settlementAllowed = true;
  const paid = await call(body, payment);
  assert.equal(paid.status, 200);
  assert.equal(executions, 1);
  assert.ok(paid.headers.get("payment-response"));
  assert.equal((await call(body, payment)).status, 402);
  assert.equal(executions, 1);
});
