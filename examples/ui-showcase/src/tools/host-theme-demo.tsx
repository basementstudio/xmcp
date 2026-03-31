import React from "react";
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
  Input,
  Label,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Separator,
  Alert,
  AlertTitle,
  AlertDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";
import { useMcpBridge } from "../lib/mcp-bridge";

export const metadata: ToolMetadata = {
  name: "hostThemeDemo",
  description:
    "Host theme adaptation — MCP Apps can detect and adapt to the host's theme (dark/light mode, CSS variables, fonts, safe areas)",
};

const HOST_CSS_VARS = [
  { variable: "--color-background-primary", description: "Primary background" },
  { variable: "--color-background-secondary", description: "Secondary background" },
  { variable: "--color-text-primary", description: "Primary text" },
  { variable: "--color-text-secondary", description: "Secondary text" },
  { variable: "--color-border-primary", description: "Primary border" },
  { variable: "--font-sans", description: "Sans-serif font" },
  { variable: "--font-mono", description: "Monospace font" },
];

function HostContextCard({ hostContext }: { hostContext: Record<string, unknown> | null }) {
  if (!hostContext) {
    return (
      <Card className="border-amber-900/60 bg-amber-950/20">
        <CardHeader>
          <CardTitle>Host Context</CardTitle>
          <CardDescription>
            No host context available. When running inside a compatible host
            (Claude, ChatGPT, VS Code), the host sends its theme, display mode,
            and safe area insets during initialization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="border-amber-800/60">
            <AlertTitle>Standalone Mode</AlertTitle>
            <AlertDescription>
              Connect this MCP server to a host to see live theme data. The host
              sends <code>McpUiHostContext</code> during the{" "}
              <code>ui/initialize</code> handshake and updates via{" "}
              <code>ui/hostContextChanged</code>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-900/60 bg-emerald-950/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Host Context</CardTitle>
          <Badge className="bg-emerald-600 text-white">Connected</Badge>
        </div>
        <CardDescription>
          Received from the host during initialization. Updates live via{" "}
          <code>ui/hostContextChanged</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="overflow-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
          {JSON.stringify(hostContext, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

export default function handler() {
  const bridge = useMcpBridge();

  const detectedTheme = bridge.hostContext?.theme ?? "unknown";
  const displayMode = bridge.hostContext?.displayMode ?? "unknown";
  const safeArea = bridge.hostContext?.safeAreaInsets as
    | { top: number; right: number; bottom: number; left: number }
    | undefined;

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>MCP Apps Capabilities</PageEyebrow>
        <PageTitle>Host Theme Adaptation</PageTitle>
        <PageDescription>
          MCP Apps receive the host's theme during initialization — dark/light
          mode, CSS variables, fonts, and safe area insets. Your UI can adapt to
          look native in any host.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-5xl gap-6">
        {/* Detection status */}
        <Grid columns={3} gap={12}>
          <Card className="border-slate-700 bg-slate-950/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Theme
              </p>
              <Badge
                className={
                  detectedTheme === "dark"
                    ? "bg-slate-700 text-slate-200"
                    : detectedTheme === "light"
                      ? "bg-white text-slate-900"
                      : "bg-amber-700 text-white"
                }
              >
                {detectedTheme}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-950/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Display Mode
              </p>
              <Badge variant="outline" className="border-slate-600">
                {displayMode}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-950/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Safe Area
              </p>
              <Badge variant="outline" className="border-slate-600">
                {safeArea
                  ? `${safeArea.top} ${safeArea.right} ${safeArea.bottom} ${safeArea.left}`
                  : "none"}
              </Badge>
            </CardContent>
          </Card>
        </Grid>

        {/* Raw host context */}
        <HostContextCard hostContext={bridge.hostContext as Record<string, unknown> | null} />

        {/* CSS variables reference */}
        <Card className="border-cyan-900/60 bg-[linear-gradient(180deg,rgba(8,145,178,0.1),rgba(2,6,23,0.92))]">
          <CardHeader>
            <CardTitle>Host CSS Variables</CardTitle>
            <CardDescription>
              The MCP Apps spec defines standard CSS variables that hosts provide.
              Apps can use these to match the host's visual style.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="rounded-lg border border-slate-800">
              <TableHeader>
                <TableRow className="bg-cyan-950/20 hover:bg-cyan-950/20">
                  <TableHead className="text-cyan-300">Variable</TableHead>
                  <TableHead className="text-cyan-300">Description</TableHead>
                  <TableHead className="text-cyan-300">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HOST_CSS_VARS.map((v) => {
                  const computedValue =
                    typeof window !== "undefined"
                      ? getComputedStyle(document.documentElement)
                          .getPropertyValue(v.variable)
                          .trim() || "—"
                      : "—";
                  return (
                    <TableRow key={v.variable}>
                      <TableCell className="font-mono text-xs text-slate-300">
                        {v.variable}
                      </TableCell>
                      <TableCell className="text-[hsl(var(--muted-foreground))]">
                        {v.description}
                      </TableCell>
                      <TableCell className="text-cyan-400">
                        {computedValue}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Side-by-side comparison */}
        <Card className="border-violet-900/60 bg-slate-950/90">
          <CardHeader>
            <CardTitle>Theme Comparison</CardTitle>
            <CardDescription>
              Same components rendered with the xmcp theme (left) vs what
              they'd look like with host-provided tokens (right).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Grid columns={2} gap={16}>
              <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
                  xmcp Theme
                </p>
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <div className="flex flex-col gap-1.5">
                  <Label>Input field</Label>
                  <Input placeholder="Themed input" />
                </div>
                <div className="flex gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                </div>
              </div>
              <div
                className="space-y-3 rounded-lg border border-slate-700 p-4"
                style={{
                  backgroundColor: "var(--color-background-primary, hsl(var(--background)))",
                  color: "var(--color-text-primary, hsl(var(--foreground)))",
                }}
              >
                <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
                  Host Theme (if available)
                </p>
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <div className="flex flex-col gap-1.5">
                  <Label>Input field</Label>
                  <Input placeholder="Host-themed input" />
                </div>
                <div className="flex gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                </div>
              </div>
            </Grid>
          </CardContent>
        </Card>

        {/* Code example */}
        <Card className="border-slate-700 bg-slate-950/60">
          <CardHeader>
            <CardTitle>Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400">
{`// Detect host theme during initialization
app.connect();

// Initial theme from hostContext
app.ontoolresult = (result) => {
  // result includes hostContext with theme info
};

// React to theme changes
app.onhostcontextchanged = (ctx) => {
  document.documentElement.dataset.theme = ctx.theme;
  // Apply CSS variables from ctx.styles
};

// Use host CSS variables in your styles
.my-component {
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}

// Or use data-theme selectors
[data-theme="dark"] .card { background: #1a1a2e; }
[data-theme="light"] .card { background: #ffffff; }`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
