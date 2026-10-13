"use client";

import { useMemo } from "react";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import ts from "@shikijs/langs/typescript";
import bash from "@shikijs/langs/bash";
import { CodeBlock } from "@/components/codeblock";
import { AccordionItem } from "@/components/ui/accordion-item";
import { CopyButton } from "@/components/ui/copy-button";
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
    output: `? What is your project named? my-server
? Select a package manager: pnpm
? Select the transport you want to use: HTTP (runs on a server)
? Select components to initialize:
  ◉ Tools
  ◉ Prompts
  ◉ Resources

✔ Creating a new xmcp app in ...
✔ Your xmcp app is ready

Next steps:
  cd my-server
  pnpm dev
`,
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
    output: `Vercel CLI 37.0.0
Inspect: https://vercel.com/...
Production: https://my-server.vercel.app

Deployment Summary:
  • Environment: Production
  • Region: iad1
  • Build Time: 12s
  • Status: Ready

Your MCP server is live!`,
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
      <pre>
        <code>{step.command}</code>
        {"\n\n"}
        <span className="text-brand-neutral-100">{step.output}</span>
      </pre>
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
