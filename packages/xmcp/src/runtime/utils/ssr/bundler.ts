/**
 * SSR Bundler for React components
 *
 * This module handles:
 * 1. Server-side rendering of React components to HTML
 * 2. Generating HTML with pre-bundled client code
 */

import { renderToString } from "react-dom/server";
import { createElement } from "react";

/**
 * Render a React component to an HTML string using SSR
 */
export async function renderReactComponent(
  Component: any,
  props: any = {}
): Promise<string> {
  try {
    const element = createElement(Component, props);
    const html = renderToString(element);
    return html;
  } catch (error) {
    throw new Error(
      `Failed to render React component: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate full HTML with server-rendered content and hydration
 */
export function generateHTMLWithSSR(
  serverRenderedHTML: string,
  componentCode?: string
): string {
  const hydrationScript = componentCode
    ? `
  <!-- React from CDN -->
  <script crossorigin src="https://unpkg.com/react@19.0.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@19.0.0/umd/react-dom.production.min.js"></script>

  <!-- Component and hydration code -->
  <script type="module">
    ${componentCode}

    // Hydrate the component
    const root = document.getElementById('root');
    if (root && window.Component) {
      const { hydrateRoot } = window.ReactDOM;
      const { createElement } = window.React;
      hydrateRoot(root, createElement(window.Component));
    }
  </script>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root">${serverRenderedHTML}</div>${hydrationScript}
</body>
</html>`;
}
