import { defineNotifications } from "xmcp";

export default defineNotifications({
  initialized: async () => {
    console.log("[notification] Client session initialized");
  },
  rootsListChanged: async () => {
    console.log("[notification] Roots list changed");
  },
  cancelled: async (params) => {
    console.log(
      `[notification] Request ${params.requestId} cancelled${params.reason ? `: ${params.reason}` : ""}`
    );
  },
  progress: async (params) => {
    const pct =
      params.total != null
        ? ` (${Math.round((params.progress / params.total) * 100)}%)`
        : "";
    console.log(
      `[notification] Progress${pct}: ${params.message ?? "no message"}`
    );
  },
  taskStatus: async (params) => {
    console.log(
      `[notification] Task ${params.taskId}: ${params.status}${params.statusMessage ? ` - ${params.statusMessage}` : ""}`
    );
  },

  // Custom notification methods are also supported
  "custom/my-event": async (params) => {
    console.log("[notification] Custom event received:", params);
  },
});
