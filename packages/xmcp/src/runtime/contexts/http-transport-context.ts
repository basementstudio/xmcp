import { createContext } from "../../utils/context";
import { RuntimeHttpConfig } from "../transports/http";

export interface HttpTransportContext {
  config: {
    http?: RuntimeHttpConfig;
  };
}

export const httpTransportContext = createContext<HttpTransportContext>({
  name: "http-transport-context",
});

export const setHttpTransportContext = httpTransportContext.setContext;

export const getHttpTransportContext = httpTransportContext.getContext;

export const httpTransportContextProvider = httpTransportContext.provider;
