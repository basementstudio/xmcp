"use client";

import { useMemo } from "react";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import ts from "@shikijs/langs/typescript";
import bash from "@shikijs/langs/bash";
import { CodeBlock } from "@/components/codeblock";
import { AccordionItem } from "@/components/ui/accordion-item";
import { CopyButton } from "@/components/ui/copy-button";
import { AnimatedShell, type ShellLine } from "./animated-shell";
import {
  XMCP_SHIKI_THEME_NAME,
  xmcpAyuDarkTheme,
  xmcpLightTheme,
} from "@/lib/shiki-theme";

const highlighter = createHighlighterCoreSync({
  langs: [ts, bash],
  themes: [xmcpAyuDarkTheme, xmcpLightTheme],
  engine: createJavaScriptRegexEngine(),
});

const steps = [
  {
    id: 1,
    title: "Create a new xmcp app",
    type: "command" as const,
    command: "npx create-xmcp-app@latest",
    output: [
      {
        text: "? What is your project named? ",
        hint: "(my-xmcp-app)",
        answer: "my-server",
        typed: true,
      },
      {
        text: "? Select a template: ",
        hint: "(Use arrow keys)",
        choices: [
          "Default (Standard MCP server)",
          "MCP App (React widgets for ext-apps)",
          "MCP App with UI kit (components and JSON renderer)",
        ],
        pick: 0,
        answer: "Default (Standard MCP server)",
        waitBefore: "prompt",
      },
      {
        text: "? Select a package manager: ",
        hint: "(Use arrow keys)",
        choices: ["npm", "yarn", "pnpm", "bun"],
        pick: 2,
        answer: "pnpm",
        waitBefore: "prompt",
      },
      {
        text: "? Select the transport you want to use: ",
        hint: "(Use arrow keys)",
        choices: [
          "HTTP (runs on a server)",
          "STDIO (runs on the user's machine)",
        ],
        pick: 0,
        answer: "HTTP (runs on a server)",
        waitBefore: "prompt",
      },
      {
        text: "? Select components to initialize: ",
        hint: "(Press <space> to select, <enter> to proceed)",
        choices: ["Tools", "Prompts", "Resources"],
        checkbox: true,
        answer: "Tools, Prompts, Resources",
        waitBefore: "prompt",
      },
      { text: "" },
      {
        text: "Creating a new xmcp app in ",
        answer: "/Users/you/my-server.",
        tone: "path",
      },
      { text: "" },
      {
        text: "? Ok to continue? ",
        hint: "(Y/n)",
        answer: "Yes",
        waitBefore: "prompt",
      },
      {
        text: "✔ Your xmcp app is ready",
        pending: "Creating your xmcp app...",
        waitBefore: "work",
        tone: "success",
      },
      { text: "" },
      { text: "Next steps:" },
      { text: "  cd my-server", tone: "command" },
      { text: "  pnpm dev", tone: "command" },
    ] satisfies ShellLine[],
  },
  {
    id: 2,
    title: "Configure your environment",
    type: "file" as const,
    filename: "xmcp.config.ts",
    content: `import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    port: 3000,
    host: "0.0.0.0",
    endpoint: "/mcp",
    cors: {
      origin: "*",
      credentials: true,
    },
  },
};

export default config;`,
  },
  {
    id: 3,
    title: "Add tools, resources, and prompts",
    type: "file" as const,
    filename: "src/tools/get-weather.ts",
    content: `import { z } from "zod";
import { type InferSchema } from "xmcp";

export const schema = {
  location: z.string().describe("City name"),
};

export const metadata = {
  name: "get-weather",
  description: "Get current weather for a location",
};

export default async function getWeather({ 
  location 
}: InferSchema<typeof schema>) {
  // Your implementation here
  return \`Weather in \${location}: 72°F, Sunny\`;
}`,
  },
  {
    id: 4,
    title: "Deploy your server",
    type: "command" as const,
    command: "vc deploy",
    output: [
      { text: "Vercel CLI 37.0.0" },
      { text: "Inspect: https://vercel.com/...", waitBefore: "prompt" },
      { text: "Production: https://my-server.vercel.app", waitBefore: "work" },
      { text: "" },
      { text: "Deployment Summary:" },
      { text: "  • Environment: Production" },
      { text: "  • Region: iad1" },
      { text: "  • Build Time: 12s" },
      { text: "  • Status: Ready" },
      { text: "" },
      {
        text: "Your MCP server is live!",
        waitBefore: "prompt",
        tone: "success",
      },
    ] satisfies ShellLine[],
  },
];

const Terminal = ({ step }: { step: (typeof steps)[0] }) => {
  const highlightedContent = useMemo(() => {
    if (step.type === "file") {
      return highlighter.codeToHtml(step.content, {
        themes: { light: xmcpLightTheme.name!, dark: XMCP_SHIKI_THEME_NAME },
        lang: "typescript",
        defaultColor: false,
        transformers: [
          {
            name: "remove-background",
            pre: (node) => {
              if (node.properties.style) {
                const style = node.properties.style as string;
                node.properties.style = style.replace(
                  /background-color:[^;]+;?/g,
                  ""
                );
              }
            },
          },
        ],
      });
    }
    return null;
  }, [step]);

  if (step.type === "file") {
    return (
      <CodeBlock title={step.filename} className="not-fumadocs-codeblock">
        <div dangerouslySetInnerHTML={{ __html: highlightedContent || "" }} />
      </CodeBlock>
    );
  }

  return (
    <CodeBlock
      language="shell"
      Actions={({ className }) => (
        <div className={className}>
          <CopyButton text={step.command} label />
        </div>
      )}
    >
      <AnimatedShell command={step.command} output={step.output} />
    </CodeBlock>
  );
};

export const HomeSteps = () => (
  <section id="getting-started" className="editorial-section home-steps">
    <div className="editorial-section-head">
      <h2>Getting started</h2>
      <span aria-hidden="true">III</span>
    </div>
    <p>From a new project to a running server in four steps.</p>
    <div className="editorial-steps">
      {steps.map((step) => (
        <AccordionItem
          key={step.id}
          name="getting-started"
          index={step.id}
          title={step.title}
          open={step.id === 1}
        >
          <Terminal step={step} />
        </AccordionItem>
      ))}
    </div>
  </section>
);
