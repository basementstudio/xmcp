declare module "xmcp/headers" {
  export const headers: typeof import("../runtime/headers").headers;
}

declare module "xmcp/x402" {
  export const paid: typeof import("../x402").paid;
  export const isPaidHandler: typeof import("../x402").isPaidHandler;
  export const x402Middleware: typeof import("../x402").x402Middleware;
  export const getX402Config: typeof import("../x402").getX402Config;
  export const payment: typeof import("../x402").payment;
  export const x402Registry: typeof import("../x402").x402Registry;
  export const x402Interceptor: typeof import("../x402").x402Interceptor;
  export const setPaymentContext: typeof import("../x402").setPaymentContext;
  export const getPaymentContext: typeof import("../x402").getPaymentContext;
  export type X402Config = import("./x402").X402Config;
  export type X402ToolOptions = import("./x402").X402ToolOptions;
  export type X402PaymentContext = import("./x402").X402PaymentContext;
  export type PaidHandlerExtra = import("./x402").PaidHandlerExtra;
  export type PaidToolHandler<
    TArgs = unknown,
    TResult = unknown,
  > = import("./x402").PaidToolHandler<TArgs, TResult>;
  export type PaidHandler<
    TArgs = unknown,
    TResult = unknown,
  > = import("./x402").PaidHandler<TArgs, TResult>;
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
