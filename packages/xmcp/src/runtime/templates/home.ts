import { CLIENT_ICONS } from "@xmcp/icons";

const FALLBACK_DESCRIPTION = "This MCP server was bootstrapped with xmcp.";

const styles = String.raw`
  :root {
    color-scheme: dark;
    --brand-white: #f7f7f7;
    --brand-neutral-50: #dbdbdb;
    --brand-neutral-100: #a8a8a8;
    --brand-neutral-200: #757575;
    --brand-neutral-300: #595959;
    --brand-neutral-400: #424242;
    --brand-neutral-500: #262626;
    --brand-neutral-600: #171717;
    --brand-black: #000000;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background: #050505;
    color: var(--brand-white);
    font-family: "Geist Sans", "Inter", "SF Pro Display", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 20px;
  }

  .section {
    grid-column: 1 / -1;
    padding: 2rem 0;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 20px;
  }

  .section-content {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (min-width: 1024px) {
    .section-content {
      grid-column: 2 / span 9;
    }
  }

  .section-header {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 1rem;
    width: 100%;
  }

  .display {
    grid-column: span 12;
    font-size: clamp(2rem, 3.5vw, 3rem);
    line-height: 1.1;
    letter-spacing: -0.05em;
    font-weight: 500;
    margin: 0;
  }

  .heading-2 {
    grid-column: span 12;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    line-height: 1.2;
    letter-spacing: -0.03em;
    font-weight: 500;
    margin: 0;
  }

  .text-gradient {
    background: linear-gradient(
      270deg,
      rgba(247, 247, 247, 0.8) 0%,
      #f7f7f7 50%,
      rgba(247, 247, 247, 0.8) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .lead {
    grid-column: span 12;
    font-size: 1.125rem;
    color: var(--brand-white);
    max-width: 650px;
    margin: 0;
    line-height: 1.6;
  }

  .body-text {
    grid-column: span 12;
    color: var(--brand-neutral-100);
    font-size: 1rem;
    line-height: 1.7;
    margin: 0;
    max-width: 650px;
  }

  .connection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
    width: 100%;
    margin-top: 1rem;
  }

  .connection-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: 60px;
    border: 1px solid var(--brand-neutral-600);
    background: rgba(5, 5, 5, 0.85);
    padding: 1.25rem 1.5rem;
    border-radius: 2px;
    color: var(--brand-white);
    font-size: 1rem;
    font-weight: 500;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .connection-card:hover,
  .connection-card:focus-visible {
    border-color: var(--brand-neutral-400);
    background: rgba(15, 15, 15, 0.85);
  }

  .connection-card:focus-visible {
    outline: 2px solid var(--brand-white);
    outline-offset: 3px;
  }

  .icon-badge {
    width: 48px;
    height: 48px;
    border: 1px dashed var(--brand-neutral-400);
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--brand-neutral-600);
    flex-shrink: 0;
  }

  .icon-badge svg {
    width: 24px;
    height: 24px;
    color: var(--brand-white);
  }

  .background-icon {
    position: absolute;
    inset: 0;
    pointer-events: none;
    color: var(--brand-neutral-600);
  }

  .background-icon svg {
    position: absolute;
    width: 120px;
    height: auto;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: currentColor;
  }

  .card-label {
    position: relative;
    z-index: 2;
    color: var(--brand-white);
  }

  .code-block {
    position: relative;
    width: 100%;
    margin-top: 1.25rem;
  }

  .code-block pre {
    margin: 0;
    border-radius: 0;
    border: 1px solid var(--brand-neutral-500);
    background: rgba(8, 8, 8, 0.9);
    padding: 1.5rem;
    overflow-x: auto;
  }

  .code-block code {
    font-family: "Geist Mono", "SFMono-Regular", "Consolas", monospace;
    color: var(--brand-white);
    font-size: 0.85rem;
    line-height: 1.6;
    display: block;
    white-space: pre;
  }

  .copy-snippet-btn {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: none;
    background: rgba(0, 0, 0, 0.8);
    color: var(--brand-neutral-50);
    border-radius: 0;
    cursor: pointer;
    transition: color 0.2s ease, background 0.2s ease;
    z-index: 10;
  }

  .copy-snippet-btn:hover,
  .copy-snippet-btn:focus-visible {
    color: var(--brand-white);
    background: rgba(0, 0, 0, 0.95);
    outline: none;
  }

  .copy-snippet-btn svg {
    width: 16px;
    height: 16px;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .copy-snippet-btn svg.hidden {
    opacity: 0;
    transform: scale(0.8);
  }

  .copy-snippet-btn svg.visible {
    opacity: 1;
    transform: scale(1);
  }

  .card-inner {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: rgba(8, 8, 8, 0.95);
    border: 1px solid var(--brand-neutral-500);
    border-radius: 0;
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
    color: var(--brand-white);
    opacity: 0;
    transform: translateY(12px) scale(0.98);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
  }

  .toast.show {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
`;

