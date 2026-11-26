type HeaderValue = string | string[] | undefined;

export interface RequestOriginInput {
  forwardedProto?: HeaderValue;
  forwardedHost?: HeaderValue;
  protocol?: HeaderValue;
  host?: HeaderValue;
}

const DEFAULT_HOST = "localhost";

// hostname[:port] where hostname is a DNS name, an IPv4 address, or a
// bracketed IPv6 address. Anything else (paths, userinfo, query, fragment,
// whitespace) is rejected so it cannot change the resulting origin.
const HOST_PATTERN =
  /^(?:\[[0-9a-f:.]+\]|[a-z0-9_-]+(?:\.[a-z0-9_-]+)*)(?::(\d{1,5}))?$/i;

function firstValue(value: HeaderValue): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(",")[0]?.trim();
}

function normalizeProtocol(value: HeaderValue): "http" | "https" | undefined {
  const protocol = firstValue(value)?.toLowerCase();
  return protocol === "http" || protocol === "https" ? protocol : undefined;
}

function normalizeHost(value: HeaderValue): string | undefined {
  const host = firstValue(value);
  const match = host ? HOST_PATTERN.exec(host) : null;
  if (!host || !match) return undefined;

  const port = match[1];
  if (port !== undefined && (Number(port) < 1 || Number(port) > 65535)) {
    return undefined;
  }

  try {
    new URL(`http://${host}`);
    return host;
  } catch {
    return undefined;
  }
}

/**
 * Resolves the public origin of a request for discovery URLs.
 * Forwarded values win when they are a valid http(s) protocol and a plain
 * host; otherwise the request's own protocol and Host header are used.
 */
export function resolveRequestOrigin(input: RequestOriginInput): string {
  const protocol =
    normalizeProtocol(input.forwardedProto) ??
    normalizeProtocol(input.protocol) ??
    "http";
  const host =
    normalizeHost(input.forwardedHost) ??
    normalizeHost(input.host) ??
    DEFAULT_HOST;

  return new URL(`${protocol}://${host}`).origin;
}
