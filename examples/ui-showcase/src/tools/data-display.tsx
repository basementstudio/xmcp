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
  Loader,
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
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "dataDisplay",
  description: "Focused stats, badges, separators, alerts, loader, and table examples for @xmcp-dev/ui",
};

const rows = [
  { surface: "StatCard", role: "summary", status: "stable" },
  { surface: "Alert", role: "feedback", status: "stable" },
  { surface: "Loader", role: "feedback", status: "visual" },
  { surface: "Table", role: "data", status: "stable" },
];

export default function handler() {
  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>Specific Components</PageEyebrow>
        <PageTitle>Data And Feedback</PageTitle>
        <PageDescription>
          Focused examples for stats, alerts, loaders, and tables with visible overrides.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-5xl gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Status"
            value="Stable"
            detail="Package-owned shadcn surface"
            className="border-emerald-900/60 bg-emerald-950/20"
          />
          <StatCard
            label="Overrides"
            value="Enabled"
            detail="Top-level className support"
            className="border-cyan-900/60 bg-cyan-950/20"
          />
          <StatCard
            label="Runtime"
            value="Static"
            detail="No MCP actions here"
            className="border-violet-900/60 bg-violet-950/20"
          />
        </div>

        <Card className="border-slate-700 bg-slate-950/90">
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
            <CardDescription>
              Focused examples for alert and loader primitives.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Default Badge</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge
                variant="outline"
                className="border-cyan-700 text-cyan-200"
              >
                Outline Override
              </Badge>
            </div>
            <Separator />
            <Alert className="border-emerald-800/70 bg-emerald-950/30" variant="success">
              <AlertTitle>Success state</AlertTitle>
              <AlertDescription>
                Override classes can shift tone without replacing the component.
              </AlertDescription>
            </Alert>
            <Separator className="bg-slate-700" />
            <Alert className="border-red-900/70 bg-red-950/30" variant="error">
              <AlertTitle>Error state</AlertTitle>
              <AlertDescription>
                The structure stays the same while the surface is customized per instance.
              </AlertDescription>
            </Alert>
            <Loader
              label="Styled loading row"
              className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3"
            />
          </CardContent>
        </Card>

        <Card className="border-indigo-900/60 bg-slate-950/95">
          <CardHeader>
            <CardTitle>Structured Data</CardTitle>
            <CardDescription>
              Table primitives with local static rows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="rounded-lg border border-slate-800 bg-slate-950/70">
              <TableHeader>
                <TableRow className="bg-indigo-950/20 hover:bg-indigo-950/20">
                  <TableHead className="text-indigo-300">Surface</TableHead>
                  <TableHead className="text-indigo-300">Role</TableHead>
                  <TableHead className="text-indigo-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.surface}>
                    <TableCell className="font-medium text-slate-100">
                      {row.surface}
                    </TableCell>
                    <TableCell className="capitalize text-cyan-300">
                      {row.role}
                    </TableCell>
                    <TableCell className="text-emerald-300">{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
