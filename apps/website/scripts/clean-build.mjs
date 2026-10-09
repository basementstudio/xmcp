import { rm } from "node:fs/promises";

// Restored Next.js output has served stale styles after successful deployments.
// Rebuild website assets from source; package-manager caches remain reusable.
await rm(new URL("../.next", import.meta.url), {
  recursive: true,
  force: true,
});
