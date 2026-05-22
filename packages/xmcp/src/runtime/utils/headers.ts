import type { HttpHeaders } from "@/runtime/contexts/http-request-context";

/**
 * Reads a single header value case-insensitively. Returns the first value for
 * array-valued headers and undefined when missing or empty.
 */
export const getHeaderValue = (
  headers: HttpHeaders,
  headerName: string
): string | undefined => {
  const normalizedHeaderName = headerName.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== normalizedHeaderName) {
      continue;
    }

    const headerValue = Array.isArray(value) ? value[0] : value;
    if (typeof headerValue !== "string") {
      return undefined;
    }

    const trimmedValue = headerValue.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  return undefined;
};
