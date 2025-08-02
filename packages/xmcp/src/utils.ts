import { createContext as createContextUtils } from "./utils/context";
import { httpTransportContext } from "./runtime/contexts/http-transport-context";

export const createContext = createContextUtils;
export const getHttpTransportContext = httpTransportContext.getContext;
