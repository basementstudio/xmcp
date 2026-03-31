import React, { useState, useEffect, useRef, useCallback } from "react";
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
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Progress,
  Separator,
  StatCard,
  Switch,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";
import { useMcpBridge, parseToolResult } from "../lib/mcp-bridge";

export const metadata: ToolMetadata = {
  name: "pollingDashboard",
  description:
    "Real-time dashboard that polls serverStats on interval — demonstrates the data polling MCP Apps pattern for live monitoring",
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

interface HistoryEntry extends ServerStats {
  fetchedAt: string;
}

const MAX_HISTORY = 8;
const POLL_INTERVAL = 2000;

export default function handler() {
  const bridge = useMcpBridge();
  const [polling, setPolling] = useState(false);
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchOnce = useCallback(async () => {
    try {
      const result = await bridge.callTool("serverStats");
      const parsed = parseToolResult<ServerStats>(result);
      if (parsed) {
        setStats(parsed);
        setError(null);
        setPollCount((c) => c + 1);
        setHistory((prev) => {
          const entry: HistoryEntry = {
            ...parsed,
            fetchedAt: new Date().toLocaleTimeString(),
          };
          return [entry, ...prev].slice(0, MAX_HISTORY);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Poll failed");
    }
  }, [bridge]);

  // Start/stop polling
  useEffect(() => {
    if (polling) {
      fetchOnce(); // immediate first fetch
      intervalRef.current = setInterval(fetchOnce, POLL_INTERVAL);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [polling, fetchOnce]);

  const memPercent = stats
    ? Math.round((stats.memoryUsageMb / stats.heapTotalMb) * 100)
    : 0;

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>MCP Apps Capabilities</PageEyebrow>
        <PageTitle>Polling Dashboard</PageTitle>
        <PageDescription>
          Live-updating dashboard that polls the <code>serverStats</code> tool
          every {POLL_INTERVAL / 1000}s — the real-time monitoring pattern from
          the MCP Apps spec.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-5xl gap-6">
        {/* Controls */}
        <Card className="border-cyan-900/60 bg-[linear-gradient(180deg,rgba(8,145,178,0.1),rgba(2,6,23,0.92))]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Polling Controls</CardTitle>
                <CardDescription>
                  Toggle live polling on/off. Uses{" "}
                  <code>setInterval + callTool</code> pattern.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={
                    polling
                      ? "animate-pulse bg-emerald-600 text-white"
                      : "bg-slate-700 text-slate-300"
                  }
                >
                  {polling ? "Live" : "Paused"}
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  {pollCount} polls
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Label>Enable Polling</Label>
                <Switch
                  checked={polling}
                  onCheckedChange={(checked: boolean) => setPolling(checked)}
                />
              </div>
              <Button
                variant="secondary"
                onClick={fetchOnce}
                disabled={polling}
              >
                Fetch Once
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setHistory([]);
                  setPollCount(0);
                }}
              >
                Clear History
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="error" className="border-red-900/60">
            <AlertTitle>Poll Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Live metrics */}
        {stats && (
          <>
            <Grid columns={4} gap={12}>
              <StatCard
                label="CPU Load"
                value={`${stats.cpuLoadPercent}%`}
                detail="Simulated"
                className="border-violet-900/40"
              />
              <StatCard
                label="Memory"
                value={`${stats.memoryUsageMb}MB`}
                detail={`${memPercent}% of heap`}
                className="border-cyan-900/40"
              />
              <StatCard
                label="Connections"
                value={String(stats.activeConnections)}
                detail="Active"
                className="border-emerald-900/40"
              />
              <StatCard
                label="Throughput"
                value={`${stats.requestsPerMinute}`}
                detail="req/min"
                className="border-amber-900/40"
              />
            </Grid>

            {/* Progress bars */}
            <Card className="border-slate-700 bg-slate-950/90">
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">CPU</span>
                    <span className="text-violet-400">{stats.cpuLoadPercent}%</span>
                  </div>
                  <Progress value={stats.cpuLoadPercent} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Memory</span>
                    <span className="text-cyan-400">{memPercent}%</span>
                  </div>
                  <Progress value={memPercent} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Connections</span>
                    <span className="text-emerald-400">
                      {Math.round((stats.activeConnections / 250) * 100)}%
                    </span>
                  </div>
                  <Progress value={Math.round((stats.activeConnections / 250) * 100)} />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* History table */}
        {history.length > 0 && (
          <Card className="border-indigo-900/50 bg-slate-950/95">
            <CardHeader>
              <CardTitle>Poll History</CardTitle>
              <CardDescription>
                Last {MAX_HISTORY} readings. Each row is a separate{" "}
                <code>tools/call</code> round-trip.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="rounded-lg border border-slate-800">
                <TableHeader>
                  <TableRow className="bg-indigo-950/20 hover:bg-indigo-950/20">
                    <TableHead className="text-indigo-300">Time</TableHead>
                    <TableHead className="text-indigo-300">CPU</TableHead>
                    <TableHead className="text-indigo-300">Memory</TableHead>
                    <TableHead className="text-indigo-300">Conns</TableHead>
                    <TableHead className="text-indigo-300">Req/min</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs text-slate-400">
                        {entry.fetchedAt}
                      </TableCell>
                      <TableCell className="text-violet-300">
                        {entry.cpuLoadPercent}%
                      </TableCell>
                      <TableCell className="text-cyan-300">
                        {entry.memoryUsageMb}MB
                      </TableCell>
                      <TableCell className="text-emerald-300">
                        {entry.activeConnections}
                      </TableCell>
                      <TableCell className="text-amber-300">
                        {entry.requestsPerMinute}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pattern explanation */}
        <Card className="border-slate-700 bg-slate-950/60">
          <CardHeader>
            <CardTitle>Polling Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400">
{`// MCP Apps polling pattern
useEffect(() => {
  const interval = setInterval(async () => {
    const result = await app.callServerTool({
      name: "serverStats",
      arguments: {}
    });
    updateUI(result);
  }, ${POLL_INTERVAL});

  // Cleanup on teardown (MCP Apps lifecycle)
  app.onteardown = () => clearInterval(interval);

  return () => clearInterval(interval);
}, []);`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
