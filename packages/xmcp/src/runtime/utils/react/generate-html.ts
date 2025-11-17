/**
 * Generate full HTML (CSR)
 */
export function generateHTML(componentCode: string): string {
  // we need to replace bare imports with esm CDN imports
  const esmComponentCode = componentCode
    .replace(
      /(from\s*)["']react\/jsx-runtime(?:\.m?js)?["']/g,
      '$1"https://esm.sh/react@19/jsx-runtime"'
    )
    .replace(
      /(from\s*)["']react\/jsx-dev-runtime(?:\.m?js)?["']/g,
      '$1"https://esm.sh/react@19/jsx-dev-runtime"'
    )
    .replace(
      /(from\s*)["']react(?:\.m?js)?["']/g,
      '$1"https://esm.sh/react@19"'
    )
    .replace(
      /["']react\/jsx-runtime(?:\.m?js)?["']/g,
      '"https://esm.sh/react@19/jsx-runtime"'
    )
    .replace(
      /["']react\/jsx-dev-runtime(?:\.m?js)?["']/g,
      '"https://esm.sh/react@19/jsx-dev-runtime"'
    )
    .replace(/["']react(?:\.m?js)?["']/g, '"https://esm.sh/react@19"');

  const renderScript = `
  <!-- Component rendering using ESM (React 19) -->
  <script type="module">
    import { createRoot } from "https://esm.sh/react-dom@19/client";
    import { createElement } from "https://esm.sh/react@19";

    const componentSource = ${JSON.stringify(esmComponentCode)};
    const blobUrl = URL.createObjectURL(new Blob([componentSource], { type: "text/javascript" }));

    try {
      const mod = await import(blobUrl);
      const Component = mod.default ?? mod.Component ?? mod.ReactComponent ?? Object.values(mod)[0];

      if (!Component) {
        throw new Error("React component export not found");
      }

      const root = document.getElementById('root');
      if (root) {
        createRoot(root).render(createElement(Component));
      }
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  </script>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root"></div>
  ${renderScript}
</body>
</html>`;
}
