declare module "xmcp/headers" {
  export const headers: typeof import("../runtime/headers").headers;
}

declare module "xmcp/cloudflare" {
  export const cloudflareAuthMiddleware: typeof import("../runtime/adapters/cloudflare/middleware/auth").cloudflareAuthMiddleware;
  export type CloudflareMiddleware = import("../runtime/adapters/cloudflare/middleware/types").CloudflareMiddleware;
  export type CloudflareAuthConfig = import("../runtime/adapters/cloudflare/middleware/types").CloudflareAuthConfig;
  export type AuthInfo = import("../runtime/adapters/cloudflare/middleware/types").AuthInfo;
  export type NextFunction = import("../runtime/adapters/cloudflare/middleware/types").NextFunction;
}

declare module "xmcp/plugins/x402" {
  export const isPaidHandler: typeof import("../plugins/x402/index").isPaidHandler;
  export const getX402Registry: typeof import("../plugins/x402/index").getX402Registry;
  export type X402ToolOptions = import("../plugins/x402/index").X402ToolOptions;
  export type PaidHandler = import("../plugins/x402/index").PaidHandler;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.less" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.less" {
  const content: string;
  export default content;
}
