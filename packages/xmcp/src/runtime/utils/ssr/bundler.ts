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

  const renderScript = `
  <!-- Component rendering using ESM (React 19) -->
  <script type="module">
    import { createRoot } from "https://esm.sh/react-dom@19/client";
    import { createElement } from "https://esm.sh/react@19";

    ${esmComponentCode}

    const root = document.getElementById('root');
    if (root) {
      createRoot(root).render(createElement(Component));
    }
  </script>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root">${serverRenderedHTML}</div>${renderScript}
</body>
</html>`;
}
