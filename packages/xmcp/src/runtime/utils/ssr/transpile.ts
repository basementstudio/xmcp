/**
 * Transpile React component for client-side hydration
 */

import fs from "fs";
import path from "path";

/**
 * Read and transpile a .tsx component file for browser
 * Returns ES module code that exports the component
 */
export function transpileComponentForClient(componentPath: string): string {
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

  return `
    (function() {
      const React = window.React;
      const { useState, useEffect, useCallback, useMemo, useRef } = React;

      ${result.code}

      // Export default as window.Component
      if (typeof exports !== 'undefined' && exports.default) {
        window.Component = exports.default;
      }
    })();
  `;
}
