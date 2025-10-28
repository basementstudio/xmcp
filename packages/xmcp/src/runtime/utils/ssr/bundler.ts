/**
 * Generate full HTML with server-rendered content and hydration
 */
export function generateHTMLWithSSR(
  serverRenderedHTML: string,
  componentCode: string
): string {
  // we need to replace bare imports with esm CDN imports
  const esmComponentCode = componentCode
    .replace(
      /from\s+["']react\/jsx-runtime["']/g,
      'from "https://esm.sh/react@19/jsx-runtime"'
    )
    .replace(
      /from\s+["']react\/jsx-dev-runtime["']/g,
      'from "https://esm.sh/react@19/jsx-dev-runtime"'
    )
    .replace(/from\s+["']react["']/g, 'from "https://esm.sh/react@19"')
    .replace(/export\s+default\s+/g, "const Component = ");

  const hydrationScript = `
  <!-- Component and hydration code using ESM (official approach for React 19) -->
  <script type="module">
    import { hydrateRoot } from "https://esm.sh/react-dom@19/client";
    import { createElement } from "https://esm.sh/react@19";

    ${esmComponentCode}

    // Hydrate the component
    const root = document.getElementById('root');
    if (root) {
      hydrateRoot(root, createElement(Component));
    }
  </script>`;

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
