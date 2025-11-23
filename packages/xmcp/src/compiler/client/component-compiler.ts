import fs from "fs";
import path from "path";
import { rspack } from "@rspack/core";
import type { RspackOptions } from "@rspack/core";

interface CompileOptions {
  entries: Map<string, string>;
  outputDir: string;
}

interface ResolvedBuildRequest {
  absoluteEntries: { [k: string]: string };
  absoluteOutputDir: string;
}

export class ClientComponentCompiler {
  private buildQueue: Promise<void> = Promise.resolve();

  async compile(request: CompileOptions): Promise<string> {
    const resolved = this.resolveRequest(request);

    const nextBuild = this.buildQueue.then(() =>
      this.runBuild(resolved, request.outputDir)
    );
    this.buildQueue = nextBuild.catch(() => Promise.resolve());

    await nextBuild;
    return request.outputDir;
  }

  private runBuild(
    resolved: ResolvedBuildRequest,
    outputDir: string
  ): Promise<void> {
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

        console.log(`✓ Built client bundle: ${outputDir}`);
        finalize();
      });
    });
  }

  private resolveRequest(request: CompileOptions): ResolvedBuildRequest {
    const absoluteEntries = Object.fromEntries(
      Array.from(request.entries, ([key, value]) => [
        key,
        path.resolve(process.cwd(), value),
      ])
    );

    const absoluteOutputDir = path.resolve(process.cwd(), request.outputDir);

    return {
      absoluteEntries,
      absoluteOutputDir,
    };
  }

  private createConfig(config: ResolvedBuildRequest): RspackOptions {
    return {
      mode: "production",
      entry: config.absoluteEntries,
      target: "web",
      experiments: {
        outputModule: true,
      },
      output: {
        path: config.absoluteOutputDir,
        filename: "[name].bundle.js",
        module: true,
        library: {
          type: "module",
        },
        clean: true,
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
}

export const clientComponentCompiler = new ClientComponentCompiler();
