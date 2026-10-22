// Compilation and Next.js cold starts need a larger budget than individual RPCs.
export const BUILD_TIMEOUT_MS = 120_000;
export const STARTUP_TIMEOUT_MS = 60_000;
export const REQUEST_TIMEOUT_MS = 30_000;
export const FIXTURE_TIMEOUT_MS = 240_000;
// Give servers time to close sockets before terminating their process group.
export const SHUTDOWN_TIMEOUT_MS = 5_000;
// Bound failure messages; the complete output remains in the fixture log.
export const MAX_CAPTURE_CHARS = 64 * 1024;
