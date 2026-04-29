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
const WEB_STATELESS_TRANSPORT = path.join(
  PACKAGE_ROOT,
  "src",
  "runtime",
  "transports",
  "http",
  "web-stateless-http.ts"
);
const CLOUDFLARE_WORKER = path.join(
  PACKAGE_ROOT,
  "src",
  "runtime",
  "platforms",
  "cloudflare",
  "worker.ts"
);

// State-shaped types that have no business living at module/class scope
// in a transport that promises to be stateless. If you must add one (e.g.
// a request-scoped Map released before the response settles), name it
// here AND document why in the source.
const FORBIDDEN_STATE_TYPES = ["Map", "Set", "WeakMap", "WeakSet", "Cache"];

// Marker callers must place in a doc/line comment immediately above any
// class field whose type is in FORBIDDEN_STATE_TYPES. Acts as the explicit
// allow-list signal: the field is request-scoped because the class is
// instantiated fresh per request at the call site. Add one and the AST
// check stops flagging the field.
const REQUEST_SCOPED_MARKER = "@stateless: request-scoped";

function fieldHasRequestScopedMarker(
  member: ts.PropertyDeclaration,
  source: string
): boolean {
  const start = member.getFullStart();
  const triviaEnd = member.getStart();
  const leading = source.slice(start, triviaEnd);
  return leading.includes(REQUEST_SCOPED_MARKER);
}

interface StateOffender {
  className: string;
  field: string;
  type: string;
}

function findForbiddenStateFields(
  sourceFile: ts.SourceFile,
  source: string,
  options: { allowRequestScoped: boolean }
): StateOffender[] {
  const offenders: StateOffender[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isClassDeclaration(node) && node.name) {
      const className = node.name.text;
      for (const member of node.members) {
        if (!ts.isPropertyDeclaration(member)) continue;
        if (!member.type) continue;
        const typeText = member.type.getText(sourceFile);
        for (const forbidden of FORBIDDEN_STATE_TYPES) {
          const re = new RegExp(`\\b${forbidden}\\b`);
          if (!re.test(typeText)) continue;
          if (
            options.allowRequestScoped &&
            fieldHasRequestScopedMarker(member, source)
          ) {
            continue;
          }
          offenders.push({
            className,
            field: member.name.getText(sourceFile),
            type: typeText,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return offenders;
}

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
      const offenders = findForbiddenStateFields(sourceFile, source, {
        allowRequestScoped: false,
      });

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

// The Cloudflare Workers transport is a sibling stateless contract: the class
// itself can hold state-shaped fields, but only because the call site
// instantiates one transport per request. Two invariants protect that:
//   1. Any forbidden-type field in the class is explicitly tagged with
//      `@stateless: request-scoped`.
//   2. cloudflare/worker.ts never hoists `new WebStatelessHttpTransport(...)`
//      to module/global scope — the constructor must run inside the per-
//      request handler so the Maps never see traffic from another request.
describe("Web (Cloudflare) HTTP transport — stateless contract", () => {
  describe("Layer A: code-shape (AST) assertions", () => {
    let source: string;
    let sourceFile: ts.SourceFile;

    beforeAll(async () => {
      source = await fs.readFile(WEB_STATELESS_TRANSPORT, "utf8");
      sourceFile = ts.createSourceFile(
        WEB_STATELESS_TRANSPORT,
        source,
        ts.ScriptTarget.Latest,
        /* setParentNodes */ true,
        ts.ScriptKind.TS
      );
    });

    it("only allows forbidden-type fields when explicitly tagged @stateless: request-scoped", () => {
      const offenders = findForbiddenStateFields(sourceFile, source, {
        allowRequestScoped: true,
      });

      expect(
        offenders,
        "WebStatelessHttpTransport may hold per-request Map/Set fields, but " +
          'each one must be preceded by a "' +
          REQUEST_SCOPED_MARKER +
          '" comment so the intent is explicit. ' +
          "Untagged offenders: " +
          JSON.stringify(offenders, null, 2)
      ).toEqual([]);
    });

    it("the transport class is documented as request-scoped (sanity check)", () => {
      // Removing the markers entirely should make the previous assertion
      // fire — this test pins that markers are present at all, so a future
      // refactor that strips them gets caught even if the field types also
      // change in the same edit.
      expect(source).toContain(REQUEST_SCOPED_MARKER);
    });
  });

  describe("Layer A: cloudflare/worker.ts call-site contract", () => {
    let source: string;
    let sourceFile: ts.SourceFile;

    beforeAll(async () => {
      source = await fs.readFile(CLOUDFLARE_WORKER, "utf8");
      sourceFile = ts.createSourceFile(
        CLOUDFLARE_WORKER,
        source,
        ts.ScriptTarget.Latest,
        /* setParentNodes */ true,
        ts.ScriptKind.TS
      );
    });

    it("instantiates WebStatelessHttpTransport inside a function body, not at module scope", () => {
      const moduleScopeNews: string[] = [];
      const insideFunctionNews: string[] = [];

      const visit = (node: ts.Node, inFunction: boolean) => {
        if (
          ts.isNewExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === "WebStatelessHttpTransport"
        ) {
          const snippet = node.getText(sourceFile);
          if (inFunction) {
            insideFunctionNews.push(snippet);
          } else {
            moduleScopeNews.push(snippet);
          }
        }

        const enteringFunction =
          ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isArrowFunction(node) ||
          ts.isMethodDeclaration(node) ||
          ts.isConstructorDeclaration(node);

        ts.forEachChild(node, (child) =>
          visit(child, inFunction || enteringFunction)
        );
      };
      visit(sourceFile, /* inFunction */ false);

      expect(
        moduleScopeNews,
        "WebStatelessHttpTransport must not be instantiated at module scope. " +
          "A hoisted instance reuses its internal Maps across requests, " +
          "which silently breaks statelessness."
      ).toEqual([]);

      expect(
        insideFunctionNews.length,
        "Expected at least one per-request `new WebStatelessHttpTransport(...)` " +
          "inside a function in cloudflare/worker.ts."
      ).toBeGreaterThan(0);
    });
  });
});
