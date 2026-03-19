import { subscribe } from "xmcp";

/**
 * Fires when the client sends a progress update.
 * The SDK already tracks progress internally —
 * this handler runs alongside it (additive) for logging or custom metrics.
 */
export default subscribe("notifications/progress", async (params) => {
  const pct = params.total
    ? ` (${Math.round((params.progress / params.total) * 100)}%)`
    : "";
  console.log(
    `[notification] Progress${pct}: ${params.message ?? "no message"}`
  );
});
