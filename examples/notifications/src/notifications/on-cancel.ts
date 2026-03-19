import { subscribe } from "xmcp";

/**
 * Fires when the client cancels an in-flight request.
 * The SDK already handles aborting the request internally —
 * this handler runs alongside it (additive) for logging or cleanup.
 */
export default subscribe("notifications/cancelled", async (params) => {
  console.log(
    `[notification] Request ${params.requestId} was cancelled` +
      (params.reason ? `: ${params.reason}` : "")
  );
});
