import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "serverStats",
  description:
    "Returns live server metrics. Used as a backend data source by the live-tool-demo and polling-dashboard showcase tools.",
};

let requestCounter = 0;

export default function handler() {
  requestCounter++;

  const mem = process.memoryUsage();

  const stats = {
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    memoryUsageMb: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    cpuLoadPercent: Math.round(Math.random() * 60 + 10), // simulated
    activeConnections: Math.floor(Math.random() * 200) + 50, // simulated
    requestsPerMinute: Math.floor(Math.random() * 500) + 100, // simulated
    requestCount: requestCounter,
  };

  return {
    structuredContent: stats,
    content: [{ type: "text" as const, text: JSON.stringify(stats) }],
  };
}
