/**
 * Build client-side bundles for React components
 * This runs at BUILD TIME to create hydration bundles
 */

import webpack from "webpack";
import { createFsFromVolume, Volume } from "memfs";
import path from "path";

/**
 * Build a client-side bundle for a React component
 * Returns the bundled code as a string
 */
export async function buildClientBundle(
  componentPath: string,
  toolName: string
): Promise<string> {
  const memoryFs = createFsFromVolume(new Volume());

  // Create entry point that hydrates the component
  const entryCode = `
import { hydrateRoot } from 'react-dom/client';
import { createElement } from 'react';
import Component from '${componentPath}';

// Hydrate when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrate);
} else {
  hydrate();
}

function hydrate() {
  const root = document.getElementById('root');
  if (root) {
    hydrateRoot(root, createElement(Component));
  }
}
`;

  const entryPath = "/entry.tsx";
  memoryFs.writeFileSync(entryPath, entryCode);

  const config: webpack.Configuration = {
    mode: "production",
    entry: entryPath,
    target: "web",
    output: {
      path: "/",
      filename: "bundle.js",
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"],
    },
    resolveLoader: {
      modules: [
        "node_modules",
        path.resolve(__dirname, "../../node_modules"),
        path.resolve(__dirname, "../../../node_modules"),
      ],
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: {
            loader: "swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: "automatic",
                  },
                },
                target: "es2015",
              },
            },
          },
          exclude: /node_modules/,
        },
      ],
    },
    optimization: {
      minimize: true,
    },
  };

  return new Promise((resolve, reject) => {
    const compiler = webpack(config);

    if (!compiler) {
      reject(new Error("Failed to create webpack compiler"));
      return;
    }

    compiler.inputFileSystem = memoryFs as any;
    compiler.outputFileSystem = memoryFs as any;

    compiler.run((err, stats) => {
      if (err) {
        reject(err);
        return;
      }

      if (stats?.hasErrors()) {
        reject(new Error(stats.toString({ colors: false, errors: true })));
        return;
      }

      try {
        const bundle = memoryFs.readFileSync("/bundle.js", "utf8") as string;
        resolve(bundle);
      } catch (readError) {
        reject(readError);
      }
    });
  });
}
