declare module "xmcp/headers" {
  export const headers: typeof import("../runtime/headers").headers;
}

declare module "xmcp/utils" {
  export const createContext: typeof import("../runtime/utils").createContext;
  export const getHttpTransportContext: typeof import("../runtime/utils").getHttpTransportContext;
}
