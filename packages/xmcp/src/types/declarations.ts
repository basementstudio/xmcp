declare module "xmcp/headers" {
  export const headers: typeof import("../runtime/headers").headers;
}

declare module "xmcp/utils" {
  export const createContext: typeof import("../utils").createContext;
  export const getHttpTransportContext: typeof import("../utils").getHttpTransportContext;
}
