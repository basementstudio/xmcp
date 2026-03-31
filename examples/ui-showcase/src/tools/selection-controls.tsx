import React, { useState } from "react";
import {
  AppShell,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Separator,
  Switch,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "selectionControls",
  description: "Focused checkbox and switch examples with override support for @xmcp-dev/ui",
};

export default function handler() {
  const [newsletter, setNewsletter] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>Specific Components</PageEyebrow>
        <PageTitle>Checkboxes And Switches</PageTitle>
        <PageDescription>
          A focused tool for boolean controls, with local state and visible per-instance overrides.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-4xl gap-6">
        <Card className="border-cyan-900/60 bg-[linear-gradient(180deg,rgba(14,116,144,0.2),rgba(2,6,23,0.88))]">
          <CardHeader>
            <CardTitle>Preference Center</CardTitle>
            <CardDescription>
              Same exported primitives, customized per instance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Checkbox
              checked={newsletter}
              onCheckedChange={(checked) => setNewsletter(checked === true)}
              className="border-cyan-500 data-[state=checked]:bg-cyan-400 data-[state=checked]:text-slate-950"
            />
            <div className="-mt-8 pl-7 text-sm text-slate-300">Email me weekly release notes</div>
            <Separator className="bg-slate-700" />
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
              <div>
                <p className="font-medium text-slate-100">Compact mode</p>
                <p className="text-sm text-slate-400">
                  Reduce spacing density across dashboards.
                </p>
              </div>
              <Switch
                checked={compactMode}
                onCheckedChange={setCompactMode}
                className="data-[state=checked]:bg-emerald-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-950/90">
          <CardHeader>
            <CardTitle>Current Values</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>
              <span className="text-slate-500">Newsletter:</span>{" "}
              {newsletter ? "enabled" : "disabled"}
            </p>
            <p>
              <span className="text-slate-500">Compact mode:</span>{" "}
              {compactMode ? "enabled" : "disabled"}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
