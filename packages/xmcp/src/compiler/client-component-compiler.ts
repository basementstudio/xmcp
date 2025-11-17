import fs from "fs";
import path from "path";
import { rspack } from "@rspack/core";
import type { Compiler, RspackOptions } from "@rspack/core";

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
  private compiler: Compiler | null = null;
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

  private ensureCompiler(resolved: ResolvedBuildRequest): Compiler {
    if (!this.compiler) {
      const config = this.createConfig(resolved);
      this.compiler = rspack(config);
    }
    return this.compiler;
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

  private applyBuildOverrides(
    compiler: Compiler,
    resolved: ResolvedBuildRequest
  ) {
    const options = compiler.options;

    (options as RspackOptions).entry = resolved.absoluteComponentPath;
    const output = options.output;

    if (!output) {
      throw new Error(
        "Client component compiler output options not initialized"
      );
    }

    output.path = resolved.absoluteOutputDir;
    output.filename = `${resolved.toolName}.bundle.js`;
    output.module = true;
    output.library = {
      type: "module",
    };
  }

  private runBuild(resolved: ResolvedBuildRequest): Promise<void> {
    const compiler = this.ensureCompiler(resolved);
    this.applyBuildOverrides(compiler, resolved);

    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) {
          reject(err);
          return;
        }

        if (stats?.hasErrors()) {
          reject(
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
        resolve();
      });
    });
  }
}

export const clientComponentCompiler = new ClientComponentCompiler();
