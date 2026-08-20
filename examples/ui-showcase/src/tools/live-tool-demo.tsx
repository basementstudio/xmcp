import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useMcpApp,
} from "@xmcp-dev/ui";
import { type ToolMetadata, type McpUiDisplayMode } from "xmcp";
import { parseToolResult } from "../lib/tool-result";

export const metadata: ToolMetadata = {
  name: "liveToolDemo",
  description:
    "Ops Console demo for MCP Apps: tool calling, polling, host connection state, and granted view modes in one operator workflow.",
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
  receivedAt: string;
}

const POLL_INTERVAL_MS = 2500;
const MAX_HISTORY = 6;

export default function handler() {
  const {
    callTool,
    requestDisplayMode,
    hostContext,
    hostCapabilities,
    isConnected,
  } = useMcpApp();
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [rawResult, setRawResult] = useState<unknown>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastModeResult, setLastModeResult] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableModes: McpUiDisplayMode[] = hostContext?.availableDisplayModes ?? [
    "inline",
    "fullscreen",
    "pip",
  ];
  const currentMode = hostContext?.displayMode ?? "inline";

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await callTool("serverStats");
      setRawResult(result);
      const parsed = parseToolResult<ServerStats>(result);

      if (!parsed) {
        throw new Error("Tool returned an unreadable payload");
      }

      setStats(parsed);
      setHistory((previous) => [
        {
          ...parsed,
          receivedAt: new Date().toLocaleTimeString(),
        },
        ...previous,
      ].slice(0, MAX_HISTORY));
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to call tool"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!polling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    void fetchStats();
    intervalRef.current = setInterval(() => {
      void fetchStats();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [polling]);

  const memoryPercent = useMemo(() => {
    if (!stats || stats.heapTotalMb === 0) return 0;
    return Math.round((stats.memoryUsageMb / stats.heapTotalMb) * 100);
  }, [stats]);

  const requestMode = async (mode: "inline" | "fullscreen" | "pip") => {
    setError(null);
    try {
      const result = await requestDisplayMode(mode);
      setLastModeResult(result.mode);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : `Failed to request ${mode}`
      );
    }
  };

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>MCP Apps Pattern</PageEyebrow>
        <PageTitle>Ops Console</PageTitle>
        <PageDescription>
          This is the main operator-style example: tool calls, live polling,
          host-aware view modes, and a debugging panel for raw tool responses.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-6">
        <Grid columns={4} gap={12}>
          <StatCard
            label="Host Bridge"
            value={isConnected ? "Connected" : "Standalone"}
            detail={
              isConnected
                ? "Tool calls route through the host"
                : "Host-only actions may fail outside supported clients"
            }
            className="border-emerald-900/50 bg-slate-950/90"
          />
          <StatCard
            label="Current Mode"
            value={String(currentMode)}
            detail={
              lastModeResult
                ? `Last granted: ${lastModeResult}`
                : "Request fullscreen or PiP from the panel below"
            }
            className="border-violet-900/50 bg-slate-950/90"
          />
          <StatCard
            label="Polling"
            value={polling ? "Live" : "Paused"}
            detail={`${POLL_INTERVAL_MS / 1000}s interval`}
            className="border-cyan-900/50 bg-slate-950/90"
          />
          <StatCard
            label="Tool Calls"
            value={String(history.length)}
            detail="Recent requests captured in history"
            className="border-amber-900/50 bg-slate-950/90"
          />
        </Grid>

        <Card className="border-cyan-900/60 bg-[linear-gradient(180deg,rgba(8,145,178,0.14),rgba(2,6,23,0.92))]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Controls</CardTitle>
                <CardDescription>
                  Refresh data, toggle polling, and request a larger host-owned
                  viewport when you need more room.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={
                    polling
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-700 text-slate-200"
                  }
                >
                  {polling ? "Polling" : "Manual"}
                </Badge>
                <Badge variant="outline" className="border-cyan-800 text-cyan-300">
                  tools.call={hostCapabilities?.serverTools?.call ? "yes" : "unknown"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void fetchStats()} disabled={loading}>
                {loading ? "Calling serverStats..." : "Refresh metrics"}
              </Button>
              <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-2">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  Live polling
                </span>
                <Switch
                  checked={polling}
                  onCheckedChange={(checked: boolean) => setPolling(checked)}
                />
              </div>
              {availableModes.map((mode) => (
                <Button
                  key={mode}
                  variant="secondary"
                  onClick={() => void requestMode(mode)}
                >
                  Request {mode}
                </Button>
              ))}
            </div>

            <Separator className="bg-slate-800" />

            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Uses <code>tools/call</code> plus <code>ui/request-display-mode</code>.
              The host decides whether fullscreen or PiP is allowed.
            </p>
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="error" className="border-red-900/60">
            <AlertTitle>Console Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {stats ? (
          <>
            <Grid columns={4} gap={12}>
              <StatCard
                label="Uptime"
                value={`${stats.uptime}s`}
                detail={stats.timestamp}
                className="border-emerald-900/40"
              />
              <StatCard
                label="Memory"
                value={`${stats.memoryUsageMb} MB`}
                detail={`Heap ${stats.heapTotalMb} MB`}
                className="border-cyan-900/40"
              />
              <StatCard
                label="CPU"
                value={`${stats.cpuLoadPercent}%`}
                detail="Synthetic load metric"
                className="border-violet-900/40"
              />
              <StatCard
                label="Requests / Min"
                value={stats.requestsPerMinute}
                detail={`${stats.activeConnections} active connections`}
                className="border-amber-900/40"
              />
            </Grid>

            <Card className="border-slate-700 bg-slate-950/90">
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Memory</span>
                    <span className="text-cyan-400">{memoryPercent}%</span>
                  </div>
                  <Progress value={memoryPercent} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">CPU</span>
                    <span className="text-violet-400">{stats.cpuLoadPercent}%</span>
                  </div>
                  <Progress value={stats.cpuLoadPercent} />
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        <Grid columns={2} gap={16}>
          <Card className="border-slate-700 bg-slate-950/90">
            <CardHeader>
              <CardTitle>Recent Poll History</CardTitle>
              <CardDescription>
                The latest serverStats calls captured by the console.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="rounded-lg border border-slate-800">
                <TableHeader>
                  <TableRow className="bg-slate-900/70 hover:bg-slate-900/70">
                    <TableHead>Fetched</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>Memory</TableHead>
                    <TableHead>RPM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-[hsl(var(--muted-foreground))]">
                        No tool calls yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((entry) => (
                      <TableRow key={`${entry.timestamp}-${entry.requestCount}`}>
                        <TableCell>{entry.receivedAt}</TableCell>
                        <TableCell>{entry.cpuLoadPercent}%</TableCell>
                        <TableCell>{entry.memoryUsageMb} MB</TableCell>
                        <TableCell>{entry.requestsPerMinute}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-950/90">
            <CardHeader>
              <CardTitle>Raw Tool Result</CardTitle>
              <CardDescription>
                Keep one debugging surface in the example so it is still useful
                when adapting the code for your own app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[340px] overflow-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
                {rawResult ? JSON.stringify(rawResult, null, 2) : "Call serverStats to inspect the MCP payload."}
              </pre>
            </CardContent>
          </Card>
        </Grid>
      </div>
    </AppShell>
  );
}
