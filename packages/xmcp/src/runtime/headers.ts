import { getHttpRequestContext } from "./contexts/http-request-context";

export const headers = () => {
  const currentHeaders = getHttpRequestContext().headers;
  const headerLookup = new Map<string, string>();

  for (const key of Object.keys(currentHeaders)) {
    const normalizedKey = key.toLowerCase();

    if (!headerLookup.has(normalizedKey)) {
      headerLookup.set(normalizedKey, key);
    }
  }

  const resolveHeaderKey = (prop: string): string => {
    return headerLookup.get(prop.toLowerCase()) ?? prop;
  };

  return new Proxy(currentHeaders, {
    get(target, prop, receiver) {
      if (typeof prop !== "string") {
        return Reflect.get(target, prop, receiver);
      }

      return Reflect.get(target, resolveHeaderKey(prop), receiver);
    },
    has(target, prop) {
      if (typeof prop !== "string") {
        return Reflect.has(target, prop);
      }

      return Reflect.has(target, resolveHeaderKey(prop));
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop !== "string") {
        return Reflect.getOwnPropertyDescriptor(target, prop);
      }

      return Reflect.getOwnPropertyDescriptor(target, resolveHeaderKey(prop));
    },
  });
};
