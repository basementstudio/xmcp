import type { McpAuthorize, Middleware, RequestContext } from "xmcp";

type AuthInfo = NonNullable<RequestContext["authInfo"]>;

const demoCallers = new Map([
  ["demo-support", { clientId: "support-agent", scopes: ["support"] }],
  ["demo-admin", { clientId: "billing-admin", scopes: ["support", "admin"] }],
]);

const authenticate: Middleware = (req, res, next) => {
  const token = req.header("x-api-key");
  const caller = token ? demoCallers.get(token) : undefined;
  if (!token || !caller) {
    res.status(401).json({ error: "Missing or invalid demo API key" });
    return;
  }
  const auth: AuthInfo = { token, ...caller };
  Object.assign(req, { auth });
  next();
};

export default authenticate;

export const authorize: McpAuthorize = (ctx, component) => {
  const requiredRoles = component.metadata.tags ?? [];
  return requiredRoles.every(
    (role) => ctx.authInfo?.scopes.includes(role) ?? false
  );
};
