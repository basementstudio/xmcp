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
  Link,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Separator,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";
import { useMcpBridge } from "../lib/mcp-bridge";

export const metadata: ToolMetadata = {
  name: "displayModeDemo",
  description:
    "Display mode (fullscreen/inline) and open links — MCP Apps can request layout changes and navigate through the host",
};

export default function handler() {
  const bridge = useMcpBridge();
  const [displayMode, setDisplayMode] = useState<string>("inline");
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleDisplayMode = async () => {
    const nextMode = displayMode === "inline" ? "fullscreen" : "inline";
    setError(null);
    try {
      const result = await bridge.requestDisplayMode(nextMode);
      setDisplayMode(result.mode ?? nextMode);
      setLastAction(`Display mode changed to ${result.mode ?? nextMode}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Host does not support display mode changes"
      );
    }
  };

  const handleOpenLink = async (url: string, label: string) => {
    setError(null);
    try {
      await bridge.openLink(url);
      setLastAction(`Opened: ${label}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to open link"
      );
    }
  };

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>MCP Apps Capabilities</PageEyebrow>
        <PageTitle>Display Mode & Links</PageTitle>
        <PageDescription>
          MCP Apps can request display mode changes (inline ↔ fullscreen) and
          open external links through the host. All via the postMessage bridge.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-5xl gap-6">
        {/* Connection status */}
        <Card className="border-slate-700 bg-slate-950/90">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Status</CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    bridge.isConnected
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-600 text-white"
                  }
                >
                  {bridge.isConnected ? "Host Connected" : "Standalone"}
                </Badge>
                <Badge variant="outline" className="border-slate-600">
                  Mode: {displayMode}
                </Badge>
              </div>
            </div>
          </CardHeader>
          {lastAction && (
            <CardContent>
              <p className="text-sm text-emerald-400">{lastAction}</p>
            </CardContent>
          )}
        </Card>

        {error && (
          <Alert variant="error" className="border-red-900/60">
            <AlertTitle>Action Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Display mode */}
        <Card className="border-violet-900/60 bg-[linear-gradient(180deg,rgba(88,28,135,0.12),rgba(2,6,23,0.92))]">
          <CardHeader>
            <CardTitle>Display Mode</CardTitle>
            <CardDescription>
              Request the host to change the app's display mode. Fullscreen
              removes the chat UI and gives the app the entire viewport.
              Inline returns to the normal embedded view.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Grid columns={2} gap={12}>
              <Button
                onClick={toggleDisplayMode}
                className={
                  displayMode === "inline"
                    ? "bg-violet-600 text-white hover:bg-violet-500"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }
              >
                {displayMode === "inline"
                  ? "Enter Fullscreen"
                  : "Exit to Inline"}
              </Button>
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <span>Current:</span>
                <Badge
                  className={
                    displayMode === "fullscreen"
                      ? "bg-violet-600 text-white"
                      : "bg-slate-700 text-slate-300"
                  }
                >
                  {displayMode}
                </Badge>
              </div>
            </Grid>

            <Separator className="bg-slate-800" />

            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Uses <code>ui/requestDisplayMode</code> via postMessage. The host
              responds with the granted mode (it may deny the request).
            </p>
          </CardContent>
        </Card>

        {/* Open links */}
        <Card className="border-cyan-900/60 bg-[linear-gradient(180deg,rgba(8,145,178,0.1),rgba(2,6,23,0.92))]">
          <CardHeader>
            <CardTitle>Open Links via Host</CardTitle>
            <CardDescription>
              MCP Apps are sandboxed — they can't navigate directly. Instead,
              they request the host to open links via{" "}
              <code>ui/openLink</code>. Falls back to{" "}
              <code>window.open</code> in standalone mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                url: "https://modelcontextprotocol.io/extensions/apps/overview",
                label: "MCP Apps Overview",
                color: "bg-cyan-600 hover:bg-cyan-500",
              },
              {
                url: "https://apps.extensions.modelcontextprotocol.io/api/",
                label: "MCP Apps API Docs",
                color: "bg-violet-600 hover:bg-violet-500",
              },
              {
                url: "https://github.com/modelcontextprotocol/ext-apps",
                label: "ext-apps Repository",
                color: "bg-emerald-600 hover:bg-emerald-500",
              },
            ].map(({ url, label, color }) => (
              <div key={url} className="flex items-center gap-3">
                <Button
                  className={`${color} text-white`}
                  onClick={() => handleOpenLink(url, label)}
                >
                  Open: {label}
                </Button>
                <span className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                  {url}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Code example */}
        <Card className="border-slate-700 bg-slate-950/60">
          <CardHeader>
            <CardTitle>Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400">
{`// Request fullscreen
const result = await app.requestDisplayMode({
  mode: "fullscreen"
});
// result.mode === "fullscreen" (or denied)

// Open a link through the host
await app.sendOpenLink({
  url: "https://example.com"
});
// Host opens it — app stays sandboxed

// Listen for display mode changes
app.onhostcontextchanged = (ctx) => {
  if (ctx.displayMode === "fullscreen") {
    // Remove border-radius, expand layout
  }
};`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
