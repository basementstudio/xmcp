import React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AppShell,
  Badge,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "showcase",
  description:
    "Landing page for the refreshed ui showcase, organized around real MCP App examples and a smaller component reference set.",
};

const primaryDemos = [
  {
    tool: "liveToolDemo",
    title: "Ops Console",
    summary:
      "One realistic operator workflow: tool calls, polling, granted display modes, and status-driven UI.",
    capabilities: ["tools/call", "polling", "fullscreen", "pip"],
  },
  {
    tool: "hostThemeDemo",
    title: "Host-Aware Workspace",
    summary:
      "Theme, safe areas, CSS variables, available display modes, and auto-size reporting in one host-first example.",
    capabilities: [
      "host-context",
      "host-capabilities",
      "size-changed",
      "css variables",
    ],
  },
  {
    tool: "resourceComposerDemo",
    title: "Resource + Composer Demo",
    summary:
      "Reads a real resource, then uses messaging and model-context updates to show host-mediated content flows.",
    capabilities: [
      "resources/read",
      "ui/message",
      "ui/update-model-context",
    ],
  },
  {
    tool: "schemaAppDemo",
    title: "Schema App Demo",
    summary:
      "Proves that schema-driven apps can run with host-backed transport and still call tools through the MCP App host.",
    capabilities: ["Rendered", "transportMode=host", "call-tool action"],
  },
];

const secondaryDemos = [
  { tool: "renderJson", purpose: "Raw schema renderer for copy-paste JSON experiments" },
];

export default function handler() {
  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>MCP Apps Showcase</PageEyebrow>
        <PageTitle>Better Examples, Fewer Toys</PageTitle>
        <PageDescription>
          The main ui showcase is now organized around complete MCP App
          patterns instead of isolated methods. Start with the four primary
          demos below, then use the secondary tools as focused references.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Alert
          variant="info"
          className="border-cyan-900/70 bg-cyan-950/20"
        >
          <AlertTitle>How to use this showcase</AlertTitle>
          <AlertDescription>
            Open the tools named below from your MCP host. The primary examples
            are the intended learning path for custom React apps, host-aware
            experiences, resources, and schema-driven UIs.
          </AlertDescription>
        </Alert>

        <Grid columns={4} gap={16}>
          <Card className="border-emerald-900/60 bg-slate-950/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Primary Demos
              </p>
              <div className="text-3xl font-semibold tracking-tight">4</div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Complete MCP App patterns
              </p>
            </CardContent>
          </Card>
          <Card className="border-cyan-900/60 bg-slate-950/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Host APIs
              </p>
              <div className="text-3xl font-semibold tracking-tight">7+</div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Tools, view modes, resources, and messaging
              </p>
            </CardContent>
          </Card>
          <Card className="border-violet-900/60 bg-slate-950/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                UI Styles
              </p>
              <div className="text-3xl font-semibold tracking-tight">2</div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Handwritten React and schema-driven
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-900/60 bg-slate-950/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Secondary Tools
              </p>
              <div className="text-3xl font-semibold tracking-tight">1</div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Focused raw schema reference
              </p>
            </CardContent>
          </Card>
        </Grid>

        <Card className="border-slate-700 bg-[linear-gradient(180deg,rgba(8,145,178,0.08),rgba(2,6,23,0.92))]">
          <CardHeader>
            <CardTitle>Primary MCP App Demos</CardTitle>
            <CardDescription>
              These are the recommended starting points for understanding the
              current `xmcp` MCP App story.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {primaryDemos.map((demo) => (
              <div
                key={demo.tool}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
                      {demo.tool}
                    </p>
                    <h3 className="text-xl font-semibold text-slate-100">
                      {demo.title}
                    </h3>
                    <p className="max-w-3xl text-sm text-[hsl(var(--muted-foreground))]">
                      {demo.summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {demo.capabilities.map((capability) => (
                      <Badge
                        key={capability}
                        variant="outline"
                        className="border-cyan-800 text-cyan-300"
                      >
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-fuchsia-900/60 bg-[linear-gradient(180deg,rgba(88,28,135,0.15),rgba(2,6,23,0.92))]">
          <CardHeader>
            <CardTitle>Secondary Reference Tools</CardTitle>
            <CardDescription>
              Useful when you want a smaller, more focused example after working
              through the primary demos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="rounded-lg border border-slate-800">
              <TableHeader>
                <TableRow className="bg-fuchsia-950/20 hover:bg-fuchsia-950/20">
                  <TableHead className="text-fuchsia-300">Tool</TableHead>
                  <TableHead className="text-fuchsia-300">Why it still exists</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {secondaryDemos.map((demo) => (
                  <TableRow key={demo.tool}>
                    <TableCell className="font-mono text-xs text-slate-300">
                      {demo.tool}
                    </TableCell>
                    <TableCell className="text-[hsl(var(--muted-foreground))]">
                      {demo.purpose}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Separator className="bg-slate-800" />

        <Grid columns={2} gap={16}>
          <Card className="border-slate-700 bg-slate-950/90">
            <CardHeader>
              <CardTitle>What’s new in the examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <p>Tools and polling are shown inside a single operator workflow.</p>
              <p>Host context is treated as layout and behavior data, not just a JSON dump.</p>
              <p>Resources, messages, and model context now have a dedicated end-to-end demo.</p>
              <p>Schema-driven apps finally prove host-backed execution, not only HTTP rendering.</p>
              <p>The redundant component-gallery tools were removed to keep the package focused.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-950/90">
            <CardHeader>
              <CardTitle>What to build after this</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <p>Use handwritten React when the interaction model is bespoke.</p>
              <p>Use schema-driven UI when the app is mostly declarative and repeatable.</p>
              <p>Keep the host bridge as the app runtime source of truth when running inside MCP hosts.</p>
              <p>Use resources for durable seed content instead of hardcoded prompt strings.</p>
            </CardContent>
          </Card>
        </Grid>
      </div>
    </AppShell>
  );
}
