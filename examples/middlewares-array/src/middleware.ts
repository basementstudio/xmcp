import {
  apiKeyAuthMiddleware,
  type Middleware,
  type McpMiddleware,
} from "xmcp";

const middleware: Middleware[] = [
  apiKeyAuthMiddleware({
    headerName: "x-api-key",
    apiKey: "12345",
  }),
  (_req, res, next) => {
    res.setHeader("x-example", "middlewares-array");
    next();
  },
];

export default middleware;

const stampResult: McpMiddleware = async (ctx, next) => {
  if (ctx.method !== "tools/call") return next();
  ctx.set("example.tool", ctx.params.name);
  const result = await next();
  return {
    ...result,
    _meta: { ...result._meta, tool: ctx.get<string>("example.tool") },
  };
};

const checkName: McpMiddleware = (ctx, next) => {
  if (
    ctx.method === "tools/call" &&
    ctx.params.name === "greet" &&
    ctx.params.arguments.name === "blocked"
  ) {
    return {
      isError: true,
      content: [
        { type: "text", text: "This name is blocked by MCP middleware" },
      ],
    };
  }
  return next();
};

const protectResource: McpMiddleware = async (ctx, next) => {
  if (
    ctx.method === "resources/read" &&
    new URL(ctx.params.uri).href === "demo://private"
  ) {
    throw new Error("This resource is private");
  }
  const result = await next();
  if (ctx.method === "resources/list" && Array.isArray(result.resources)) {
    return {
      ...result,
      resources: result.resources.filter(
        (resource) => resource.uri !== "demo://private"
      ),
    };
  }
  return result;
};

export const mcp = [stampResult, checkName, protectResource];
