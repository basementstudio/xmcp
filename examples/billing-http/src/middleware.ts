import { usageBilling } from "@xmcp-dev/billing";
import { openStore } from "./store";
let store: ReturnType<typeof openStore> | undefined;
export const mcp = usageBilling({
  customer: (context) => {
    const key = process.env.DEMO_API_KEY;
    return key && context.http?.headers.authorization === `Bearer ${key}`
      ? process.env.BILLING_CUSTOMER_ID
      : undefined;
  },
  units: (context) => (context.params.name === "report" ? 3 : 1),
  admit: (event) => {
    store ??= openStore();
    return store.admit(event);
  },
});
