export function log(debug: boolean, message: string, data?: unknown): void {
  if (!debug) return;

  if (data !== undefined) {
    console.log(
      `[x402] ${message}`,
      typeof data === "string" ? data : JSON.stringify(data, null, 2)
    );
  } else {
    console.log(`[x402] ${message}`);
  }
}

export function logError(message: string, error?: unknown): void {
  console.error(`[x402] ${message}`, error);
}
