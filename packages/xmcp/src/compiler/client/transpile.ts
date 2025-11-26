import { clientComponentCompiler } from "./component-compiler";

/**
 * Build a client-side bundle for a React component
 * Writes the bundle to disk at outputDir/${toolName}.bundle.js
 */
export async function transpileClientComponent(
  entries: Map<string, string>,
  outputDir: string
): Promise<void> {
  try {
    await clientComponentCompiler.compile({
      entries,
      outputDir,
    });
  } catch (error) {
    throw new Error(
      `Failed to transpile client component: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
