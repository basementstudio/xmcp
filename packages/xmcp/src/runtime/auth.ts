import { getHttpRequestContext } from "./contexts/http-request-context";

export const auth = () => {
  return getHttpRequestContext().auth;
};
