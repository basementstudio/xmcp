import React, { useState, useEffect } from "react";
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
  Progress,
  Button,
  Badge,
  Label,
  Separator,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "progressDemo",
  description:
    "Progress bar component — show determinate progress for async tool calls and long operations in MCP Apps",
};

function AnimatedProgress({
  label,
  className,
  barClass,
  speed = 40,
}: {
  label: string;
  className?: string;
  barClass?: string;
  speed?: number;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((prev) => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, speed);
    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {value}%
        </span>
      </div>
      <Progress value={value} className={className}>
        {barClass && (
          <div
            className={`h-full transition-all duration-300 ease-in-out ${barClass}`}
            style={{ width: `${value}%` }}
          />
        )}
      </Progress>
    </div>
  );
}

export default function handler() {
  const [uploadValue, setUploadValue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUploadValue((prev) => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>New Components</PageEyebrow>
        <PageTitle>Progress</PageTitle>
        <PageDescription>
          Determinate progress bars for showing operation status. Bound to state
          keys in JSON/DSL mode, or used directly as React primitives.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-5xl gap-6">
        {/* Live animated progress */}
        <Card className="border-emerald-900/60 bg-[linear-gradient(180deg,rgba(5,150,105,0.1),rgba(2,6,23,0.92))]">
          <CardHeader>
            <CardTitle>Live Progress</CardTitle>
            <CardDescription>
              Animated bars simulating real-time operation progress — the kind of
              feedback MCP Apps need for tool calls and data processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <AnimatedProgress label="Processing records" speed={30} />
            <AnimatedProgress label="Syncing data" speed={60} />
            <AnimatedProgress label="Building export" speed={90} />
          </CardContent>
        </Card>

        {/* Static values */}
        <Card className="border-slate-700 bg-slate-950/90">
          <CardHeader>
            <CardTitle>Static Values</CardTitle>
            <CardDescription>
              Fixed progress values for showing completion states.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Not started</Label>
                <Badge variant="secondary" className="text-xs">
                  0%
                </Badge>
              </div>
              <Progress value={0} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>In progress</Label>
                <Badge
                  variant="outline"
                  className="border-cyan-700 text-xs text-cyan-300"
                >
                  45%
                </Badge>
              </div>
              <Progress value={45} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Almost done</Label>
                <Badge
                  variant="outline"
                  className="border-amber-700 text-xs text-amber-300"
                >
                  88%
                </Badge>
              </div>
              <Progress value={88} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Complete</Label>
                <Badge className="bg-emerald-600 text-xs text-white">
                  100%
                </Badge>
              </div>
              <Progress value={100} />
            </div>
          </CardContent>
        </Card>

        {/* File upload simulation */}
        <Card className="border-violet-900/60 bg-slate-950/90">
          <CardHeader>
            <CardTitle>Upload Simulation</CardTitle>
            <CardDescription>
              Simulated file upload with progress feedback — a common MCP App
              pattern for chunked data transfer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-300">report-2026-Q1.csv</span>
                  <span className="text-violet-400">{uploadValue}%</span>
                </div>
                <Progress value={uploadValue} className="h-3" />
              </div>
              <Button
                variant="secondary"
                className="shrink-0"
                onClick={() => setUploadValue(0)}
              >
                Reset
              </Button>
            </div>
            <Separator className="bg-slate-800" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              In a real MCP App, this would use <code>callServerTool</code> with
              chunked data transfer and update progress via state.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
