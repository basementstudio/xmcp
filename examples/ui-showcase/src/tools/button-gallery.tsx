import React from "react";
import {
  AppShell,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "buttonGallery",
  description: "Focused button variations and override examples for @xmcp-dev/ui",
};

export default function handler() {
  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>Specific Components</PageEyebrow>
        <PageTitle>Buttons</PageTitle>
        <PageDescription>
          A focused tool for button variants and per-instance Tailwind overrides.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-5xl gap-6">
        <Card className="border-fuchsia-900/60 bg-[linear-gradient(180deg,rgba(88,28,135,0.22),rgba(2,6,23,0.88))]">
          <CardHeader>
            <CardTitle>Base Variants</CardTitle>
            <CardDescription>
              The same primitive can be restyled per instance without changing package code.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
          </CardContent>
        </Card>

        <Card className="border-cyan-900/60 bg-slate-950/90">
          <CardHeader>
            <CardTitle>Overrides</CardTitle>
            <CardDescription>
              These all use the same exported button component with custom classes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">
              Cyan Solid
            </Button>
            <Button className="border border-emerald-700 bg-emerald-950/50 text-emerald-100 hover:bg-emerald-900/80">
              Emerald Outline
            </Button>
            <Button className="rounded-full bg-white/10 px-5 text-white backdrop-blur hover:bg-white/20">
              Rounded Pill
            </Button>
            <Button className="bg-gradient-to-r from-amber-300 to-orange-400 text-slate-950 shadow-lg shadow-orange-950/30 hover:opacity-95">
              Gradient
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
