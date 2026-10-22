// A legacy-only peer exercises fallback and pagination independently of xmcp's
// modern server. The main conformance matrix runs the CLI against compiled xmcp fixtures.
export const LEGACY_CLI_SERVER = `
const transport = process.argv[2];
const variant = process.argv[3];
function reply(request) {
  if (request.id === undefined) return;
  const error = (code, message) => ({ jsonrpc: "2.0", id: request.id, error: { code, message } });
  const result = value => ({ jsonrpc: "2.0", id: request.id, result: value });
  if (request.method === "server/discover") return error(-32601, "Legacy peer");
  if (request.method === "initialize") {
    console.error("fixture pid=" + process.pid);
    return result({ protocolVersion: "2025-11-25", capabilities: variant === "empty" ? {} : { tools: {}, prompts: {}, resources: {} },
      serverInfo: { name: "legacy-fixture", version: "1.0.0" }, instructions: JSON.stringify(process.argv.slice(4)) });
  }
  if (variant === "empty") return error(-32601, "Unsupported capability was requested");
  if (variant === "fail") return error(-32603, "fixture listing failed");
  const page = request.params?.cursor === "second" ? 2 : 1;
  const cursor = page === 1 ? { nextCursor: "second" } : {};
  switch (request.method) {
    case "tools/list": return result({ tools: [{ name: "tool-" + page, inputSchema: page === 1 ? { type: "object", properties: {} } : { type: "object", properties: { count: { type: "integer", minimum: 1 } }, required: ["count"] } }], ...cursor });
    case "prompts/list": return result({ prompts: [{ name: "prompt-" + page, arguments: [{ name: "name", required: true }] }], ...cursor });
    case "resources/list": return result({ resources: [{ name: "resource-" + page, uri: "fixture://" + page }], ...cursor });
    case "resources/templates/list": return result({ resourceTemplates: [{ name: "template-" + page, uriTemplate: "fixture://" + page + "/{id}" }], ...cursor });
    case "tools/call":
      require("node:fs").appendFileSync("calls.log", JSON.stringify(request.params) + "\\n");
      if (request.params.name === "tool-1") return result({ isError: true, content: [{ type: "text", text: "Application failure" }], _meta: { fixture: true } });
      if (request.params.arguments.remoteFailure) return error(-32603, "Remote execution failed");
      return result({ content: [{ type: "text", text: "done" }, { type: "image", data: "aGk=", mimeType: "image/png" }], structuredContent: request.params.arguments, _meta: { fixture: true } });
    case "prompts/get": return result({ description: "Fixture prompt", messages: [{ role: "user", content: { type: "text", text: request.params.arguments.name } }, { role: "assistant", content: { type: "text", text: "response" } }], _meta: { fixture: true } });
    case "resources/read":
      if (request.params.uri === "fixture://missing") return error(-32002, "Resource not found");
      return result({ contents: [{ uri: request.params.uri, text: "text", mimeType: "text/plain" }, { uri: "fixture://blob", blob: "aGk=", mimeType: "application/octet-stream" }], _meta: { fixture: true } });
    default: return error(-32601, "Unknown method");
  }
}
if (transport === "http") {
  const server = require("node:http").createServer(async (request, response) => {
    if (request.method !== "POST") { response.writeHead(405).end(); return; }
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const message = reply(JSON.parse(Buffer.concat(chunks).toString()));
    if (!message) { response.writeHead(202).end(); return; }
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(message));
  });
  server.listen(0, "127.0.0.1", () => console.log("E2E_READY http://127.0.0.1:" + server.address().port + "/mcp"));
} else {
  require("node:readline").createInterface({ input: process.stdin }).on("line", line => {
    const message = reply(JSON.parse(line));
    if (message) process.stdout.write(JSON.stringify(message) + "\\n");
  });
}
`;
