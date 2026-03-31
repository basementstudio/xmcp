import React, { useState } from "react";
import {
  AppShell,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
  Loader,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Separator,
  StatCard,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";
import { useMcpBridge, parseToolResult } from "../lib/mcp-bridge";

export const metadata: ToolMetadata = {
  name: "liveToolDemo",
  description:
    "Demonstrates live MCP tool calling — the core MCP Apps capability. The UI calls serverStats through the host and displays results.",
};

interface ServerStats {
  timestamp: string;
  uptime: number;
  memoryUsageMb: number;
  heapTotalMb: number;
  cpuLoadPercent: number;
  activeConnections: number;
  requestsPerMinute: number;
  requestCount: number;
}

export default function handler() {
  const bridge = useMcpBridge();
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callCount, setCallCount] = useState(0);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await bridge.callTool("serverStats");
      const parsed = parseToolResult<ServerStats>(result);
      if (parsed) {
        setStats(parsed);
        setCallCount((c) => c + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to call tool");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>MCP Apps Capabilities</PageEyebrow>
        <PageTitle>Live Tool Calling</PageTitle>
        <PageDescription>
          The core MCP Apps value prop — your UI calls tools on the MCP server
          through the host, and renders the results. No separate API needed.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-5xl gap-6">
        {/* Connection status */}
        <Card className="border-slate-700 bg-slate-950/90">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bridge Status</CardTitle>
              <Badge
                className={
                  bridge.isConnected
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-600 text-white"
                }
              >
                {bridge.isConnected ? "Connected to Host" : "Standalone Mode"}
              </Badge>
            </div>
            <CardDescription>
              {bridge.isConnected
                ? "Connected via MCP Apps postMessage bridge. Tool calls are proxied through the host."
                : "Not running inside an MCP Apps host. Tool calls require a compatible host (Claude, ChatGPT, basic-host)."}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Call button */}
        <Card className="border-cyan-900/60 bg-[linear-gradient(180deg,rgba(8,145,178,0.12),rgba(2,6,23,0.92))]">
          <CardHeader>
            <CardTitle>Call Server Tool</CardTitle>
            <CardDescription>
              Click the button to call the <code>serverStats</code> tool via the
              MCP Apps bridge. The request goes: App → Host → Server → Host →
              App.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Button onClick={fetchStats} disabled={loading}>
                {loading ? "Calling..." : "Call serverStats"}
              </Button>
              <Badge variant="outline" className="border-cyan-800 text-cyan-400">
                {callCount} calls made
              </Badge>
            </div>

            {loading && <Loader label="Waiting for tool response..." />}

            {error && (
              <Alert variant="error" className="border-red-900/60">
                <AlertTitle>Tool Call Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {stats && (
          <>
            <Grid columns={4} gap={12}>
              <StatCard
                label="Uptime"
                value={`${stats.uptime}s`}
                detail="Server process uptime"
                className="border-emerald-900/40"
              />
              <StatCard
                label="Memory"
                value={`${stats.memoryUsageMb}MB`}
                detail={`of ${stats.heapTotalMb}MB heap`}
                className="border-cyan-900/40"
              />
              <StatCard
                label="CPU Load"
                value={`${stats.cpuLoadPercent}%`}
                detail="Simulated metric"
                className="border-violet-900/40"
              />
              <StatCard
                label="Connections"
                value={String(stats.activeConnections)}
                detail={`${stats.requestsPerMinute} req/min`}
                className="border-amber-900/40"
              />
            </Grid>

            <Card className="border-slate-700 bg-slate-950/90">
              <CardHeader>
                <CardTitle>Raw Response</CardTitle>
                <CardDescription>
                  The JSON returned by the <code>serverStats</code> tool at{" "}
                  {new Date(stats.timestamp).toLocaleTimeString()}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
                  {JSON.stringify(stats, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}

        {/* How it works */}
        <Card className="border-slate-700 bg-slate-950/60">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3 text-center text-xs">
              {["App UI", "→ postMessage →", "Host (Claude)", "→ MCP →", "Server"].map(
                (step, i) => (
                  <div
                    key={i}
                    className={
                      i % 2 === 0
                        ? "rounded-lg border border-slate-700 bg-slate-900/70 p-3 font-medium text-slate-200"
                        : "flex items-center justify-center text-[hsl(var(--muted-foreground))]"
                    }
                  >
                    {step}
                  </div>
                )
              )}
            </div>
            <Separator className="my-4 bg-slate-800" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              The app sends a <code>tools/call</code> JSON-RPC request via{" "}
              <code>window.parent.postMessage</code>. The host intercepts it,
              forwards it to the MCP server, and returns the response back to the
              app. No direct server connection needed.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
