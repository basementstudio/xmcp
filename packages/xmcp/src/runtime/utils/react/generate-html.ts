import {
  INITIALIZE_METHOD,
  INITIALIZED_METHOD,
  MCP_APPS_PROTOCOL_VERSION,
} from "../mcp-app-protocol";

export function generateUIHTML(
  componentCode: string,
  css: string | undefined
): string {
  const renderScript = `
  <script type="module">
    const componentSource = ${JSON.stringify(componentCode)};
    const blobUrl = URL.createObjectURL(
      new Blob([componentSource], { type: "text/javascript" })
    );

    await import(blobUrl);

    let nextId = 1;

    window.parent.postMessage({
      jsonrpc: "2.0",
      id: nextId++,
      method: ${JSON.stringify(INITIALIZE_METHOD)},
      params: {
        appCapabilities: {
          availableDisplayModes: ["inline", "fullscreen", "pip"]
        },
        appInfo: { name: "xmcp React Widget", version: "1.0.0" },
        protocolVersion: ${JSON.stringify(MCP_APPS_PROTOCOL_VERSION)}
      }
    }, "*");

    window.addEventListener("message", (event) => {
      const data = event.data;

      if (event.source !== window.parent) return;

      // handshake ack
      if (data?.result?.hostContext && data?.id === 1) {
        window.parent.postMessage({
          jsonrpc: "2.0",
          method: ${JSON.stringify(INITIALIZED_METHOD)},
          params: {}
        }, "*");
      }
    });

    requestAnimationFrame(() => {
      URL.revokeObjectURL(blobUrl);
    });
  </script>`;

  const styleTag = css ? `<style>${css}</style>` : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${styleTag}
</head>
<body>
  <div id="root"></div>
  ${renderScript}
</body>
</html>`;
}
