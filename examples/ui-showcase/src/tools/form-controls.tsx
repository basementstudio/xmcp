import React, { useState } from "react";
import {
  AppShell,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "formControls",
  description: "Focused input and select examples with override support for @xmcp-dev/ui",
};

export default function handler() {
  const [tone, setTone] = useState("warm");
  const [headline, setHeadline] = useState("Design systems launch");
  const [summary, setSummary] = useState(
    "A component system that feels closer to the shadcn workflow.",
  );

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>Specific Components</PageEyebrow>
        <PageTitle>Inputs, Textareas, And Selects</PageTitle>
        <PageDescription>
          A focused tool for form controls, showing how the same exported components can be styled differently.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-4xl gap-6">
        <Card className="border-violet-900/60 bg-[linear-gradient(180deg,rgba(76,29,149,0.18),rgba(2,6,23,0.9))]">
          <CardHeader>
            <CardTitle>Editorial Form</CardTitle>
            <CardDescription>
              Local state only. No actions, no MCP calls.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                className="border-violet-700 bg-violet-950/30 text-violet-50 placeholder:text-violet-300/50"
                placeholder="Write a headline"
              />
            </div>

            <div className="grid gap-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="border-amber-700 bg-amber-950/20 text-amber-50">
                  <SelectValue placeholder="Choose a tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="sharp">Sharp</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className="min-h-[140px] border-cyan-800/70 bg-cyan-950/20 text-cyan-50 placeholder:text-cyan-200/40"
                  placeholder="Describe the component experience"
                />
              </div>
            </CardContent>
          </Card>

        <Card className="border-slate-700 bg-slate-950/90">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Current local values rendered with the same component surface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>
              <span className="text-slate-500">Headline:</span> {headline}
            </p>
            <p>
              <span className="text-slate-500">Tone:</span> {tone}
            </p>
            <p className="leading-6">
              <span className="text-slate-500">Summary:</span> {summary}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
