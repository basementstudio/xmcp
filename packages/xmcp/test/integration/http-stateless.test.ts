import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";
import * as ts from "typescript";
import {
  buildFixture,
  inspectorCli,
  spawnHttpServer,
  postJsonRpc,
  type ServerHandle,
} from "./_utils";

const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");
const STATELESS_TRANSPORT = path.join(
  PACKAGE_ROOT,
  "src",
  "runtime",
  "transports",
  "http",
  "stateless-streamable-http.ts"
);

// State-shaped types that have no business living at module/class scope
// in a transport that promises to be stateless. If you must add one (e.g.
// a request-scoped Map released before the response settles), name it
// here AND document why in the source.
const FORBIDDEN_STATE_TYPES = ["Map", "Set", "WeakMap", "WeakSet", "Cache"];

describe("HTTP transport — stateless contract", () => {
  describe("Layer A: code-shape (AST) assertions", () => {
    let source: string;
    let sourceFile: ts.SourceFile;

    beforeAll(async () => {
      source = await fs.readFile(STATELESS_TRANSPORT, "utf8");
      sourceFile = ts.createSourceFile(
        STATELESS_TRANSPORT,
        source,
        ts.ScriptTarget.Latest,
        /* setParentNodes */ true,
        ts.ScriptKind.TS
      );
    });

    it("constructs StreamableHTTPServerTransport with sessionIdGenerator: undefined", () => {
      let found = false;

      const visit = (node: ts.Node) => {
        if (
          ts.isNewExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text.endsWith("StreamableHTTPServerTransport")
        ) {
          const arg = node.arguments?.[0];
          if (arg && ts.isObjectLiteralExpression(arg)) {
            const sigProp = arg.properties.find(
              (p): p is ts.PropertyAssignment =>
                ts.isPropertyAssignment(p) &&
                ts.isIdentifier(p.name) &&
                p.name.text === "sessionIdGenerator"
            );
            if (
              sigProp &&
              sigProp.initializer.kind === ts.SyntaxKind.UndefinedKeyword
            ) {
              found = true;
            }
            // Also accept literal `undefined` identifier
            if (
              sigProp &&
              ts.isIdentifier(sigProp.initializer) &&
              sigProp.initializer.text === "undefined"
            ) {
              found = true;
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);

      expect(
        found,
        "StreamableHTTPServerTransport must be instantiated with `sessionIdGenerator: undefined`. " +
          "If you removed this, the transport just stopped being stateless."
      ).toBe(true);
    });

    it("the transport classes hold no fields of forbidden state types", () => {
      const offenders: { className: string; field: string; type: string }[] =
        [];

      const visit = (node: ts.Node) => {
        if (ts.isClassDeclaration(node) && node.name) {
          const className = node.name.text;
          for (const member of node.members) {
            if (!ts.isPropertyDeclaration(member)) continue;
            if (!member.type) continue;
            const typeText = member.type.getText(sourceFile);
            for (const forbidden of FORBIDDEN_STATE_TYPES) {
              const re = new RegExp(`\\b${forbidden}\\b`);
              if (re.test(typeText)) {
                const fieldName = member.name.getText(sourceFile);
                offenders.push({
                  className,
                  field: fieldName,
                  type: typeText,
                });
              }
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);

      expect(
        offenders,
        "Stateless transport classes must not hold cross-request state. " +
          "Forbidden field types: " +
          FORBIDDEN_STATE_TYPES.join(", ") +
          ". Found: " +
          JSON.stringify(offenders, null, 2)
      ).toEqual([]);
    });

    it("handleStatelessRequest creates a fresh MCP server per request", () => {
      // The method body must call createServerFn — no hoisted server reuse.
      expect(source).toMatch(
        /handleStatelessRequest[\s\S]*?this\.createServerFn\(/
      );
    });

    it("wires res.on('close', ...) cleanup on the request lifecycle", () => {
      expect(source).toMatch(/res\.on\(\s*["']close["']/);
    });

    it('the /health route reports mode: "stateless"', () => {
      expect(source).toMatch(/mode:\s*["']stateless["']/);
    });
  });

  describe("Layer B: behavioural assertions on a live server", () => {
    let server: ServerHandle;

    beforeAll(async () => {
      const built = await buildFixture("basic-tools");
      expect(built.exitCode).toBe(0);
      server = await spawnHttpServer("basic-tools");
    }, 90_000);

    afterAll(async () => {
      await server?.stop();
    });

    it("/health returns mode: stateless", async () => {
      const res = await fetch(`http://127.0.0.1:${server.port}/health`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ mode: "stateless" });
    });

    it("does not set Mcp-Session-Id on the response", async () => {
      const initRes = await postJsonRpc(server.url, {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "vitest", version: "1.0.0" },
        },
      });
      expect(initRes.status).toBe(200);
      // Header is allow-listed in CORS for the client direction, but the
      // server itself must not issue one in stateless mode.
      expect(initRes.headers.get("mcp-session-id")).toBeNull();
    });

    it("survives 25 concurrent initialize requests", async () => {
      const requests = Array.from({ length: 25 }, (_, i) =>
        postJsonRpc(server.url, {
          jsonrpc: "2.0",
          id: i,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: `client-${i}`, version: "1.0" },
          },
        })
      );
      const results = await Promise.all(requests);
      for (const r of results) {
        expect(r.status).toBe(200);
      }
    });

    // Inspector-driven layer: drives the same live server through the
    // canonical MCP client. Direct fetch above asserts header shape and
    // statelessness; these assert end-to-end protocol conformance.
    describe("via @modelcontextprotocol/inspector --cli", () => {
      it("tools/list returns the echo tool", async () => {
        const result = await inspectorCli<{ tools: { name: string }[] }>({
          transport: "http",
          url: server.url,
          method: "tools/list",
        });
        expect(result.tools.map((t) => t.name)).toContain("echo");
      });

      it("tools/call echo returns the message", async () => {
        const result = await inspectorCli<{
          content: Array<{ type: string; text: string }>;
        }>({
          transport: "http",
          url: server.url,
          method: "tools/call",
          toolName: "echo",
          toolArgs: { message: "via-inspector-http" },
        });
        expect(result.content[0]?.text).toBe("echo: via-inspector-http");
      });
    });
  });
});
