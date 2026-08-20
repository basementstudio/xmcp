import React from "react";
import {
  AppShell,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Rendered,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "schemaAppDemo",
  description:
    "Schema-driven MCP App demo that runs through host-backed transport and calls tools via declarative actions.",
};

const schemaJson = JSON.stringify(
  {
    title: "Schema-Driven Host App",
    description:
      "Declarative example proving that schema-rendered UIs can use host-backed MCP App transport.",
    mcpServerUrl: "http://localhost:6274",
    theme: "dark",
    state: {
      stats: null,
      status: "Idle",
      linkLabel: "Open MCP Apps overview",
    },
    root: {
      type: "grid",
      props: {
        columns: 1,
        gap: 20,
      },
      children: [
        {
          type: "card",
          props: {
            title: "Host-backed schema UI",
            description:
              "The buttons below are defined in JSON and run through host transport, not direct fetch-only rendering.",
          },
          children: [
            {
              type: "badge",
              props: {
                label: "transportMode=host",
              },
            },
            {
              type: "text",
              props: {
                variant: "body",
                content:
                  "Use schema-driven apps when the interaction model is mostly declarative and repeatable.",
              },
            },
            {
              type: "button",
              props: {
                label: "Call serverStats",
              },
              actions: {
                onClick: {
                  type: "call-tool",
                  tool: "serverStats",
                  args: {},
                  resultKey: "stats",
                },
              },
            },
            {
              type: "button",
              props: {
                label: "Mark status as Updated",
                variant: "secondary",
              },
              actions: {
                onClick: {
                  type: "set-state",
                  key: "status",
                  value: "Updated from a schema action",
                },
              },
            },
            {
              type: "text",
              props: {
                variant: "body",
                content: "Status: {{status}}",
              },
            },
            {
              type: "alert",
              props: {
                messageKey: "stats",
                variant: "info",
              },
            },
          ],
        },
      ],
    },
  },
  null,
  2
);

export default function handler() {
  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>MCP Apps Pattern</PageEyebrow>
        <PageTitle>Schema App Demo</PageTitle>
        <PageDescription>
          This example proves the host-backed renderer path for schema-defined
          UIs. The tool-calling button below is declarative, but it still goes
          through the MCP App host bridge.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-6">
        <Card className="border-slate-700 bg-slate-950/90">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Why this example exists</CardTitle>
                <CardDescription>
                  Handwritten React is not the only supported path anymore.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-cyan-800 text-cyan-300">
                Declarative + host-backed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
            <p>The embedded app below is rendered from a JSON schema string.</p>
            <p>
              Its <code>call-tool</code> action uses the same host MCP App path
              as the handwritten demos.
            </p>
            <p>
              This is the right direction when the interface is mostly forms,
              actions, and state binding instead of bespoke component logic.
            </p>
          </CardContent>
        </Card>

        <Rendered
          schemaJson={schemaJson}
          transportMode="host"
          previewMode="strict"
        />
      </div>
    </AppShell>
  );
}