const createClientScript = (
  endpoint: string,
  serverName: string | undefined,
  serverDescription: string | undefined
) => `
  (() => {
    const templateConfig = ${JSON.stringify({
      endpoint,
      serverName: serverName ?? null,
      serverDescription: serverDescription ?? null,
    })};

    const elements = {
      name: document.getElementById("server-name"),
      description: document.getElementById("server-description"),
      grid: document.getElementById("connection-grid"),
      remoteSnippet: document.getElementById("remote-snippet"),
      copyRemoteButton: document.getElementById("copy-remote-snippet"),
      copyIcon: document.getElementById("copy-icon"),
      checkIcon: document.getElementById("check-icon"),
      toast: document.getElementById("toast"),
    };

    const resolvedName =
      (templateConfig.serverName && templateConfig.serverName.trim()) || "xmcp server";
    const resolvedDescription =
      (templateConfig.serverDescription && templateConfig.serverDescription.trim()) ||
      "${FALLBACK_DESCRIPTION}";
    const endpointPath =
      (templateConfig.endpoint && templateConfig.endpoint.trim()) || "/";
    const normalizedEndpoint = endpointPath.startsWith("/")
      ? endpointPath
      : \`/\${endpointPath}\`;
    const origin = window.location.origin.replace(/\\/$/, "");
    const serverUrl = origin + normalizedEndpoint;
    const identifier =
      resolvedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "xmcp-server";

    if (elements.name) {
      elements.name.textContent = resolvedName;
    }

    if (elements.description) {
      elements.description.textContent = resolvedDescription;
    }

    const icons = ${JSON.stringify(CLIENT_ICONS)};

    const connectionOptions = [
      {
        label: "Cursor",
        type: "copy",
        snippet: \`{
    "\${identifier}": {
      "url": "\${serverUrl}"
    }
  }\`,
        description: "Copy Cursor connection config",
        icon: "cursor",
      },
      {
        label: "Claude Code",
        type: "copy",
        snippet: \`claude mcp add --transport http "\${identifier}" \\\\\\n    "\${serverUrl}"\`,
        description: "Copy CLI snippet for Claude Code",
        icon: "claude",
      },
      {
        label: "Claude Desktop",
        type: "copy",
        snippet: \`{
    "\${identifier}": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "\${serverUrl}"]
    }
  }\`,
        description: "Copy Claude Desktop setup command",
        icon: "claude",
      },
      {
        label: "Windsurf",
        type: "copy",
        snippet: \`"\${identifier}": {
  "command": "npx",
  "args": [
    "mcp-remote",
    "\${serverUrl}"
  ]
}\`,
        description: "Copy Windsurf attach command",
        icon: "windsurf",
      },
      {
        label: "Gemini CLI",
        type: "copy",
        snippet: \`gemini mcp add --transport http "\${identifier}" "\${serverUrl}"\`,
        description: "Copy Gemini CLI link command",
        icon: "gemini",
      },
      {
        label: "Codex",
        type: "copy",
        snippet: \`[mcp_servers.\${identifier}]
command = "npx"
args = ["-y", "mcp-remote", "\${serverUrl}"]\`,
        description: "Copy Codex connect command",
        icon: "codex",
      },
    ];

    if (elements.remoteSnippet) {
      const remoteSnippet = JSON.stringify(
        {
          command: "npx",
          args: ["mcp-remote", serverUrl],
        },
        null,
        2
      );
      elements.remoteSnippet.textContent = remoteSnippet;
    }

    if (elements.copyRemoteButton) {
      elements.copyRemoteButton.addEventListener("click", () => {
        const snippet = elements.remoteSnippet?.textContent || "";
        copyText(snippet)
          .then((success) => {
            if (success) {
              // Animate icon change
              if (elements.copyIcon && elements.checkIcon) {
                elements.copyIcon.classList.remove("visible");
                elements.copyIcon.classList.add("hidden");
                elements.checkIcon.classList.remove("hidden");
                elements.checkIcon.classList.add("visible");

                // Reset after 2 seconds
                setTimeout(() => {
                  elements.copyIcon?.classList.remove("hidden");
                  elements.copyIcon?.classList.add("visible");
                  elements.checkIcon?.classList.remove("visible");
                  elements.checkIcon?.classList.add("hidden");
                }, 2000);
              }
            } else {
              showToast("Unable to copy. Please copy manually.");
            }
          })
          .catch(() => {
            showToast("Unable to copy. Please copy manually.");
          });
      });
    }

    if (elements.grid) {
      elements.grid.innerHTML = "";
      connectionOptions.forEach((option) => {
        const isCopy = option.type === "copy";
        const card = document.createElement(isCopy ? "button" : "a");
        card.className = "connection-card";
        if (isCopy) {
          card.type = "button";
        } else {
          card.href = option.href;
          card.target = "_blank";
          card.rel = "noreferrer";
        }

        const inner = document.createElement("span");
        inner.className = "card-inner";

        const iconBadge = document.createElement("span");
        iconBadge.className = "icon-badge";
        iconBadge.innerHTML = icons[option.icon] || "";

        const label = document.createElement("span");
        label.className = "card-label";
        label.textContent = option.label;

        inner.appendChild(iconBadge);
        inner.appendChild(label);
        card.appendChild(inner);

        const backgroundIcon = document.createElement("span");
        backgroundIcon.className = "background-icon";
        backgroundIcon.innerHTML = icons[option.icon] || "";
        card.appendChild(backgroundIcon);

        if (isCopy) {
          card.addEventListener("click", () => {
            copyText(option.snippet)
              .then((success) => {
                showToast(
                  success
                    ? \`\${option.label} connection method copied to clipboard.\`
                    : "Unable to copy. Please copy manually."
                );
              })
              .catch(() => {
                showToast("Unable to copy. Please copy manually.");
              });
          });
        }

        elements.grid?.appendChild(card);
      });
    }

    function showToast(message) {
      if (!elements.toast) return;
      elements.toast.textContent = message;
      elements.toast.classList.add("show");
      setTimeout(() => {
        elements.toast && elements.toast.classList.remove("show");
      }, 2400);
    }

    async function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (error) {
          return fallbackCopy(text);
        }
      }
      return fallbackCopy(text);
    }

    function fallbackCopy(text) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        return successful;
      } catch {
        return false;
      }
    }
  })();
`;

