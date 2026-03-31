import React from "react";
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
  Link,
  Badge,
  Grid,
  Separator,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "imageLinkDemo",
  description:
    "Image and Link components — display media and navigable links within sandboxed MCP App iframes",
};

export default function handler() {
  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>New Components</PageEyebrow>
        <PageTitle>Images & Links</PageTitle>
        <PageDescription>
          Display rich media and navigable links inside MCP App sandboxed
          iframes. Images support both static URLs and state-bound sources.
          Links open via the host for security.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-5xl gap-6">
        {/* Image showcase */}
        <Card className="border-cyan-900/60 bg-[linear-gradient(180deg,rgba(8,145,178,0.1),rgba(2,6,23,0.92))]">
          <CardHeader>
            <CardTitle>Image Component</CardTitle>
            <CardDescription>
              Renders images with rounded corners and responsive sizing. Supports
              static <code>src</code> or state-bound <code>srcKey</code> for
              dynamic content from tool results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Grid columns={3} gap={16}>
              <div className="space-y-2">
                <img
                  src="https://picsum.photos/seed/mcp1/400/300"
                  alt="Random landscape"
                  className="w-full rounded-lg border border-slate-700"
                />
                <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                  Static src
                </p>
              </div>
              <div className="space-y-2">
                <img
                  src="https://picsum.photos/seed/mcp2/400/300"
                  alt="Random nature"
                  className="w-full rounded-lg border border-slate-700"
                />
                <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                  Responsive width
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-900/50 text-sm text-[hsl(var(--muted-foreground))]">
                  No image placeholder
                </div>
                <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                  Empty srcKey fallback
                </p>
              </div>
            </Grid>
          </CardContent>
        </Card>

        {/* Link showcase */}
        <Card className="border-violet-900/60 bg-slate-950/90">
          <CardHeader>
            <CardTitle>Link Component</CardTitle>
            <CardDescription>
              Links in MCP Apps open through the host via{" "}
              <code>sendOpenLink</code>. External links show an icon indicator.
              Styled to match the app theme.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Link
                  href="https://modelcontextprotocol.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  MCP Specification
                  <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.25a.75.75 0 01.75.75v3.25a.75.75 0 01-1.5 0v-1.44l-5.22 5.22a.75.75 0 01-1.06-1.06l5.22-5.22h-1.44a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Badge variant="outline" className="border-cyan-800 text-xs text-cyan-400">
                  external
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="https://apps.extensions.modelcontextprotocol.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300"
                >
                  MCP Apps API Docs
                  <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.25a.75.75 0 01.75.75v3.25a.75.75 0 01-1.5 0v-1.44l-5.22 5.22a.75.75 0 01-1.06-1.06l5.22-5.22h-1.44a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Badge variant="outline" className="border-violet-800 text-xs text-violet-400">
                  external
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="https://github.com/modelcontextprotocol/ext-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  ext-apps Repository
                  <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.25a.75.75 0 01.75.75v3.25a.75.75 0 01-1.5 0v-1.44l-5.22 5.22a.75.75 0 01-1.06-1.06l5.22-5.22h-1.44a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Badge variant="outline" className="border-emerald-800 text-xs text-emerald-400">
                  external
                </Badge>
              </div>
            </div>

            <Separator className="bg-slate-800" />

            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              In MCP Apps, links are intercepted by the host sandbox. The{" "}
              <code>open-link</code> action type can also be used on buttons to
              open URLs via <code>sendOpenLink</code>.
            </p>
          </CardContent>
        </Card>

        {/* Combined: image cards with links */}
        <Card className="border-amber-900/60 bg-slate-950/90">
          <CardHeader>
            <CardTitle>Media Cards</CardTitle>
            <CardDescription>
              Combining images and links in card layouts — a common pattern for
              data exploration MCP Apps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Grid columns={2} gap={16}>
              <Card className="overflow-hidden border-slate-700">
                <img
                  src="https://picsum.photos/seed/card1/600/200"
                  alt="Project thumbnail"
                  className="h-32 w-full object-cover"
                />
                <CardContent className="space-y-2 p-4">
                  <h4 className="font-medium text-slate-100">
                    Map Visualization
                  </h4>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Interactive CesiumJS globe rendered as an MCP App.
                  </p>
                  <Link
                    href="https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/map-server"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    View source
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.25a.75.75 0 01.75.75v3.25a.75.75 0 01-1.5 0v-1.44l-5.22 5.22a.75.75 0 01-1.06-1.06l5.22-5.22h-1.44a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </CardContent>
              </Card>
              <Card className="overflow-hidden border-slate-700">
                <img
                  src="https://picsum.photos/seed/card2/600/200"
                  alt="Project thumbnail"
                  className="h-32 w-full object-cover"
                />
                <CardContent className="space-y-2 p-4">
                  <h4 className="font-medium text-slate-100">3D Viewer</h4>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Three.js scene with camera controls inside a chat bubble.
                  </p>
                  <Link
                    href="https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/threejs-server"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    View source
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.25a.75.75 0 01.75.75v3.25a.75.75 0 01-1.5 0v-1.44l-5.22 5.22a.75.75 0 01-1.06-1.06l5.22-5.22h-1.44a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </CardContent>
              </Card>
            </Grid>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
