import { defineNotifications } from "xmcp";
import { track } from "./analytics";

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

  // Custom notification: track an app-level analytics event.
  // Shares the same tracker as tool invocations, so both paths
  // contribute to one running count per event name.
  "app/analytics-event": async (params) => {
    const name = typeof params.name === "string" ? params.name : "unknown";
    track(name, params.properties as Record<string, unknown> | undefined);
  },
});
