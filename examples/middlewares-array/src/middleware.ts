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
  ctx.set("example.tool", ctx.params.name);
  const result = await next();
  return {
    ...result,
    _meta: { ...result._meta, tool: ctx.get<string>("example.tool") },
  };
};

const checkName: McpMiddleware = (ctx, next) => {
  if (ctx.params.name === "greet" && ctx.params.arguments.name === "blocked") {
    return {
      isError: true,
      content: [
        { type: "text", text: "This name is blocked by MCP middleware" },
      ],
    };
  }
  return next();
};

export const mcp = [stampResult, checkName];
