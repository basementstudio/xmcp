import assert from "node:assert/strict";
import { test } from "node:test";
import type { X402ToolOptions } from "xmcp/plugins/x402";
import { toolContextProvider } from "../src/context.js";
import { createPaymentRequirements } from "../src/verify.js";
import type { X402Config } from "../src/types.js";

const NANO_WALLET =
  "nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3";
const EVM_WALLET = "0x1111111111111111111111111111111111111111";

function requirementsFor(
  toolOptions: X402ToolOptions,
  config: X402Config,
  useV2Format = true
) {
  let requirements: Record<string, unknown> | undefined;
  toolContextProvider({ toolName: "tool", toolOptions, config }, () => {
    requirements = createPaymentRequirements(useV2Format);
  });
  return requirements!;
}

test("base still asks for 10000 USDC units for a 0.01 price", () => {
  const v2 = requirementsFor({ network: "base" }, { wallet: EVM_WALLET });
  assert.deepEqual(v2, {
    scheme: "exact",
    network: "eip155:8453",
    amount: "10000",
    payTo: EVM_WALLET,
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    maxTimeoutSeconds: 300,
    extra: { name: "USDC", version: "2" },
  });

  const v1 = requirementsFor(
    { network: "base-sepolia", price: 0.05 },
    { wallet: EVM_WALLET },
    false
  );
  assert.equal(v1.network, "base-sepolia");
  assert.equal(v1.maxAmountRequired, "50000");
  assert.equal(v1.asset, "0x036CbD53842c5426634e7929541eC2318f3dCF7e");
  assert.deepEqual(v1.extra, { name: "USDC", version: "2" });
});

test("a paid tool on the nano network gets XNO requirements in raw", () => {
  const requirements = requirementsFor(
    { network: "nano", price: 0.01 },
    { wallet: EVM_WALLET, nano: { wallet: NANO_WALLET } }
  );

  assert.deepEqual(requirements, {
    scheme: "exact",
    network: "nano:mainnet",
    amount: "10000000000000000000000000000",
    payTo: NANO_WALLET,
    asset: "XNO",
    maxTimeoutSeconds: 300,
    extra: { name: "XNO", decimals: 30 },
  });
});

test("unknown networks are still rejected", () => {
  assert.throws(
    () => requirementsFor({ network: "solana" }, { wallet: EVM_WALLET }),
    /Unsupported network: solana/
  );
});
