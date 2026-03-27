import React, { useState } from "react";
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
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Grid,
  Input,
  Label,
  Loader,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Select,
  SelectContent,
  SelectItem,
  Separator,
  SelectTrigger,
  SelectValue,
  StatCard,
  Switch,
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
  description: "Human-authored shadcn-style showcase for @xmcp-dev/ui",
};

const rows = [
  {
    component: "Card",
    category: "layout",
    state: "stable",
    note: "Container surface with header and content slots.",
  },
  {
    component: "Button",
    category: "forms",
    state: "stable",
    note: "Primary, secondary, and danger variants.",
  },
  {
    component: "Input",
    category: "forms",
    state: "stable",
    note: "Shared field styling for text-like controls.",
  },
  {
    component: "Select",
    category: "forms",
    state: "stable",
    note: "Matches the same visual field system as Input.",
  },
  {
    component: "Alert",
    category: "feedback",
    state: "stable",
    note: "Inline status callouts for information and warnings.",
  },
  {
    component: "Table",
    category: "data",
    state: "stable",
    note: "Simple presentational table primitives.",
  },
  {
    component: "Textarea",
    category: "forms",
    state: "stable",
    note: "Long-form text input with the same tokenized surface.",
  },
  {
    component: "Badge",
    category: "feedback",
    state: "stable",
    note: "Small semantic labels with shadcn-style variants.",
  },
];