const homeTemplate = (
  endpoint: string,
  serverName: string | undefined,
  serverDescription: string | undefined
) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${serverName || "xmcp server"}</title>
    <link
      rel="preconnect"
      href="https://fonts.googleapis.com"
    />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Geist+Sans:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <style>
${styles}
    </style>
  </head>
  <body>
    <main class="template-layout">
      <section class="section">
        <div class="section-content">
          <div class="section-header">
            <h2 id="server-name" class="display text-gradient">xmcp server</h2>
            <p id="server-description" class="lead">
              ${serverDescription || FALLBACK_DESCRIPTION}
            </p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-content">
          <div class="section-header">
            <h2 class="heading-2 text-gradient">Connect to a client</h2>
            <p class="body-text">
              Select your preferred way to connect to your MCP server.
            </p>
          </div>
          <div id="connection-grid" class="connection-grid" aria-live="polite"></div>
        </div>
      </section>

      <section class="section">
        <div class="section-content">
          <div class="section-header">
            <h2 class="heading-2 text-gradient">Standard connection</h2>
            <p class="body-text">
              For clients not listed above, you can use the following connection method.
            </p>
          </div>
          <div class="code-block">
            <button
              type="button"
              class="copy-snippet-btn"
              id="copy-remote-snippet"
              aria-label="Copy standard connection method"
            >
              <span class="sr-only">Copy standard connection method</span>
              <svg
                id="copy-icon"
                class="visible"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect
                  x="5.25"
                  y="3"
                  width="7.5"
                  height="9.5"
                  rx="1"
                  stroke="currentColor"
                  stroke-width="1.25"
                />
                <path
                  d="M3.25 10.75V2.75H9.75"
                  stroke="currentColor"
                  stroke-width="1.25"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                id="check-icon"
                class="hidden"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style="position: absolute;"
              >
                <path
                  d="M13.5 4L6 11.5L2.5 8"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
        </svg>
            </button>
            <pre><code id="remote-snippet"></code></pre>
          </div>
    </div>
      </section>
    </main>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <script>
${createClientScript(endpoint, serverName, serverDescription)}
    </script>
  </body>
</html>
`;

export default homeTemplate;
