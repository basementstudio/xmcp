import { useRef, useState } from "react";
import {
  AppShell,
  Badge,
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
  StatCard,
  useAutoMcpAppSize,
  useMcpApp,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

import "../globals.css";

export const metadata: ToolMetadata = {
  name: "uiKitDemo",
  description: "Starter MCP App built with @xmcp-dev/ui components.",
  _meta: {
    ui: {
      prefersBorder: true,
    },
  },
};

export default function UiKitDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { isConnected, requestDisplayMode, openLink } = useMcpApp();
  const [modeRequests, setModeRequests] = useState(0);

  useAutoMcpAppSize(rootRef);

  async function handleFullscreen() {
    setModeRequests((count) => count + 1);

    if (isConnected) {
      await requestDisplayMode("fullscreen");
    }
  }

  return (
    <div ref={rootRef}>
      <AppShell>
        <PageHeader>
          <PageEyebrow>@xmcp-dev/ui starter</PageEyebrow>
          <PageTitle>MCP App UI Kit</PageTitle>
          <PageDescription>
            A compact starter for handwritten MCP Apps and schema-driven UI.
          </PageDescription>
        </PageHeader>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Host bridge</CardTitle>
                  <CardDescription>
                    Use the host when available, keep the UI useful while local.
                  </CardDescription>
                </div>
                <Badge variant={isConnected ? "default" : "outline"}>
                  {isConnected ? "Connected" : "Local preview"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={handleFullscreen}>Request fullscreen</Button>
              <Button
                variant="secondary"
                onClick={() => openLink("https://xmcp.dev/docs")}
              >
                Open docs
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <StatCard label="Display requests" value={modeRequests} />
            <StatCard label="Schema tool" value="renderJson" detail="Ready" />
          </div>
        </div>
      </AppShell>
    </div>
  );
}
