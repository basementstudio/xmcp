import fs from "fs";
import path from "path";
import { rspack } from "@rspack/core";
import type { RspackOptions } from "@rspack/core";

interface BuildRequest {
  componentPath: string;
  toolName: string;
  outputDir: string;
}

interface ResolvedBuildRequest extends BuildRequest {
  absoluteComponentPath: string;
  absoluteOutputDir: string;
  outputPath: string;
}

export class ClientComponentCompiler {
  private buildQueue: Promise<void> = Promise.resolve();

  async compile(request: BuildRequest): Promise<string> {
    const resolved = this.resolveRequest(request);

    const nextBuild = this.buildQueue.then(() => this.runBuild(resolved));
    this.buildQueue = nextBuild.catch(() => Promise.resolve());

    await nextBuild;
    return resolved.outputPath;
  }

  private resolveRequest(request: BuildRequest): ResolvedBuildRequest {
    const absoluteComponentPath = path.resolve(
      process.cwd(),
      request.componentPath
    );
    const absoluteOutputDir = path.resolve(process.cwd(), request.outputDir);

    if (!fs.existsSync(absoluteOutputDir)) {
      fs.mkdirSync(absoluteOutputDir, { recursive: true });
    }

    return {
      ...request,
      absoluteComponentPath,
      absoluteOutputDir,
      outputPath: path.join(absoluteOutputDir, `${request.toolName}.bundle.js`),
    };
  }

  private createConfig(resolved: ResolvedBuildRequest): RspackOptions {
    return {
      mode: "production",
      entry: resolved.absoluteComponentPath,
      target: "web",
      experiments: {
        outputModule: true,
      },
      output: {
        path: resolved.absoluteOutputDir,
        filename: `${resolved.toolName}.bundle.js`,
        module: true,
        library: {
          type: "module",
        },
      },
      externals: {
        react: "react",
        "react/jsx-runtime": "react/jsx-runtime",
        "react/jsx-dev-runtime": "react/jsx-dev-runtime",
        "react-dom/client": "react-dom/client",
      },
      externalsType: "module",
      resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
      },
      resolveLoader: {
        modules: [
          "node_modules",
          path.resolve(__dirname, "../node_modules"),
          path.resolve(__dirname, "../.."),
        ],
      },
      module: {
        rules: [
          {
            test: /\.(ts|tsx|js|jsx)$/,
            exclude: /node_modules/,
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
                  target: "es2017",
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
      cache: true,
    };
  }

  private runBuild(resolved: ResolvedBuildRequest): Promise<void> {
    const compiler = rspack(this.createConfig(resolved));

    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        const finalize = (maybeError?: Error) => {
          compiler.close((closeErr) => {
            if (maybeError || closeErr) {
              reject(maybeError ?? closeErr);
              return;
            }
            resolve();
          });
        };

        if (err) {
          finalize(err);
          return;
        }

        if (stats?.hasErrors()) {
          finalize(
            new Error(
              stats.toString({
                colors: false,
                errors: true,
              })
            )
          );
          return;
        }

        console.log(`✓ Built client bundle: ${resolved.outputPath}`);
        finalize();
      });
    });
  }
}

export const clientComponentCompiler = new ClientComponentCompiler();
