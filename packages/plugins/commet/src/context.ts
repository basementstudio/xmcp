import { createContext } from "xmcp";
import type { Commet } from "@commet/node";

interface CommetContext {
  client: Commet;
  customerId: string | null;
}

const context = createContext<CommetContext>({ name: "commet-context" });

export const getCommetContext = context.getContext;
export const providerCommetContext = context.provider;
