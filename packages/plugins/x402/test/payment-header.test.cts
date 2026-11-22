import assert from "node:assert/strict";
import { test } from "node:test";
import { decodePaymentSignatureHeader } from "@x402/core/http";
import { toPaymentHeader } from "../src/payment-header.js";

// The x402 MCP transport sends the PaymentPayload in _meta["x402/payment"] as a
// JSON object; verification decodes the base64 header form. Imports only
// src/payment-header.ts and @x402/core.

const PAYLOAD = {
  x402Version: 2,
  accepted: {
    scheme: "exact",
    network: "nano:mainnet",
    amount: "10000000000000000000000000000",
    payTo: "nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3",
  },
  payload: {
    blockHash:
      "6DA647EA687DC1F5E9C16D1ED200D4DE1EB645DF24448FC4A8F77C6D82D706AC",
  },
};

test("an object payload is refused by the header decoder as it is", () => {
  assert.throws(
    () => decodePaymentSignatureHeader(PAYLOAD as unknown as string),
    /Invalid payment signature header/
  );
});

test("an object payload reaches verification unchanged", () => {
  const header = toPaymentHeader(PAYLOAD);
  assert.equal(typeof header, "string");
  assert.deepEqual(decodePaymentSignatureHeader(header!), PAYLOAD);
});

test("a base64 header string is passed through unchanged", () => {
  const header = Buffer.from(JSON.stringify(PAYLOAD)).toString("base64");
  assert.equal(toPaymentHeader(header), header);
});

test("anything that is neither a string nor an object is no payment", () => {
  for (const value of [undefined, null, 42, true, [PAYLOAD]]) {
    assert.equal(toPaymentHeader(value), undefined);
  }
});
