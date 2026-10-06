import { stripeMeterEvents, metronomeEvents } from "@xmcp-dev/billing";
import { openStore } from "./src/store.js";
const provider = process.env.BILLING_PROVIDER;
if (provider !== "stripe" && provider !== "metronome")
  throw new Error("Set BILLING_PROVIDER to stripe or metronome");
const secretKey = process.env.BILLING_SECRET_KEY,
  eventName = process.env.BILLING_EVENT_NAME;
if (!secretKey || !eventName)
  throw new Error("Set BILLING_SECRET_KEY and BILLING_EVENT_NAME");
const deliver = (provider === "stripe" ? stripeMeterEvents : metronomeEvents)({
  secretKey,
  eventName,
});
const store = openStore();
try {
  for (const event of store.pending()) {
    // Do not replay old ambiguous deliveries outside either provider's dedupe
    // window. Reconcile them with the provider before manually marking delivered.
    const MAX_AUTOMATIC_RETRY_AGE_MS = 23 * 60 * 60 * 1000;
    if (Date.now() - Date.parse(event.timestamp) > MAX_AUTOMATIC_RETRY_AGE_MS)
      throw new Error(
        `Reconcile stale usage event ${event.id} before retrying`
      );
    await deliver(event);
    store.delivered(event.id);
  }
} finally {
  store.close();
}
