/**
 * Build client-side bundles for React components
 * This runs at BUILD TIME to create hydration bundles
 */

import fs from "fs";
import path from "path";

/**
 * Build a client-side bundle for a React component
 * Writes the bundle to disk at outputDir/${toolName}.bundle.js
 *
 * This uses the same transpilation approach as runtime but saves to disk
 * for faster loading at runtime.
 */
export async function transpileClientComponent(
  componentPath: string,
  toolName: string,
  outputDir: string
): Promise<void> {
  const absolutePath = path.resolve(process.cwd(), componentPath);

  const sourceCode = fs.readFileSync(absolutePath, "utf-8");

  const { transformSync } = require("@swc/core");

  const result = transformSync(sourceCode, {
    filename: componentPath,
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: true,
      },
      transform: {
        react: {
          runtime: "classic",
          pragma: "React.createElement",
        },
      },
      target: "es2015",
    },
    module: {
      type: "es6",
    },
  });

  const bundleCode = `
(function() {
  const React = window.React;
  const { useState, useEffect, useCallback, useMemo, useRef } = React;

  ${result.code}

  // Export default as window.Component
  if (typeof exports !== 'undefined' && exports.default) {
    window.Component = exports.default;
  }
})();
  `.trim();

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${toolName}.bundle.js`);
  fs.writeFileSync(outputPath, bundleCode, "utf-8");

  console.log(`✓ Built client bundle: ${outputPath}`);
}
