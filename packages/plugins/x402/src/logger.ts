import { getX402Config } from "./middleware.js";

export function log(message: string, data?: unknown): void {
  const config = getX402Config();
  if (config?.debug) {
    if (data !== undefined) {
      console.log(
        `[x402] ${message}`,
        typeof data === "string" ? data : JSON.stringify(data, null, 2)
      );
    } else {
      console.log(`[x402] ${message}`);
    }
  }
}

export function logError(message: string, error?: unknown): void {
  console.error(`[x402] ${message}`, error);
}
