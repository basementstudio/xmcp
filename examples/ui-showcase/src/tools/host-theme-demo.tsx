import React, { useMemo, useRef, useState } from "react";
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
  Separator,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useAutoMcpAppSize,
  useMcpApp,
} from "@xmcp-dev/ui";
import { type ToolMetadata, type McpUiDisplayMode } from "xmcp";

export const metadata: ToolMetadata = {
  name: "hostThemeDemo",
  description:
    "Host-Aware Workspace demo for MCP Apps: host context, CSS variables, view modes, safe areas, and size reporting.",
};

const DEMO_VARIABLES = [
  "--color-background-primary",
  "--color-background-secondary",
  "--color-text-primary",
  "--color-border-primary",
  "--font-sans",
  "--font-mono",
];

export default function handler() {
  const {
    hostContext,
    hostCapabilities,
    requestDisplayMode,
    isConnected,
  } = useMcpApp();
  const [expanded, setExpanded] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useAutoMcpAppSize(layoutRef);

  const availableModes: McpUiDisplayMode[] = hostContext?.availableDisplayModes ?? [
    "inline",
    "fullscreen",
    "pip",
  ];
  const cssValues = useMemo(() => {
    if (typeof window === "undefined") {
      return [];
    }
    const styles = getComputedStyle(document.documentElement);
    return DEMO_VARIABLES.map((name) => ({
      name,
      value: styles.getPropertyValue(name).trim() || "—",
    }));
  }, [hostContext]);

  const safeArea = hostContext?.safeAreaInsets;
  const currentMode = hostContext?.displayMode ?? "inline";
  const theme = hostContext?.theme ?? "unknown";
  const container = hostContext?.containerDimensions;

  const requestMode = async (mode: "inline" | "fullscreen" | "pip") => {
    setModeError(null);
    try {
      await requestDisplayMode(mode);
    } catch (error) {
      setModeError(
        error instanceof Error ? error.message : `Failed to request ${mode}`
      );
    }
  };

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>MCP Apps Pattern</PageEyebrow>
        <PageTitle>Host-Aware Workspace</PageTitle>
        <PageDescription>
          This example treats host context as real layout and styling input:
          granted view modes, safe areas, available host tokens, and an
          auto-sized panel that reports dimensions back to the host.
        </PageDescription>
      </PageHeader>

      <div ref={layoutRef} className="mx-auto grid max-w-6xl gap-6">
        <Grid columns={4} gap={12}>
          <StatCard
            label="Theme"
            value={theme}
            detail="Host-provided appearance"
            className="border-[hsl(var(--border))] bg-[hsl(var(--card))]"
          />
          <StatCard
            label="Mode"
            value={String(currentMode)}
            detail={`Available: ${availableModes.join(", ")}`}
            className="border-[color:color-mix(in_oklab,hsl(var(--border))_65%,rgb(124,58,237)_35%)] bg-[hsl(var(--card))]"
          />
          <StatCard
            label="Container"
            value={container ? `${container.width ?? "?"}×${container.height ?? "?"}` : "unknown"}
            detail="From host context"
            className="border-[color:color-mix(in_oklab,hsl(var(--border))_65%,rgb(6,182,212)_35%)] bg-[hsl(var(--card))]"
          />
          <StatCard
            label="Auto Size"
            value={hostCapabilities ? "Enabled" : "Passive"}
            detail="ResizeObserver sends size changes"
            className="border-[color:color-mix(in_oklab,hsl(var(--border))_65%,rgb(16,185,129)_35%)] bg-[hsl(var(--card))]"
          />
        </Grid>

        {!isConnected ? (
          <Alert variant="warning" className="border-amber-900/60">
            <AlertTitle>Standalone mode</AlertTitle>
            <AlertDescription>
              This demo still renders, but it is most useful inside a host that
              sends theme, view mode, and container updates.
            </AlertDescription>
          </Alert>
        ) : null}

        {modeError ? (
          <Alert variant="error" className="border-red-900/60">
            <AlertTitle>View mode request failed</AlertTitle>
            <AlertDescription>{modeError}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-[color:color-mix(in_oklab,hsl(var(--border))_60%,rgb(124,58,237)_40%)] bg-[linear-gradient(180deg,color-mix(in_oklab,hsl(var(--card))_92%,rgb(124,58,237)_8%),hsl(var(--card)))]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Viewport Controls</CardTitle>
                <CardDescription>
                  Ask the host for inline, fullscreen, or picture-in-picture.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-violet-400/40 text-violet-500 dark:text-violet-300">
                current={String(currentMode)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {availableModes.map((mode) => (
              <Button
                key={mode}
                onClick={() => void requestMode(mode)}
                variant={mode === currentMode ? "primary" : "secondary"}
              >
                Request {mode}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Grid columns={2} gap={16}>
          <Card className="border-[color:color-mix(in_oklab,hsl(var(--border))_60%,rgb(6,182,212)_40%)] bg-[linear-gradient(180deg,color-mix(in_oklab,hsl(var(--card))_92%,rgb(6,182,212)_8%),hsl(var(--card)))]">
            <CardHeader>
              <CardTitle>Resize-Aware Panel</CardTitle>
              <CardDescription>
                Toggle this panel to trigger <code>ui/notifications/size-changed</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={panelRef}
                className="rounded-xl border border-cyan-500/30 bg-[hsl(var(--background))] p-5 transition-all"
                style={{
                  minHeight: expanded ? 280 : 140,
                  paddingTop: safeArea?.top ? 20 + safeArea.top : 20,
                  paddingBottom: safeArea?.bottom ? 20 + safeArea.bottom : 20,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                      Host-aware layout panel
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Safe area top={safeArea?.top ?? 0}, right={safeArea?.right ?? 0},
                      bottom={safeArea?.bottom ?? 0}, left={safeArea?.left ?? 0}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setExpanded((current) => !current)}
                  >
                    {expanded ? "Collapse" : "Expand"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <CardHeader>
              <CardTitle>Host Context</CardTitle>
              <CardDescription>
                Keep one raw panel so developers can map their host’s payload to
                the visual behavior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[300px] overflow-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-xs text-[hsl(var(--foreground))]">
                {JSON.stringify(hostContext, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </Grid>

        <Separator className="bg-slate-800" />

        <Grid columns={2} gap={16}>
          <Card className="border-[color:color-mix(in_oklab,hsl(var(--border))_60%,rgb(16,185,129)_40%)] bg-[hsl(var(--card))]">
            <CardHeader>
              <CardTitle>Computed CSS Variables</CardTitle>
              <CardDescription>
                Read the live host tokens that are currently affecting the UI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="rounded-lg border border-[hsl(var(--border))]">
                <TableHeader>
                  <TableRow className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]">
                    <TableHead>Variable</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cssValues.map((variable) => (
                    <TableRow key={variable.name}>
                      <TableCell className="font-mono text-xs text-[hsl(var(--foreground))]">
                        {variable.name}
                      </TableCell>
                      <TableCell className="text-[hsl(var(--foreground))]">
                        {variable.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <CardHeader>
              <CardTitle>Host Capabilities</CardTitle>
              <CardDescription>
                The bridge state is more useful when the app surfaces what the
                host claims to support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[300px] overflow-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-xs text-[hsl(var(--foreground))]">
                {JSON.stringify(hostCapabilities, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </Grid>
      </div>
    </AppShell>
  );
}
