import { ResolvedHttpConfig } from "@/compiler/config";
import { createContext } from "../../utils/context";

export interface HttpTransportContext {
  config: {
    http?: ResolvedHttpConfig;
  };
}

export const httpTransportContext = createContext<HttpTransportContext>({
  name: "http-transport-context",
});

export const setHttpTransportContext = httpTransportContext.setContext;

export const getHttpTransportContext = httpTransportContext.getContext;

export const httpTransportContextProvider = httpTransportContext.provider;
