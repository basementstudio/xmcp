import { IncomingHttpHeaders } from "http";
import { createContext } from "../../utils/context";

export interface HttpRequestContext {
  id: string;
  headers: IncomingHttpHeaders;
}

export const httpRequestContext = createContext<HttpRequestContext>({
  name: "http-request-context",
});

export const setHttpRequestContext = httpRequestContext.setContext;

export const getHttpRequestContext = httpRequestContext.getContext;

export const httpRequestContextProvider = httpRequestContext.provider;
