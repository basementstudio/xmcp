export function log(debug: boolean, message: string, data?: unknown): void {
  if (!debug) return;

  if (data !== undefined) {
    console.log(
      `[mpp] ${message}`,
      typeof data === "string" ? data : JSON.stringify(data, null, 2)
    );
  } else {
    console.log(`[mpp] ${message}`);
  }
}

export function logError(message: string, error?: unknown): void {
  console.error(`[mpp] ${message}`, error);
}