export default function handler() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [audience, setAudience] = useState("design systems team");
  const [checksEnabled, setChecksEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  const filteredRows = rows.filter((row) => {
    const queryMatch =
      query.trim() === "" ||
      row.component.toLowerCase().includes(query.trim().toLowerCase()) ||
      row.note.toLowerCase().includes(query.trim().toLowerCase());

    const categoryMatch = category === "all" || row.category === category;
    return queryMatch && categoryMatch;
  });

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>Human Authored</PageEyebrow>
        <PageTitle>@xmcp-dev/ui as Components</PageTitle>
        <PageDescription>
          This is a pure visual showcase of the direct component surface. The
          package owns the authoring experience, while the rendered output still
          targets MCP Apps-compatible clients.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Alert
          variant="info"
          title="Direct component mode"
          className="border-sky-900/70 bg-sky-950/20 shadow-[0_0_0_1px_rgba(14,165,233,0.1)]"
        >
          The example below is static on purpose. It demonstrates the package as
          a shadcn-like authoring surface for humans, including app-level
          theming and per-instance Tailwind overrides.
        </Alert>

        <Grid
          columns={4}
          gap={16}
          className="border-emerald-950/60 bg-[linear-gradient(180deg,rgba(6,78,59,0.14),rgba(2,6,23,0.16))]"
        >
          <StatCard
            label="Direct Components"
            value="21"
            detail="Composable JSX primitives"
            className="border-emerald-900/60 bg-slate-950/90"
          />
          <StatCard
            label="Renderer Mode"
            value="JSON"
            detail="Available in the companion tool"
            className="border-cyan-900/60 bg-slate-950/90"
          />
          <StatCard
            label="Design Language"
            value="Shared"
            detail="Same package owns both surfaces"
            className="border-violet-900/60 bg-slate-950/90"
          />
          <StatCard
            label="Interactions"
            value="None"
            detail="Example intentionally kept simple"
            className="border-amber-900/60 bg-slate-950/90"
          />
        </Grid>

        <Card className="border-fuchsia-900/60 bg-[linear-gradient(180deg,rgba(88,28,135,0.2),rgba(2,6,23,0.86))]">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>
              Presentational button variants with no bound actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button className="bg-fuchsia-100 text-fuchsia-950 hover:bg-fuchsia-200">
              Primary Button
            </Button>
            <Button
              variant="secondary"
              className="border-cyan-800 bg-cyan-950/70 text-cyan-100 hover:bg-cyan-900"
            >
              Secondary Button
            </Button>
            <Button
              variant="danger"
              className="bg-rose-500 text-white shadow-lg shadow-rose-950/30 hover:bg-rose-400"
            >
              Danger Button
            </Button>
          </CardContent>
        </Card>

        <Grid columns={2} gap={16}>
          <Card className="border-slate-700 bg-slate-950/90">
            <CardHeader>
              <CardTitle>Form Controls</CardTitle>
              <CardDescription>
                Controlled locally for presentation only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">Component Query</Label>
                <Input
                  id="query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search components or notes"
                  className="border-slate-600 bg-slate-900 text-cyan-50 placeholder:text-slate-500 focus-visible:ring-cyan-400/30"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-slate-600 bg-slate-900 text-amber-50 focus:ring-amber-400/30">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="layout">Layout</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="forms">Forms</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <Input
                  id="audience"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder="Example audience"
                  className="border-violet-800/70 bg-violet-950/20 text-violet-50 placeholder:text-violet-300/50 focus-visible:ring-violet-400/30"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-between text-sm text-slate-500">
              <span>Filter preview for {audience}</span>
              <span>{filteredRows.length} visible components</span>
            </CardFooter>
          </Card>

          <Card className="border-teal-900/60 bg-[linear-gradient(180deg,rgba(13,148,136,0.08),rgba(2,6,23,0.82))]">
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>
                Static callouts and loader styling.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert
                variant="success"
                className="border-emerald-800/70 bg-emerald-950/30"
              >
                <AlertTitle>Shared primitives</AlertTitle>
                <AlertDescription>
                  Shared package styling keeps the React component path aligned
                  with the JSON renderer path.
                </AlertDescription>
              </Alert>
              <Alert
                variant="warning"
                className="border-amber-800/70 bg-amber-950/30"
              >
                <AlertTitle>No actions</AlertTitle>
                <AlertDescription>
                  The example intentionally avoids tool calls so the visual
                  system is easier to inspect.
                </AlertDescription>
              </Alert>
              <Loader
                label="Standalone loading primitive"
                className="rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid columns={2} gap={16}>
          <Card className="border-cyan-900/60 bg-[linear-gradient(180deg,rgba(8,145,178,0.12),rgba(2,6,23,0.88))]">
            <CardHeader>
              <CardTitle>New Core Primitives</CardTitle>
              <CardDescription>
                The package now ships more of the baseline shadcn-style set.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline" className="border-cyan-700 text-cyan-200">
                  Outline Override
                </Badge>
              </div>
              <Separator />
              <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <Checkbox
                  checked={checksEnabled}
                  onCheckedChange={(checked) => setChecksEnabled(checked === true)}
                  className="border-cyan-500 data-[state=checked]:bg-cyan-400 data-[state=checked]:text-slate-950"
                />
                <p className="-mt-7 pl-7 text-sm text-slate-300">
                  Enable component-level inspection mode
                </p>
                <Separator className="bg-slate-700" />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-100">Compact density</p>
                    <p className="text-sm text-slate-400">
                      Swap the surface into tighter spacing.
                    </p>
                  </div>
                  <Switch
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                    className="data-[state=checked]:bg-emerald-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-900/60 bg-[linear-gradient(180deg,rgba(190,24,93,0.12),rgba(2,6,23,0.88))]">
            <CardHeader>
              <CardTitle>What Changed</CardTitle>
              <CardDescription>
                Semantic tokens now drive the visual system instead of hardcoded surface colors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <p>Inputs, cards, buttons, and tables now read from shared CSS variables.</p>
              <p>New primitives cover more of the expected shadcn baseline.</p>
              <p>Focused tools document these pieces individually, not only in one broad showcase.</p>
            </CardContent>
          </Card>
        </Grid>

        <Card className="border-violet-900/60 bg-slate-950/95">
          <CardHeader>
            <CardTitle>Table</CardTitle>
            <CardDescription>
              Static component inventory filtered by local form state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="rounded-lg border border-slate-800 bg-slate-950/70">
              <TableHeader>
                <TableRow className="bg-violet-950/20 hover:bg-violet-950/20">
                  <TableHead className="text-violet-300">Component</TableHead>
                  <TableHead className="text-violet-300">Category</TableHead>
                  <TableHead className="text-violet-300">State</TableHead>
                  <TableHead className="text-violet-300">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.component} className="hover:bg-slate-900/80">
                    <TableCell className="font-medium text-slate-100">
                      {row.component}
                    </TableCell>
                    <TableCell className="capitalize text-cyan-300">
                      {row.category}
                    </TableCell>
                    <TableCell className="text-emerald-300">{row.state}</TableCell>
                    <TableCell className="text-slate-400">{row.note}</TableCell>
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
