import path from "path";
import { rspack } from "@rspack/core";
import type { RspackOptions } from "@rspack/core";
import { findGlobalsCss, hasPostCSSConfig } from "../utils/config-detection";

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

  private createVirtualModules(absoluteEntries: Record<string, string>) {
    const virtualModules: Record<string, string> = {};
    const virtualEntries: Record<string, string> = {};

    for (const [name, realEntry] of Object.entries(absoluteEntries)) {
      const virtualPath = this.getVirtualPath(name);
      virtualEntries[name] = virtualPath;
      virtualModules[virtualPath] = this.createEntryModule(realEntry);
    }

    return { virtualModules, virtualEntries };
  }

  private getVirtualPath(name: string): string {
    return path.posix.join(".", "__virtual__", `${name}.entry.tsx`);
  }

  private createEntryModule(componentPath: string): string {
    const globalsCssPath = findGlobalsCss();
    const globalsCssImport = globalsCssPath
      ? `import ${JSON.stringify(globalsCssPath)};`
      : "";

    return `
  import React from "react";
  import { createRoot } from "react-dom/client";
  ${globalsCssImport}
  import Component from ${JSON.stringify(componentPath)};

  const el = document.getElementById("root");
  if (!el) {
    throw new Error("Root element not found");
  }

  const root = createRoot(el);

  function render(props) {
    root.render(React.createElement(Component, props));
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent && event.source !== null) return;

    if (event.data?.method === "ui/notifications/tool-input") {
      render(event.data.params?.arguments ?? {});
    }
  });
  `;
  }

  private createConfig(config: ResolvedBuildRequest): RspackOptions {
    const { virtualModules, virtualEntries } = this.createVirtualModules(
      config.absoluteEntries
    );

    return {
      mode: "production",
      entry: virtualEntries,
      target: "web",
      experiments: {
        outputModule: true,
        css: true,
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
      externalsType: "module",
      resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
        preferRelative: true,
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
          {
            test: /\.css$/,
            use: hasPostCSSConfig() ? ["postcss-loader"] : [],
            type: "css/auto",
          },
          {
            test: /\.less$/,
            type: "css/auto",
            use: ["less-loader"],
          },
        ],
        parser: {
          "css/auto": {
            namedExports: false,
          },
        },
      },
      plugins: [new rspack.experiments.VirtualModulesPlugin(virtualModules)],
      optimization: {
        minimize: true,
        usedExports: true,
        sideEffects: true,
        concatenateModules: true,
        moduleIds: "deterministic",
      },
      cache: true,
    };
  }
}

export const clientComponentCompiler = new ClientComponentCompiler();
