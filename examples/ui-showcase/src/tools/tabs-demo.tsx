import React, { useState } from "react";
import {
  AppShell,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Label,
  Separator,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "tabsDemo",
  description:
    "Tabs component showcase — organise content in constrained MCP App viewports without scrolling",
};

export default function handler() {
  const [activeTab, setActiveTab] = useState("overview");
  const [styleTab, setStyleTab] = useState("minimal");

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>New Components</PageEyebrow>
        <PageTitle>Tabs</PageTitle>
        <PageDescription>
          Organise content into panels within the constrained iframe viewport of
          an MCP App. Built on Radix UI for accessibility and keyboard
          navigation.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-5xl gap-6">
        {/* Basic tabs with real content */}
        <Card className="border-cyan-900/60 bg-[linear-gradient(180deg,rgba(8,145,178,0.12),rgba(2,6,23,0.92))]">
          <CardHeader>
            <CardTitle>Dashboard Tabs</CardTitle>
            <CardDescription>
              A realistic example — switching between overview, metrics, and
              settings in a single MCP App view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid gap-4 pt-4 md:grid-cols-3">
                  <StatCard
                    label="Active Users"
                    value="2,847"
                    detail="+12% from last week"
                    className="border-cyan-900/40"
                  />
                  <StatCard
                    label="Requests"
                    value="14.2k"
                    detail="Last 24 hours"
                    className="border-emerald-900/40"
                  />
                  <StatCard
                    label="Avg Latency"
                    value="48ms"
                    detail="p95: 120ms"
                    className="border-violet-900/40"
                  />
                </div>
              </TabsContent>

              <TabsContent value="metrics">
                <div className="pt-4">
                  <Table className="rounded-lg border border-slate-800">
                    <TableHeader>
                      <TableRow className="bg-cyan-950/20 hover:bg-cyan-950/20">
                        <TableHead className="text-cyan-300">
                          Endpoint
                        </TableHead>
                        <TableHead className="text-cyan-300">Calls</TableHead>
                        <TableHead className="text-cyan-300">
                          Avg (ms)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { endpoint: "/api/users", calls: "4,210", avg: "32" },
                        { endpoint: "/api/search", calls: "8,930", avg: "67" },
                        { endpoint: "/api/export", calls: "1,050", avg: "240" },
                      ].map((row) => (
                        <TableRow key={row.endpoint}>
                          <TableCell className="font-mono text-slate-200">
                            {row.endpoint}
                          </TableCell>
                          <TableCell className="text-emerald-300">
                            {row.calls}
                          </TableCell>
                          <TableCell className="text-amber-300">
                            {row.avg}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <div className="space-y-4 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <Label>Server Name</Label>
                    <Input
                      placeholder="my-mcp-server"
                      className="max-w-sm border-slate-700"
                    />
                  </div>
                  <Alert variant="info" className="border-cyan-800/60">
                    <AlertTitle>Info</AlertTitle>
                    <AlertDescription>
                      Settings changes require a server restart to take effect.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Style variations */}
        <Card className="border-violet-900/60 bg-slate-950/90">
          <CardHeader>
            <CardTitle>Style Overrides</CardTitle>
            <CardDescription>
              The same tabs primitive with different visual treatments via
              className overrides.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={styleTab} onValueChange={setStyleTab}>
              <TabsList className="bg-violet-950/50">
                <TabsTrigger
                  value="minimal"
                  className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                >
                  Minimal
                </TabsTrigger>
                <TabsTrigger
                  value="branded"
                  className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                >
                  Branded
                </TabsTrigger>
                <TabsTrigger
                  value="accent"
                  className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                >
                  Accent
                </TabsTrigger>
              </TabsList>

              <TabsContent value="minimal">
                <div className="flex flex-wrap gap-2 pt-4">
                  <Badge variant="secondary">Clean</Badge>
                  <Badge variant="secondary">Understated</Badge>
                  <Badge variant="outline">Default theme tokens</Badge>
                </div>
              </TabsContent>

              <TabsContent value="branded">
                <div className="flex flex-wrap gap-2 pt-4">
                  <Badge className="border-violet-600 bg-violet-600 text-white">
                    Custom
                  </Badge>
                  <Badge className="border-fuchsia-600 bg-fuchsia-600 text-white">
                    Brand Colors
                  </Badge>
                  <Badge variant="outline" className="border-violet-500 text-violet-300">
                    Override
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value="accent">
                <div className="flex flex-wrap gap-2 pt-4">
                  <Badge className="border-amber-600 bg-amber-600 text-slate-950">
                    Warm
                  </Badge>
                  <Badge className="border-emerald-600 bg-emerald-600 text-white">
                    Fresh
                  </Badge>
                  <Badge className="border-cyan-500 bg-cyan-500 text-slate-950">
                    Cool
                  </Badge>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
