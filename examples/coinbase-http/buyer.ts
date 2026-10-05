import { CdpX402Client } from "@coinbase/cdp-sdk/x402";
import { wrapFetchWithPayment } from "@x402/fetch";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

const asset = "0x036cbd53842c5426634e7929541ec2318f3dcf7e";
const payTo = process.env.PAY_TO;
if (!payTo || !/^0x[0-9a-fA-F]{40}$/.test(payTo))
  throw new Error("Set PAY_TO to the expected receiver wallet");
const payment = new CdpX402Client({
  environment: "development",
  walletConfig: { type: "eoa", accountName: "xmcp-demo-buyer" },
  networkSchemes: [
    {
      network: "base-sepolia",
      scheme: { exact: true, upto: false, authCapture: false },
    },
  ],
  spendControls: {
    maxAmountPerPayment: { atomic: 10_000n, asset },
    maxCumulativeSpend: { atomic: 50_000n, asset },
    maxCumulativeSpendWindow: "24h",
    allowedNetworks: ["eip155:84532"],
    allowedAssets: [asset],
    allowedPayees: [payTo],
  },
});
// This command provisions/retrieves the managed wallet and prints public addresses.
// Fund it with testnet USDC yourself before running the payment command.
if (process.argv.includes("--address")) {
  console.log(await payment.getAddresses());
} else {
  const client = new Client({ name: "xmcp-paid-buyer", version: "1.0.0" });
  const paidFetch = wrapFetchWithPayment(fetch, payment);
  const endpoint = new URL("http://localhost:3001/mcp");
  const transport = new StreamableHTTPClientTransport(endpoint, {
    fetch: (input, init) => {
      const target = new URL(
        input instanceof Request ? input.url : String(input)
      );
      if (target.href !== endpoint.href)
        throw new Error("Unexpected payment endpoint");
      return paidFetch(input, { ...init, redirect: "error" });
    },
  });
  try {
    await client.connect(transport);
    console.log(await client.callTool({ name: "report" }));
  } finally {
    await client.close();
  }
}
