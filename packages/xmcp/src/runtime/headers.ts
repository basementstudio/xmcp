import { getHttpRequestContext } from "./contexts/http-request-context";

export const headers = () => {
  const headers = getHttpRequestContext().headers;

  return headers;
};
