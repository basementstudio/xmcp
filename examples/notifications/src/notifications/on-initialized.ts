import { subscribe } from "xmcp";

/**
 * Fires when the client completes the initialization handshake.
 * Use this for one-time setup that requires a live session.
 */
export default subscribe("notifications/initialized", async () => {
  console.log("[notification] Client session initialized");
});
