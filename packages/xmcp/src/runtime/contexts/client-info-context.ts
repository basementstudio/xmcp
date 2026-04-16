import type { McpClientInfo } from "@/types/client-info";
import { createContext } from "../../utils/context";

export interface ClientInfoContext {
  clientInfo?: McpClientInfo;
}

export const clientInfoContext = createContext<ClientInfoContext>({
  name: "client-info-context",
});

export const setClientInfoContext = clientInfoContext.setContext;

export const getClientInfoContext = clientInfoContext.getContext;

export const clientInfoContextProvider = clientInfoContext.provider;
