import { useState } from "react";
import { AppShell, Button } from "@xmcp-dev/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#components/ui/card";
import type { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "shadcnDemo",
  description:
    "A local shadcn Card sharing the xmcp UI kit's light and dark theme tokens.",
};

export default function ShadcnDemo() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  return (
    <AppShell theme={theme}>
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>shadcn + xmcp</CardTitle>
          <CardDescription>
            Local shadcn components and the UI kit share one theme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Current theme: {theme}</p>
          <Button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            Switch to {theme === "light" ? "dark" : "light"}
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
