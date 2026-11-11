import {
  type McpAuthorize,
  type McpMiddleware,
  type Middleware,
  type RequestContext,
} from "xmcp";

// Public demo credentials only. Use your authentication provider in production.
const demoCredentials = new Map([
  ["demo-reader", { clientId: "reader", scopes: ["greet"] }],
  ["demo-limited", { clientId: "limited", scopes: [] }],
]);

const middleware: Middleware[] = [
  (req, res, next) => {
    const token = req.header("x-api-key");
    const caller = token ? demoCredentials.get(token) : undefined;
    if (!token || !caller) {
      res.status(401).json({ error: "Missing or invalid demo API key" });
      return;
    }
    const auth: NonNullable<RequestContext["authInfo"]> = {
      token,
      clientId: caller.clientId,
      scopes: [...caller.scopes],
    };
    Object.assign(req, { auth });
    next();
  },
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

// One policy hides components from every listing and rejects direct calls,
// prompt gets, reads and completions as if they did not exist.
export const authorize: McpAuthorize = (ctx, component) => {
  const required = component.metadata._meta?.["demo/requires"];
  if (required === undefined) return true;
  return (
    Array.isArray(required) &&
    required.every(
      (scope) =>
        typeof scope === "string" && ctx.authInfo?.scopes.includes(scope)
    )
  );
};

export const mcp = [stampResult, checkName];
