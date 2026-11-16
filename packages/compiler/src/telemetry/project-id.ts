import { readFileSync } from "fs";
import path from "path";
import { createHash } from "crypto";

/**
 * Get raw project ID from package.json
 */
export async function getRawProjectId(): Promise<string> {
  try {
    // Try to read package.json from current working directory
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    return packageJson.name || process.cwd();
  } catch (error) {
    // Fallback to directory path if package.json not found
    return process.cwd();
  }
}

/**
 * Get a hashed project ID
 */
export async function getProjectId(
  oneWayHash: (payload: string) => string
): Promise<string> {
  const rawId = await getRawProjectId();
  return oneWayHash(rawId);
}
