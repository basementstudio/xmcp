import { subscribe } from "xmcp";

/**
 * Fires when the client's list of root URIs changes.
 * Use this to update workspace context, refresh file watchers, etc.
 */
export default subscribe("notifications/roots/list_changed", async () => {
  console.log(
    "[notification] Roots list changed — workspace context may need updating"
  );
});
