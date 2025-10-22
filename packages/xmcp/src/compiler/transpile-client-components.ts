import fs from "fs";
import path from "path";

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
    const absolutePath = path.resolve(process.cwd(), componentPath);

    const sourceCode = fs.readFileSync(absolutePath, "utf-8");

    const dynamicRequire = eval("require");
    const { transformSync } = dynamicRequire("@swc/core");

    const result = transformSync(sourceCode, {
      filename: componentPath,
      jsc: {
        parser: {
          syntax: "typescript",
          tsx: true,
        },
        transform: {
          react: {
            runtime: "automatic",
            importSource: "react",
          },
        },
        target: "es2015",
      },
      module: {
        type: "es6",
      },
    });

    const bundleCode = result.code.trim();

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${toolName}.bundle.js`);
    fs.writeFileSync(outputPath, bundleCode, "utf-8");

    console.log(`✓ Built client bundle: ${outputPath}`);
  } catch (error) {
    throw new Error(
      `Failed to transpile client component "${toolName}" at ${componentPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
