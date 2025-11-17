import fs from "fs";
import path from "path";
import { rspack, RspackOptions } from "@rspack/core";

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

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${toolName}.bundle.js`);

    const rspackConfig: RspackOptions = {
      mode: "production",
      entry: absolutePath,
      target: "web",
      output: {
        path: outputDir,
        filename: `${toolName}.bundle.js`,
      },
      resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
      },
      resolveLoader: {
        modules: [
          "node_modules",
          path.resolve(__dirname, "../node_modules"), // for monorepo/npm
          path.resolve(__dirname, "../.."), // for pnpm
        ],
      },
      module: {
        rules: [
          {
            test: /\.(ts|tsx)$/,
            use: {
              loader: "builtin:swc-loader",
              options: {
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
              },
            },
          },
        ],
      },
      optimization: {
        minimize: false,
      },
    };

    return new Promise((resolve, reject) => {
      const compiler = rspack(rspackConfig);

      if (!compiler) {
        reject(
          new Error(
            `Failed to create rspack compiler for "${toolName}" at ${componentPath}`
          )
        );
        return;
      }

      compiler.run((err, stats) => {
        if (err) {
          reject(
            new Error(
              `Failed to transpile client component "${toolName}" at ${componentPath}: ${err.message}`
            )
          );
          return;
        }

        if (stats?.hasErrors()) {
          reject(
            new Error(
              `Failed to transpile client component "${toolName}" at ${componentPath}: ${stats.toString({ colors: false, errors: true })}`
            )
          );
          return;
        }

        console.log(`✓ Built client bundle: ${outputPath}`);
        resolve();
      });
    });
  } catch (error) {
    throw new Error(
      `Failed to transpile client component "${toolName}" at ${componentPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
