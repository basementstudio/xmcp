/**
 * Normalize a path and generate a base name for tool identification.
 */
function normalizeAndGetBaseName(path: string): {
  normalizedPath: string;
  baseName: string;
} {
  // Normalize path (handle both / and \ separators)
  const normalizedPath = path.replace(/\\/g, "/");

  if (!normalizedPath) {
    throw new Error("Invalid tool path: path is empty");
  }

  // Remove file extension
  const withoutExtension = normalizedPath.replace(/\.[^/.]+$/, "");

  // Replace / with _
  const baseName = withoutExtension.replace(/\//g, "_");

  return { normalizedPath, baseName };
}

/**
 * Web-compatible pathToToolName using djb2 hash.
 * Used for Cloudflare Workers where node:crypto is not available.
 */
export function pathToToolNameDjb2(path: string): string {
  const { normalizedPath, baseName } = normalizeAndGetBaseName(path);

  // djb2 hash algorithm - deterministic and works everywhere
  let hash = 5381;
  for (let i = 0; i < normalizedPath.length; i++) {
    hash = (Math.imul(hash, 33) + normalizedPath.charCodeAt(i)) >>> 0;
  }
  const hashStr = hash.toString(16).slice(0, 6).padStart(6, "0");

  return `${baseName}_${hashStr}`;
}

/**
 * Node.js pathToToolName using MD5 hash.
 * Used for backwards compatibility with existing Node.js deployments.
 *
 * Note: For Cloudflare builds, crypto is resolved to an empty module
 * via bundler fallback config. This is safe because pathToToolNameDjb2
 * is used instead in Cloudflare Workers.
 */
export function pathToToolNameMd5(path: string): string {
  const { normalizedPath, baseName } = normalizeAndGetBaseName(path);

  // Use 'crypto' (not 'node:crypto') for bundler compatibility
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto");
  const hash = crypto
    .createHash("md5")
    .update(normalizedPath)
    .digest("hex")
    .slice(0, 6);

  return `${baseName}_${hash}`;
}

/**
 * Default export for backwards compatibility.
 * In Cloudflare Workers, use pathToToolNameDjb2 directly.
 * In Node.js, this uses MD5 for backwards compatibility.
 */
export const pathToToolName = pathToToolNameMd5;
