import { REQUEST_CONTEXT_FILES } from "../fixtures/request-context.js";
import { REQUEST_HELPERS_FILES } from "../fixtures/request-helpers.js";

// These are real application modules compiled by xmcp, not mocked handlers.
export const TOOL_ADD = `import { z } from "zod";
export const schema = { a: z.number(), b: z.number() };
export const outputSchema = { sum: z.number() };
export const metadata = { name: "add", description: "Add two numbers", annotations: { readOnlyHint: true } };
export default function add({ a, b }: { a: number; b: number }) { return { sum: a + b }; }
`;

export const DEFAULT_FILES: Record<string, string> = {
  ...REQUEST_CONTEXT_FILES,
  ...REQUEST_HELPERS_FILES,
  "src/tools/add.ts": TOOL_ADD,
  "src/tools/client-info.ts": `import type { ToolExtraArguments } from "xmcp";
export const metadata = { name: "client-info", description: "Echo request client identity" };
export default function clientInfo(_args: unknown, extra: ToolExtraArguments) {
  return { structuredContent: { clientInfo: extra.clientInfo ?? null } };
}
`,
  "src/tools/fail.ts": `export const metadata = { name: "fail", description: "Return an application error" };
export default function fail() { return { isError: true, content: [{ type: "text", text: "Expected fixture error" }] }; }
`,
  "src/tools/confirm.ts": `import { inputRequired, acceptedContent, type ToolExtraArguments } from "xmcp";
export const metadata = { name: "confirm", description: "Ask for confirmation" };
export default function confirm(_args: unknown, extra: ToolExtraArguments) {
  const answer = acceptedContent<{ confirmed: boolean }>(extra.inputResponses, "confirmation");
  if (!answer) return inputRequired({ inputRequests: { confirmation: inputRequired.elicit({
    message: "Confirm?", requestedSchema: { type: "object", properties: { confirmed: { type: "boolean" } }, required: ["confirmed"] }
  }) } });
  return answer.confirmed ? "confirmed" : "declined";
}
`,
  "src/prompts/greet.ts": `import { z } from "zod";
export const schema = { name: z.string() };
export const metadata = { name: "greet", title: "Greeting", description: "Greet a user", role: "user" };
export default function greet({ name }: { name: string }) { return "Hello, " + name; }
`,
  "src/resources/(fixture)/info.ts": `export const metadata = { name: "info", description: "Static fixture data" };
export default function info() { return "fixture information"; }
`,
  "src/resources/(fixture)/users/[id]/index.ts": `import { z } from "zod";
export const schema = { id: z.string() };
export const metadata = { name: "user", description: "Templated fixture data" };
export default function user({ id }: { id: string }) { return "user:" + id; }
`,
};

// Hosts signal readiness only after listening. No fixed startup sleeps.
const LISTEN = `server.listen(0, "127.0.0.1", () => console.log("E2E_READY http://127.0.0.1:" + server.address().port + "/mcp"));`;

export function adapterHost(
  kind: "express" | "fastify" | "nestjs" | "nextjs"
): string {
  switch (kind) {
    case "express":
      return `const express = require("express");
const { xmcpHandler } = require("./.xmcp/adapter/index.js");
const app = express(); app.use(express.json()); app.all("/mcp", xmcpHandler);
const server = require("node:http").createServer(app); ${LISTEN}
`;
    case "fastify":
      return `const app = require("fastify")();
const { xmcpHandler } = require("./.xmcp/adapter/index.js");
app.all("/mcp", xmcpHandler);
app.listen({ port: 0, host: "127.0.0.1" }).then((address) => console.log("E2E_READY " + address + "/mcp"));
`;
    case "nestjs":
      return `require("reflect-metadata");
const { Module, Controller, Inject } = require("@nestjs/common");
const { NestFactory } = require("@nestjs/core");
const { XmcpService, XmcpController } = require("./.xmcp/adapter/index.js");
Controller("mcp")(XmcpController); Inject(XmcpService)(XmcpController, undefined, 0);
class AppModule {};
Module({ controllers: [XmcpController], providers: [XmcpService] })(AppModule);
NestFactory.create(AppModule, { logger: false }).then(async (app) => {
  await app.listen(0, "127.0.0.1"); console.log("E2E_READY " + await app.getUrl() + "/mcp");
});
`;
    case "nextjs":
      return `const next = require("next");
const app = next({ dev: true, dir: process.cwd(), hostname: "127.0.0.1" });
app.prepare().then(() => {
  const server = require("node:http").createServer(app.getRequestHandler()); ${LISTEN}
});
`;
  }
}
