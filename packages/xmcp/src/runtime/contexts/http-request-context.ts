import { createContext } from "../../utils/context";

// Headers type compatible with both Node.js IncomingHttpHeaders and Web API headers
export type HttpHeaders = Record<string, string | string[] | undefined>;

export interface HttpRequestContext {
  id: string;
  headers: HttpHeaders;
}

export const httpRequestContext = createContext<HttpRequestContext>({
  name: "http-request-context",
});

export const setHttpRequestContext = httpRequestContext.setContext;

export const getHttpRequestContext = httpRequestContext.getContext;

export const httpRequestContextProvider = httpRequestContext.provider;
