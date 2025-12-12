function transformToESM(componentCode: string): string {
  return componentCode
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
      /import\s*\(\s*["']react\/jsx-runtime(?:\.m?js)?["']\s*\)/g,
      'import("https://esm.sh/react@19/jsx-runtime")'
    )
    .replace(
      /import\s*\(\s*["']react\/jsx-dev-runtime(?:\.m?js)?["']\s*\)/g,
      'import("https://esm.sh/react@19/jsx-dev-runtime")'
    )
    .replace(
      /import\s*\(\s*["']react(?:\.m?js)?["']\s*\)/g,
      'import("https://esm.sh/react@19")'
    );
}

export function generateOpenAIHTML(componentCode: string): string {
  const esmComponentCode = transformToESM(componentCode);

  const renderScript = `
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
      const props = window.openai?.toolInput || {};
      if (root) {
        createRoot(root).render(createElement(Component, props));
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

export function generateUIHTML(componentCode: string): string {
  const esmComponentCode = transformToESM(componentCode);

  const renderScript = `
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

      let nextId = 1;

      window.parent.postMessage({
        jsonrpc: "2.0",
        id: nextId++,
        method: "ui/initialize",
        params: {
          capabilities: {},
          clientInfo: { name: "xmcp React Widget", version: "1.0.0" },
          protocolVersion: "2025-06-18"
        }
      }, '*');

      window.addEventListener('message', (event) => {
        const data = event.data;
        if (data?.result?.hostContext && data?.id === 1) {
          window.parent.postMessage({
            jsonrpc: "2.0",
            method: "ui/notifications/initialized",
            params: {}
          }, '*');
        }
        if (data?.method === 'ui/notifications/tool-input') {
          const props = data.params?.arguments || {};
          createRoot(root).render(createElement(Component, props));
        }
      });
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
