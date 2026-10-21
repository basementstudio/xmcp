import { type McpMiddleware, type Middleware, type RequestContext } from "xmcp";

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

function canGreet(authInfo: RequestContext["authInfo"]): boolean {
  return authInfo?.scopes.includes("greet") ?? false;
}

const authorizeTools: McpMiddleware = async (ctx, next) => {
  if (
    ctx.method === "tools/call" &&
    ctx.params.name === "greet" &&
    !canGreet(ctx.authInfo)
  ) {
    return { isError: true, content: [{ type: "text", text: "Forbidden" }] };
  }
  const result = await next();
  if (ctx.method === "tools/list" && Array.isArray(result.tools)) {
    return {
      ...result,
      tools: result.tools.filter(
        (tool) => tool.name !== "greet" || canGreet(ctx.authInfo)
      ),
    };
  }
  return result;
};

export const mcp = [authorizeTools, stampResult, checkName, protectResource];
