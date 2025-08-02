declare module "xmcp/headers" {
  export const headers: typeof import("../runtime/headers").headers;
}

// export context so all packages relate to the same definition
// list of utilities and stuff needed for plugins development
declare module "xmcp/utils" {
  export const createContext: typeof import("../utils").createContext;
  export const getHttpTransportContext: typeof import("../utils").getHttpTransportContext;
}
