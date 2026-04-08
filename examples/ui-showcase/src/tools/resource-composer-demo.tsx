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
  CardHeader,
  CardTitle,
  Grid,
  Input,
  Label,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Textarea,
  useMcpApp,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "resourceComposerDemo",
  description:
    "Resource and Composer demo for MCP Apps: read a real resource, send a message, and update model context through the host.",
};

const PLAYBOOK_URI = "docs://mcp-app-playbook";

function getResourceText(resourceResult: unknown): string | null {
  if (!resourceResult || typeof resourceResult !== "object") {
    return null;
  }

  const contents = (resourceResult as { contents?: Array<{ text?: string }> }).contents;
  if (!Array.isArray(contents)) {
    return null;
  }

  for (const item of contents) {
    if (typeof item?.text === "string" && item.text.trim().length > 0) {
      return item.text;
    }
  }

  return null;
}

function formatCapabilityStatus(
  value: boolean | string[] | undefined
): "supported" | "unsupported" | "not advertised" {
  if (typeof value === "boolean") {
    return value ? "supported" : "unsupported";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? "supported" : "unsupported";
  }

  return "not advertised";
}

export default function handler() {
  const {
    hostCapabilities,
    readResource,
    sendMessage,
    updateModelContext,
    isConnected,
  } = useMcpApp();
  const [resourceResult, setResourceResult] = useState<unknown>(null);
  const [messageResult, setMessageResult] = useState<unknown>(null);
  const [contextResult, setContextResult] = useState<unknown>(null);
  const [contextStatus, setContextStatus] = useState<string | null>(null);
  const [messageText, setMessageText] = useState(
    "Summarize the MCP app playbook in one sentence."
  );
  const [contextText, setContextText] = useState(
    "The user is exploring how to structure a production MCP App showcase."
  );
  const [error, setError] = useState<string | null>(null);
  const resourceText = getResourceText(resourceResult);
  const messageCapability = formatCapabilityStatus(hostCapabilities?.message);
  const modelContextCapability = formatCapabilityStatus(
    hostCapabilities?.updateModelContext
  );

  const loadResource = async () => {
    setError(null);
    try {
      const result = await readResource(PLAYBOOK_URI);
      setResourceResult(result);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to read resource"
      );
    }
  };

  const handleSendMessage = async () => {
    setError(null);

    if (!resourceText) {
      setError("Read the playbook resource first so the host has content to work with.");
      return;
    }

    try {
      const result = await sendMessage({
        role: "user",
        content: [
          {
            type: "text",
            text: `${messageText}\n\nReference document:\n${resourceText}`,
          },
        ],
        metadata: {
          sourceResource: PLAYBOOK_URI,
        },
      });
      setMessageResult(result);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to send message"
      );
    }
  };

  const handleUpdateModelContext = async () => {
    setError(null);
    setContextStatus(null);

    if (!resourceText) {
      setError("Read the playbook resource first before updating model context.");
      return;
    }

    try {
      const result = await updateModelContext({
        role: "system",
        content: [
          {
            type: "text",
            text: `${contextText}\n\nSupporting playbook excerpt:\n${resourceText}`,
          },
        ],
        metadata: {
          sourceResource: PLAYBOOK_URI,
        },
      });
      setContextResult(result);
      setContextStatus(
        `Context sent to the host at ${new Date().toLocaleTimeString()}`
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to update model context"
      );
    }
  };

  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>MCP Apps Pattern</PageEyebrow>
        <PageTitle>Resource + Composer Demo</PageTitle>
        <PageDescription>
          Read a first-class MCP resource, then use host messaging and model
          context APIs to turn that resource into something the model can work
          with.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-6">
        <Grid columns={4} gap={12}>
          <Card className="border-slate-700 bg-slate-950/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Host Bridge
              </p>
              <div className="text-3xl font-semibold tracking-tight">
                {isConnected ? "Connected" : "Standalone"}
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Messaging is host-mediated
              </p>
            </CardContent>
          </Card>
          <Card className="border-cyan-900/60 bg-slate-950/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Resource URI
              </p>
              <div className="font-mono text-sm text-cyan-300">{PLAYBOOK_URI}</div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                First-class docs resource
              </p>
            </CardContent>
          </Card>
          <Card className="border-violet-900/60 bg-slate-950/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                message
              </p>
              <div className="text-3xl font-semibold tracking-tight">
                {messageCapability}
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Host-reported capability
              </p>
            </CardContent>
          </Card>
          <Card className="border-emerald-900/60 bg-slate-950/90">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                updateModelContext
              </p>
              <div className="text-3xl font-semibold tracking-tight">
                {modelContextCapability}
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Host-reported capability
              </p>
            </CardContent>
          </Card>
        </Grid>

        {error ? (
          <Alert variant="error" className="border-red-900/60">
            <AlertTitle>Host action failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Grid columns={2} gap={16}>
          <Card className="border-cyan-900/60 bg-[linear-gradient(180deg,rgba(8,145,178,0.12),rgba(2,6,23,0.92))]">
            <CardHeader>
              <CardTitle>1. Read a Resource</CardTitle>
              <CardDescription>
                Load a real MCP resource that the demo server exposes from the
                new <code>resources</code> path.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => void loadResource()}>
                Read {PLAYBOOK_URI}
              </Button>
              <Badge variant="outline" className="border-cyan-800 text-cyan-300">
                {resourceText ? "Loaded" : "Not loaded"}
              </Badge>
              <pre className="max-h-[280px] overflow-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
                {resourceResult
                  ? JSON.stringify(resourceResult, null, 2)
                  : "Read the playbook resource to inspect the contents payload."}
              </pre>
            </CardContent>
          </Card>

          <Card className="border-violet-900/60 bg-[linear-gradient(180deg,rgba(88,28,135,0.12),rgba(2,6,23,0.92))]">
            <CardHeader>
              <CardTitle>2. Send a Message</CardTitle>
              <CardDescription>
                Forward a message-shaped payload through the host so the app can
                participate in the surrounding assistant workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message-text">Message prompt</Label>
                <Input
                  id="message-text"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                />
              </div>
              <Button onClick={() => void handleSendMessage()}>
                Send message payload
              </Button>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                This sends your prompt plus the loaded <code>{PLAYBOOK_URI}</code>{" "}
                contents, so the host can actually summarize the playbook.
              </p>
              <pre className="max-h-[220px] overflow-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
                {messageResult
                  ? JSON.stringify(messageResult, null, 2)
                  : "Send a message to inspect the host response."}
              </pre>
            </CardContent>
          </Card>
        </Grid>

        <Card className="border-emerald-900/60 bg-[linear-gradient(180deg,rgba(6,78,59,0.12),rgba(2,6,23,0.92))]">
          <CardHeader>
            <CardTitle>3. Update Model Context</CardTitle>
            <CardDescription>
              Add small, explicit UI-generated context that the host can fold
              into the broader model conversation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="context-text">Context payload</Label>
              <Textarea
                id="context-text"
                rows={4}
                value={contextText}
                onChange={(event) => setContextText(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => void handleUpdateModelContext()}>
                Update model context
              </Button>
              <Badge variant="outline" className="border-emerald-800 text-emerald-300">
                Keep these updates small and intentional
              </Badge>
            </div>
            {contextStatus ? (
              <Alert variant="success" className="border-emerald-900/60">
                <AlertTitle>Model context updated</AlertTitle>
                <AlertDescription>{contextStatus}</AlertDescription>
              </Alert>
            ) : null}
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              The update includes both your context text and the playbook
              contents that were loaded in step 1.
            </p>
            <pre className="max-h-[260px] overflow-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
              {contextResult
                ? JSON.stringify(contextResult, null, 2)
                : "Submit a context payload to inspect the host acknowledgement."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
