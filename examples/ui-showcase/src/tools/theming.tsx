import React from "react";
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
  Input,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  StatCard,
  ThemeProvider,
  useTheme,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "theming",
  description: "App-level theming examples for @xmcp-dev/ui across the same shared primitives",
};

function ThemePreview({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const theme = useTheme();

  return (
    <div
      className="rounded-[calc(var(--radius)+0.2rem)] border border-[hsl(var(--border))] bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_24%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background))_100%)] p-6 text-[hsl(var(--foreground))]"
      style={theme.style}
    >
      <div className="mb-6">
        <div className="mb-2 inline-flex rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
          {eyebrow}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          {description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Theme Scope"
          value="App"
          detail="Tokens apply across every primitive"
        />
        <StatCard
          label="Surface"
          value="Shared"
          detail="Same components, different resolved variables"
        />
        <StatCard
          label="Target"
          value="MCP Apps"
          detail="Author once, render in compatible clients"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Form Surfaces</CardTitle>
            <CardDescription>
              Inputs, badges, and actions inherit the same token contract.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            <Input value="Theme-aware input" readOnly />
            <Select value="stable">
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stable">Stable</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Messaging</CardTitle>
            <CardDescription>
              Feedback components shift tone without custom per-component classes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="success">
              <AlertTitle>Theme resolved</AlertTitle>
              <AlertDescription>
                These colors come from app-level tokens, not one-off overrides.
              </AlertDescription>
            </Alert>
            <Separator />
            <Alert variant="info">
              <AlertTitle>Better authoring experience</AlertTitle>
              <AlertDescription>
                Most branding changes should happen at the theme layer first.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function handler() {
  return (
    <AppShell>
      <PageHeader>
        <PageEyebrow>Theming</PageEyebrow>
        <PageTitle>App-Level Theme Hooks</PageTitle>
        <PageDescription>
          The package owns the theme contract, while the rendered output still
          targets MCP Apps-compatible clients. These previews use the same
          primitives with different app-level tokens.
        </PageDescription>
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-6">
        <ThemePreview
          eyebrow="Default Theme"
          title="Built-in dark preset"
          description="This is the default package feel with no token overrides applied."
        />

        <ThemeProvider
          themeTokens={{
            background: "28 62% 96%",
            foreground: "22 47% 12%",
            card: "0 0% 100%",
            cardForeground: "22 47% 12%",
            border: "24 35% 82%",
            input: "24 35% 82%",
            muted: "24 40% 92%",
            mutedForeground: "24 18% 42%",
            primary: "18 89% 53%",
            primaryForeground: "40 100% 97%",
            secondary: "151 44% 88%",
            secondaryForeground: "156 52% 18%",
            destructive: "0 74% 48%",
            destructiveForeground: "0 0% 100%",
            accent: "174 57% 40%",
            accentForeground: "36 100% 98%",
            ring: "18 89% 53%",
            radius: "1.2rem",
          }}
        >
          <ThemePreview
            eyebrow="Custom Theme"
            title="Warm editorial preset"
            description="The same primitives shift into a warmer, brighter brand feel through app-level token overrides."
          />
        </ThemeProvider>
      </div>
    </AppShell>
  );
}
