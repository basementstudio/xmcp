import { coinbasePayments } from "@xmcp-dev/coinbase";
import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createCdpFacilitatorClient } from "@coinbase/cdp-sdk/x402";
import type { Middleware } from "xmcp";
let gate: Middleware | undefined;
const middleware: Middleware = (request, response, next) => {
  if (!gate) {
    const payTo = process.env.PAY_TO;
    if (!payTo || !/^0x[0-9a-fA-F]{40}$/.test(payTo))
      throw new Error("Set PAY_TO to the receiver wallet address");
    const server = new x402ResourceServer(
      createCdpFacilitatorClient()
    ).register("eip155:84532", new ExactEvmScheme());
    gate = coinbasePayments({
      server,
      tools: {
        report: {
          accepts: {
            scheme: "exact",
            network: "eip155:84532",
            payTo,
            price: "$0.01",
            extra: { paymentFlow: "upfront" },
          },
          description: "Generate a report",
          mimeType: "application/json",
        },
      },
    });
  }
  return (gate as Exclude<Middleware, { router: unknown }>)(
    request,
    response,
    next
  );
};
export default middleware;
