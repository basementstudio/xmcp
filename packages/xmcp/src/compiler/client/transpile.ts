import { clientComponentCompiler } from "./component-compiler";

/**
 * Build a client-side bundle for a React component
 * Writes the bundle to disk at outputDir/${toolName}.bundle.js
 */
export async function transpileClientComponent(
  componentPath: string,
  toolName: string,
  outputDir: string
): Promise<void> {
  try {
    await clientComponentCompiler.compile({
      componentPath,
      toolName,
      outputDir,
    });
  } catch (error) {
    throw new Error(
      `Failed to transpile client component "${toolName}" at ${componentPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
