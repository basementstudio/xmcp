import { readdir } from "node:fs/promises";
import type { GetTarget, RegisterConformance } from "../harness/conformance.js";

// Load groups once before test registration. New feature modules need no edits
// here; helpers and test files live outside this directory's top level.
const files = (
  await readdir(new URL("./", import.meta.url), { withFileTypes: true })
)
  .filter(
    (entry) =>
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".d.ts") &&
      entry.name !== "index.ts"
  )
  .map((entry) => entry.name)
  .sort();
const groups: RegisterConformance[] = await Promise.all(
  files.map(async (file) => {
    const group = await import(new URL(file, import.meta.url).href);
    if (typeof group.register !== "function") {
      throw new Error(
        `Conformance group ${file} must export register(getTarget)`
      );
    }
    return group.register;
  })
);

export function register(getTarget: GetTarget, onFailure?: () => void) {
  for (const registerGroup of groups) registerGroup(getTarget, onFailure);
}
