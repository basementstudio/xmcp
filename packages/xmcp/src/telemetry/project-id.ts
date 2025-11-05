import { readFileSync } from "fs";
import path from "path";
import { createHash } from "crypto";

/**
 * Get raw project ID from package.json
 * This matches Next.js's approach to identifying projects
 */
export async function getRawProjectId(): Promise<string> {
  try {
    // Try to read package.json from current working directory
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    // Use package name and version as stable identifier
    // This gives us a stable ID even across different machines
    const identifier = `${packageJson.name || "unknown"}@${
      packageJson.version || "0.0.0"
    }`;

    return identifier;
  } catch (error) {
    // Fallback to directory path if package.json not found
    return process.cwd();
  }
}

/**
 * Get a hashed project ID (for privacy)
 * This will be salted by the storage layer
 */
export async function getProjectId(
  oneWayHash: (payload: string) => string
): Promise<string> {
  const rawId = await getRawProjectId();
  return oneWayHash(rawId);
}
