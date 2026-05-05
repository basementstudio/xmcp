const FALLBACK_DESCRIPTION = "This MCP server was bootstrapped with xmcp.";
const TOAST_TIMEOUT_MS = 2400;

const ICONS = {
  tool: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.4 3.2 4.9 5.7l1.8 1.8 2.5-2.5a3.8 3.8 0 0 1 5 4.8l-2.8-2.8-2.4 2.4 2.8 2.8a3.8 3.8 0 0 1-4.8-5L4.5 9.7l5.8 5.8 2.5-2.5a5.2 5.2 0 0 0-7-6.9Z" fill="currentColor"/></svg>',
  resource: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3.5A1.5 1.5 0 0 1 5.5 2h6.2L16 6.3v10.2a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 16.5v-13Zm7 0V7h3.5L11 3.5ZM6.5 10h7v1.4h-7V10Zm0 3h5.5v1.4H6.5V13Z" fill="currentColor"/></svg>',
  template: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15.5v-11Zm2 1v3h10v-3H5Zm0 5v4.5h4v-4.5H5Zm6 0v4.5h4v-4.5h-4Z" fill="currentColor"/></svg>',
  prompt: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3h12a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 16 14h-4.8L7 17v-3H4a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4 3Zm1.5 3.2 2.4 2.3-2.4 2.3 1 1.1 3.6-3.4-3.6-3.4-1 1.1Zm5 4.2h4v-1.5h-4v1.5Z" fill="currentColor"/></svg>',
  health: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2 3.5 4.6v4.8c0 4 2.7 7.5 6.5 8.6 3.8-1.1 6.5-4.6 6.5-8.6V4.6L10 2Zm3.4 6.6-4.1 4.1-2.4-2.4 1-1 1.4 1.4 3.1-3.1 1 1Z" fill="currentColor"/></svg>',
  mcp: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.2 4.2a4.2 4.2 0 0 1 5.9 0l.6.6-1.1 1.1-.6-.6a2.6 2.6 0 0 0-3.7 0L5.2 7.4a2.6 2.6 0 0 0 0 3.7l.6.6-1.1 1.1-.6-.6a4.2 4.2 0 0 1 0-5.9l2.1-2.1Zm2.2 10 .6.6a2.6 2.6 0 0 0 3.7 0l2.1-2.1a2.6 2.6 0 0 0 0-3.7l-.6-.6 1.1-1.1.6.6a4.2 4.2 0 0 1 0 5.9l-2.1 2.1a4.2 4.2 0 0 1-5.9 0l-.6-.6 1.1-1.1Zm-.3-3.4 2.7-2.7 1.1 1.1-2.7 2.7-1.1-1.1Z" fill="currentColor"/></svg>',
  capabilities: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5 12 7l4.8.5-3.6 3.2 1 4.8L10 13.1l-4.2 2.4 1-4.8-3.6-3.2L8 7l2-4.5Z" fill="currentColor"/></svg>',
  completion: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 5A1.5 1.5 0 0 1 5 3.5h10A1.5 1.5 0 0 1 16.5 5v7A1.5 1.5 0 0 1 15 13.5h-3.8L8 16v-2.5H5A1.5 1.5 0 0 1 3.5 12V5Zm3 1.5v1.4h7V6.5h-7Zm0 3v1.4H11V9.5H6.5Z" fill="currentColor"/></svg>',
  logging: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3.5h12v13H4v-13Zm2 2v1.4h8V5.5H6Zm0 3.2v1.4h8V8.7H6Zm0 3.2v1.4h5.6v-1.4H6Z" fill="currentColor"/></svg>',
  task: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 3.5h9A1.5 1.5 0 0 1 16 5v10a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 15V5a1.5 1.5 0 0 1 1.5-1.5Zm1 3v1.4h7V6.5h-7Zm0 3.2v1.4h7V9.7h-7Zm0 3.2v1.4h4.2v-1.4H6.5Z" fill="currentColor"/></svg>',
  experimental: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 2.8h6v1.4h-1v3.1l3.4 5.9A2.6 2.6 0 0 1 13.1 17H6.9a2.6 2.6 0 0 1-2.3-3.8L8 7.3V4.2H7V2.8Zm2.5 5-2 3.5h5l-2-3.5V4.2h-1v3.6Z" fill="currentColor"/></svg>',
  terminal: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4.7 6.2 3.4 3.4L4.7 13l-1-1 2.4-2.4-2.4-2.4 1-1Zm4.4 6.5h6.5v1.5H9.1v-1.5Z" fill="currentColor"/></svg>',
  copy: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h6A1.5 1.5 0 0 1 16 3.5v8A1.5 1.5 0 0 1 14.5 13h-6A1.5 1.5 0 0 1 7 11.5v-8ZM4 7h1.5v8h7V17h-7A1.5 1.5 0 0 1 4 15.5V7Z" fill="currentColor"/></svg>',
  server: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3.5h12A1.5 1.5 0 0 1 17.5 5v3A1.5 1.5 0 0 1 16 9.5H4A1.5 1.5 0 0 1 2.5 8V5A1.5 1.5 0 0 1 4 3.5Zm1 2v1.5h1.5V5.5H5Zm-1 5h12a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 16 16.5H4A1.5 1.5 0 0 1 2.5 15v-3A1.5 1.5 0 0 1 4 10.5Zm1 2V14h1.5v-1.5H5Z" fill="currentColor"/></svg>',
};

function escapeHtml(value: string | undefined): string {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
    --bg: var(--brand-black);
    --surface: var(--brand-neutral-600);
    --surface-2: #101010;
    --surface-3: #1d1d1d;
    --border: var(--brand-neutral-500);
    --border-strong: var(--brand-neutral-400);
    --text: var(--brand-white);
    --muted: var(--brand-neutral-100);
    --muted-2: var(--brand-neutral-200);
    --amber: #f4b942;
    --red: #ff5f57;
    --cyan: #77d6ff;
    --violet: #a78bfa;
    --code: #d7dde8;
    --code-key: #8fb8ff;
    --code-string: #8be4b0;
    --code-number: #f4bf75;
    --code-literal: #c6a0ff;
    --code-punctuation: #78818f;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    display: flex;
    flex-direction: column;
    margin: 0;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: "Geist Sans", "Inter", "SF Pro Display", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  button {
    color: inherit;
  }

  .layout {
    display: flex;
    flex: 1;
    flex-direction: column;
    width: min(1120px, calc(100% - 40px));
    margin: 0 auto;
    padding: 24px 0 56px;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 22px;
    border-bottom: 1px solid var(--border);
  }

  .brand {
    min-width: 0;
  }

  .brand-head {
    display: flex;
    align-items: baseline;
    gap: 14px;
    min-width: 0;
  }

  .server-icon {
    display: none;
    width: 44px;
    height: 44px;
    border: 1px solid var(--border);
    border-radius: 0;
    background: var(--surface);
    object-fit: cover;
    flex: 0 0 auto;
  }

  .server-icon.visible {
    display: block;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.9rem, 4vw, 3.35rem);
    line-height: 1;
    letter-spacing: 0;
    font-weight: 650;
  }

  .server-title-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
    flex-wrap: wrap;
  }

  .server-version {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    border: 1px solid var(--border);
    border-radius: 0;
    padding: 0 8px;
    color: var(--muted);
    font-family: "Geist Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.72rem;
  }

  .description {
    margin: 12px 0 0;
    color: var(--muted);
    font-size: 0.98rem;
    line-height: 1.6;
    max-width: 700px;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 34px;
    border: 1px solid var(--border-strong);
    border-radius: 0;
    background: var(--surface-2);
    padding: 0 12px;
    color: var(--text);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  .button:hover,
  .button:focus-visible {
    background: var(--surface-3);
    border-color: var(--brand-neutral-300);
    outline: none;
  }

  .button:active {
    transform: translateY(1px);
  }

  .button.primary {
    border-color: var(--brand-white);
    background: var(--brand-white);
    color: var(--brand-black);
  }

  .button.danger {
    border-color: rgba(255, 95, 87, 0.55);
    background: rgba(255, 95, 87, 0.12);
    color: #ffd7d4;
  }

  .status-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    margin: 22px 0;
  }

  .stat {
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: 0;
    background: rgba(16, 16, 16, 0.78);
    padding: 14px;
  }

  .stat-label {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--muted-2);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .stat.copyable {
    cursor: pointer;
    text-align: left;
    color: inherit;
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
  }

  .stat.copyable:hover,
  .stat.copyable:focus-visible {
    border-color: var(--brand-neutral-300);
    background: rgba(255, 255, 255, 0.06);
    outline: none;
  }

  .stat.copyable:active {
    transform: translateY(1px);
  }

  .stat-value {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    min-width: 0;
    color: var(--text);
    font-family: "Geist Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.86rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stat-value.block {
    display: block;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  .capability-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
  }

  .capability-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 24px;
    border: 1px dashed var(--brand-neutral-400);
    border-radius: 0;
    background: transparent;
    color: var(--brand-neutral-100);
    padding: 0 7px;
    font-family: "Geist Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.64rem;
    font-weight: 650;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .capability-chip.active {
    border-style: solid;
    border-color: var(--brand-neutral-300);
    background: var(--brand-neutral-600);
    color: var(--brand-white);
  }

  .capability-chip.inactive {
    opacity: 0.72;
  }

  .stat-title {
    display: block;
    color: var(--text);
    font-family: "Geist Sans", "Inter", "SF Pro Display", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 0.98rem;
    font-weight: 650;
    line-height: 1.25;
  }

  .stat-description {
    display: block;
    margin-top: 6px;
    color: var(--muted);
    font-family: "Geist Sans", "Inter", "SF Pro Display", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: currentColor;
    flex: 0 0 auto;
  }

  .icon svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .icon-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: 1px solid var(--border);
    border-radius: 0;
    background: rgba(255, 255, 255, 0.035);
    color: var(--muted);
    flex: 0 0 auto;
  }

  .section {
    margin-top: 28px;
  }

  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin: 0 0 12px;
  }

  .section-title h2 {
    margin: 0;
    font-size: 0.78rem;
    color: var(--muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .muted {
    color: var(--muted);
  }

  .copy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 26px;
    border: 1px solid var(--border-strong);
    border-radius: 0;
    background: #171717;
    color: var(--muted);
    padding: 0 8px;
    font-size: 0.72rem;
    cursor: pointer;
  }

  .copy:hover,
  .copy:focus-visible {
    color: var(--text);
    outline: none;
  }

  pre {
    margin: 0;
    padding: 14px;
    overflow-x: auto;
    color: var(--code);
    font-family: "Geist Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.8rem;
    line-height: 1.55;
  }

  .code-json .json-key {
    color: var(--code-key);
  }

  .code-json .json-string {
    color: var(--code-string);
  }

  .code-json .json-number {
    color: var(--code-number);
  }

  .code-json .json-literal {
    color: var(--code-literal);
  }

  .code-json .json-punctuation {
    color: var(--code-punctuation);
  }

  code {
    font-family: inherit;
  }

  .tabs {
    display: flex;
    gap: 0;
    flex-wrap: wrap;
    justify-content: flex-start;
    border: 1px solid var(--brand-neutral-400);
    border-bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  .terminal-tabs {
    border-radius: 0;
    overflow: hidden;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    position: relative;
    border: 0;
    border-right: 1px solid var(--brand-neutral-500);
    border-radius: 0;
    background: transparent;
    color: var(--brand-neutral-100);
    padding: 9px 14px;
    font-family: "Geist Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.76rem;
    font-weight: 650;
    cursor: pointer;
  }

  .tab:hover,
  .tab:focus-visible {
    background: rgba(255, 255, 255, 0.08);
    color: var(--brand-white);
    outline: none;
  }

  .tab.active {
    color: var(--brand-white);
    background: var(--brand-black);
  }

  .tab.active::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 2px;
    background: var(--brand-neutral-200);
    content: "";
  }

  .panel {
    border: 1px solid var(--brand-neutral-400);
    border-radius: 0;
    background: rgba(16, 16, 16, 0.78);
    overflow: hidden;
  }

  .explorer-header {
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 0;
  }

  .explorer-header + .panel {
    border-radius: 0;
  }

  .config-panel {
    padding: 16px;
  }

  .endpoint-row {
    display: grid;
    grid-template-columns: auto minmax(112px, 180px) minmax(0, 1fr) minmax(96px, max-content);
    column-gap: 14px;
    row-gap: 6px;
    align-items: center;
    padding: 13px 14px;
    border-top: 1px solid var(--border);
  }

  .endpoint-row:first-child {
    border-top: 0;
  }

  .item-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    gap: 14px;
    align-items: center;
    padding: 14px;
    border-top: 1px solid var(--border);
  }

  .item-row:first-child {
    border-top: 0;
  }

  .item-main {
    min-width: 0;
  }

  .empty {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .method {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    height: 24px;
    border-radius: 0;
    font-family: "Geist Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.72rem;
    font-weight: 800;
  }

  .method.get {
    border: 1px solid var(--brand-neutral-400);
    background: var(--brand-neutral-600);
    color: var(--brand-white);
  }

  .method.post {
    border: 1px solid var(--brand-neutral-400);
    background: var(--brand-neutral-600);
    color: var(--brand-white);
  }

  .path,
  .mono {
    font-family: "Geist Mono", "SFMono-Regular", Consolas, monospace;
  }

  .path {
    color: var(--text);
    font-size: 0.86rem;
    overflow-wrap: anywhere;
  }

  .summary {
    color: var(--muted);
    font-size: 0.84rem;
    min-width: 0;
  }

  .endpoint-meta {
    justify-self: end;
    text-align: right;
    white-space: nowrap;
  }

  .empty,
  .error {
    padding: 18px;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .error {
    color: #ffd0cc;
    background: rgba(255, 95, 87, 0.08);
  }

  .tool-detail {
    display: none;
    padding: 18px;
    border-top: 1px solid var(--border);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 120px),
      rgba(5, 5, 5, 0.42);
  }

  .tool-detail.open {
    display: block;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
    align-items: stretch;
  }

  .schema-box,
  .result-box {
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: 0;
    background: rgba(10, 10, 10, 0.92);
    overflow: hidden;
  }

  .schema-box {
    border-color: rgba(119, 214, 255, 0.22);
  }

  .result-box {
    border-color: var(--brand-neutral-500);
  }

  .schema-box {
    display: flex;
    flex-direction: column;
  }

  .schema-box pre {
    flex: 1;
    min-height: 260px;
    background:
      linear-gradient(180deg, rgba(119, 214, 255, 0.035), transparent 150px),
      #070707;
  }

  .result-box {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
  }

  .box-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 42px;
    padding: 0 12px;
    border-bottom: 1px solid var(--border);
  }

  .schema-box .box-head {
    border-bottom-color: rgba(119, 214, 255, 0.18);
  }

  .result-box .box-head {
    border-bottom-color: var(--brand-neutral-500);
  }

  .box-title {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .box-heading {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }

  .box-kicker {
    color: var(--muted-2);
    font-size: 0.68rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .box-name {
    color: var(--text);
    font-size: 0.82rem;
    font-weight: 650;
  }

  .form-fields {
    display: grid;
    gap: 12px;
    padding: 14px;
  }

  label {
    display: grid;
    gap: 6px;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 650;
  }

  input,
  textarea,
  select {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 0;
    background: #050505;
    color: var(--text);
    padding: 10px 11px;
    font-family: "Geist Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.82rem;
    outline: none;
    transition: border-color 0.15s ease, background 0.15s ease;
  }

  input:focus,
  textarea:focus,
  select:focus {
    border-color: var(--brand-neutral-200);
    background: #080808;
  }

  input[type="checkbox"] {
    width: auto;
    justify-self: start;
  }

  textarea {
    min-height: 140px;
    resize: vertical;
    line-height: 1.5;
  }

  .field-help {
    color: var(--muted-2);
    font-weight: 500;
    line-height: 1.45;
  }

  .warning {
    display: none;
    margin: 0 12px 12px;
    border: 1px solid rgba(244, 185, 66, 0.35);
    border-radius: 0;
    background: rgba(244, 185, 66, 0.1);
    color: #ffe3a3;
    padding: 10px;
    font-size: 0.82rem;
    line-height: 1.5;
  }

  .warning.visible {
    display: block;
  }

  .submit-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 14px 14px;
  }

  .submit-hint {
    color: var(--muted-2);
    font-size: 0.76rem;
  }

  .result-panel {
    border-top: 1px solid var(--brand-neutral-500);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 160px),
      rgba(5, 5, 5, 0.52);
    min-height: 0;
  }

  .result-panel .box-head {
    min-height: 38px;
    border-bottom-color: rgba(38, 38, 38, 0.78);
  }

  .result-output {
    min-height: 176px;
    max-height: 340px;
    color: var(--code);
  }

  .result-output.idle {
    color: var(--muted);
  }

  .result-output.error-output {
    color: #ffd0cc;
  }

  .tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    border: 1px dashed var(--brand-neutral-400);
    border-radius: 0;
    background: transparent;
    color: var(--brand-neutral-100);
    padding: 0 7px;
    font-family: "Geist Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.64rem;
    font-weight: 650;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .tag.ok {
    color: var(--brand-white);
    border-style: solid;
    border-color: var(--brand-neutral-300);
    background: var(--brand-neutral-600);
  }

  .tag.warn {
    color: var(--brand-neutral-100);
    border-style: dashed;
    border-color: var(--brand-neutral-400);
    background: transparent;
  }

  .toast {
    position: fixed;
    right: 22px;
    bottom: 22px;
    z-index: 20;
    max-width: min(420px, calc(100% - 44px));
    border: 1px solid var(--border-strong);
    border-radius: 0;
    background: rgba(16, 16, 16, 0.96);
    color: var(--text);
    padding: 10px 12px;
    font-size: 0.84rem;
    opacity: 0;
    transform: translateY(8px);
    pointer-events: none;
    transition: opacity 0.18s ease, transform 0.18s ease;
  }

  .toast.show {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: 860px) {
    .topbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .actions {
      justify-content: flex-start;
    }

    .status-grid,
    .detail-grid {
      grid-template-columns: 1fr;
    }

    .endpoint-row {
      grid-template-columns: auto 1fr;
    }

    .item-row {
      grid-template-columns: auto 1fr;
    }

    .tags {
      justify-content: flex-start;
    }

    .summary,
    .endpoint-meta,
    .endpoint-row .button,
    .item-row .tags,
    .item-row .button {
      grid-column: 2;
      justify-self: start;
      text-align: left;
      white-space: normal;
    }
  }

  @media (max-width: 520px) {
    .layout {
      width: min(100% - 24px, 1120px);
      padding-top: 16px;
    }

    .stat {
      padding: 12px;
    }
  }
`;

const clientScript = String.raw`
(() => {
  const config = window.__XMCP_CONSOLE_CONFIG__;
  const TOAST_TIMEOUT_MS = ${TOAST_TIMEOUT_MS};
  const icons = ${JSON.stringify(ICONS)};
  const capabilityDefinitions = [
    { key: "tools", label: "Tools", icon: "tool" },
    { key: "resources", label: "Resources", icon: "resource" },
    { key: "prompts", label: "Prompts", icon: "prompt" },
    { key: "completions", label: "Completions", icon: "completion" },
    { key: "logging", label: "Logging", icon: "logging" },
    { key: "tasks", label: "Tasks", icon: "task" },
    { key: "experimental", label: "Experimental", icon: "experimental" },
  ];
  const state = {
    headers: {},
    tools: [],
    resources: [],
    resourceTemplates: [],
    prompts: [],
    activeTab: "tools",
  };

  const els = {
    capabilities: document.getElementById("capabilities"),
    mcpUrlCopy: document.getElementById("mcp-url-copy"),
    serverName: document.getElementById("server-name"),
    serverDescription: document.getElementById("server-description"),
    serverIcon: document.getElementById("server-icon"),
    serverVersion: document.getElementById("server-version"),
    inventory: document.getElementById("inventory"),
    tabs: document.querySelectorAll("[data-tab]"),
    toast: document.getElementById("toast"),
  };

  const endpointPath = normalizePath(config.endpoint || "/mcp");
  const origin = window.location.origin.replace(/\/$/, "");
  const mcpUrl = origin + endpointPath;

  els.mcpUrlCopy.setAttribute("data-copy", mcpUrl);
  bindEvents();
  loadAll();

  function bindEvents() {
    els.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        state.activeTab = tab.dataset.tab;
        els.tabs.forEach((item) => {
          const isActive = item === tab;
          item.classList.toggle("active", isActive);
          item.setAttribute("aria-selected", String(isActive));
          item.setAttribute("tabindex", isActive ? "0" : "-1");
        });
        renderInventory();
      });
    });
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const copyButton = target.closest("[data-copy]");
      if (copyButton) {
        const value = copyButton.getAttribute("data-copy") || "";
        const message = copyButton.getAttribute("data-copy-message") || "Copied.";
        copyText(value, message);
      }
      const rowButton = target.closest("[data-toggle-tool]");
      if (rowButton) {
        const name = rowButton.getAttribute("data-toggle-tool");
        const detail = Array.from(document.querySelectorAll("[data-tool-detail]")).find(
          (item) => item.getAttribute("data-tool-detail") === name
        );
        if (detail) {
          const isOpen = detail.classList.toggle("open");
          rowButton.setAttribute("aria-expanded", String(isOpen));
        }
      }
    });
    document.addEventListener("submit", (event) => {
      const form = event.target;
      if (form instanceof HTMLFormElement && form.id === "headers-form") {
        event.preventDefault();
        applyHeaders(form);
        return;
      }
      if (!(form instanceof HTMLFormElement) || !form.dataset.toolName) return;
      event.preventDefault();
      callTool(form);
    });
  }

  async function loadAll() {
    renderCapabilities({});
    const init = await rpc("initialize", {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: {
        name: "xmcp-root-console",
        version: "0.0.0",
      },
    }).catch((error) => ({ error }));

    if (init && init.error) {
      renderCapabilities({});
      setText(els.serverName, config.serverName || "xmcp server");
      setText(els.serverDescription, errorMessage(init.error));
      setText(els.serverVersion, "Unavailable");
    } else {
      renderCapabilities(init.capabilities || {});
      const serverInfo = init.serverInfo || {};
      setText(els.serverName, serverInfo.name || config.serverName || "xmcp server");
      setText(
        els.serverDescription,
        serverInfo.description || config.serverDescription || "No description provided"
      );
      setText(els.serverVersion, serverInfo.version ? "v" + serverInfo.version : "vUnknown");
      setServerIcon(serverInfo.icons || []);
    }

    const [tools, resources, resourceTemplates, prompts] = await Promise.all([
      rpc("tools/list", {}).catch((error) => ({ error })),
      rpc("resources/list", {}).catch((error) => ({ error })),
      rpc("resources/templates/list", {}).catch((error) => ({ error })),
      rpc("prompts/list", {}).catch((error) => ({ error })),
    ]);

    state.tools = tools && !tools.error ? tools.tools || [] : [];
    state.resources = resources && !resources.error ? resources.resources || [] : [];
    state.resourceTemplates =
      resourceTemplates && !resourceTemplates.error ? resourceTemplates.resourceTemplates || [] : [];
    state.prompts = prompts && !prompts.error ? prompts.prompts || [] : [];
    renderInventory();
  }

  async function rpc(method, params) {
    const response = await fetch(endpointPath, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        ...state.headers,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });
    const payload = await parseRpcResponse(response);
    if (!response.ok) {
      throw new Error(payload && payload.error ? payload.error.message : "Request failed with " + response.status);
    }
    if (payload.error) {
      throw payload.error;
    }
    return payload.result;
  }

  async function parseRpcResponse(response) {
    const text = await response.text();
    if (!text.trim()) return {};
    const dataLines = text
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean);
    if (dataLines.length > 0) {
      return JSON.parse(dataLines.join("\n"));
    }
    return JSON.parse(text);
  }

  function renderInventory() {
    if (state.activeTab === "tools") return renderTools();
    if (state.activeTab === "resources") return renderResources();
    if (state.activeTab === "templates") return renderResourceTemplates();
    if (state.activeTab === "config") return renderConfig();
    renderPrompts();
  }

  function renderTools() {
    if (!state.tools.length) {
      els.inventory.innerHTML = renderEmpty("tool", "No tools were reported by tools/list.");
      return;
    }
    els.inventory.innerHTML = state.tools
      .map((tool) => {
        const annotations = tool.annotations || {};
        const risky = annotations.destructiveHint === true || annotations.readOnlyHint !== true;
        const tags = renderTags([
          annotations.readOnlyHint === true ? ["Read only", "ok"] : ["Writable", "warn"],
          annotations.destructiveHint === true ? ["Destructive", "warn"] : null,
          annotations.idempotentHint === true ? ["Idempotent", "ok"] : null,
        ]);
        return (
          '<div class="item-row">' +
          '<span class="icon-badge">' +
          icon("tool") +
          "</span>" +
          '<span class="item-main"><span class="path">' +
          escapeText(tool.name) +
          '</span><br><span class="summary">' +
          escapeText(tool.description || "No description provided") +
          "</span></span>" +
          '<span class="tags">' +
          tags +
          '</span><button class="button" type="button" aria-expanded="false" data-toggle-tool="' +
          attr(tool.name) +
          '">Try it</button></div>' +
          '<div class="tool-detail" data-tool-detail="' +
          attr(tool.name) +
          '">' +
          renderToolDetail(tool, risky) +
          "</div>"
        );
      })
      .join("");
  }

  function renderToolDetail(tool, risky) {
    const schema = tool.inputSchema || { type: "object", properties: {} };
    const form = renderToolForm(tool, schema, risky);
    return (
      '<div class="detail-grid">' +
      '<div class="schema-box"><div class="box-head"><span class="box-heading"><span class="icon-badge">' +
      icon("template") +
      '</span><span class="box-title"><span class="box-kicker">Schema</span><span class="box-name">Input contract</span></span></span><button class="copy" type="button" data-copy="' +
      attr(JSON.stringify(schema, null, 2)) +
      '" data-copy-message="Copied input schema."><span class="icon">' +
      icon("copy") +
      '</span>Copy</button></div><pre><code class="code-json">' +
      formatJsonHtml(schema) +
      "</code></pre></div>" +
      '<div class="result-box"><div class="box-head"><span class="box-heading"><span class="icon-badge">' +
      icon("terminal") +
      '</span><span class="box-title"><span class="box-kicker">Execution</span><span class="box-name">' +
      escapeText(tool.name) +
      "</span></span></span></div>" +
      form +
      '<div class="result-panel"><div class="box-head"><span class="box-heading"><span class="icon-badge">' +
      icon("mcp") +
      '</span><span class="box-title"><span class="box-kicker">Response</span><span class="box-name">Result payload</span></span></span></div><pre class="result-output idle"><code class="code-json" id="result-' +
      attr(domId(tool.name)) +
      '">Run the tool to see the response.</code></pre></div></div></div>'
    );
  }

  function renderToolForm(tool, schema, risky) {
    const properties = schema.properties || {};
    const required = Array.isArray(schema.required) ? schema.required : [];
    const fields = Object.keys(properties).length
      ? Object.entries(properties).map(([name, property]) => renderField(name, property, required.includes(name))).join("")
      : '<div class="empty">This tool does not define input fields.</div>';
    return (
      '<form data-tool-name="' +
      attr(tool.name) +
      '" data-risky="' +
      String(risky) +
      '"><div class="form-fields">' +
      fields +
      '</div><div class="warning ' +
      (risky ? "visible" : "") +
      '">This tool is not marked read-only or may be destructive. The first click arms the call; click again to run it.</div><div class="submit-row"><span class="submit-hint">JSON-RPC tools/call</span><button class="button primary" type="submit">' +
      (risky ? "Review and run" : "Run tool") +
      "</button></div></form>"
    );
  }

  function renderField(name, schema, required) {
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
    const help = schema.description ? '<span class="field-help">' + escapeText(schema.description) + "</span>" : "";
    const label = escapeText(name) + (required ? " *" : "");
    let control = "";
    if (Array.isArray(schema.enum)) {
      control =
        '<select name="' +
        attr(name) +
        '"' +
        (required ? " required" : "") +
        ">" +
        schema.enum.map((item) => '<option value="' + attr(String(item)) + '">' + escapeText(String(item)) + "</option>").join("") +
        "</select>";
    } else if (type === "boolean") {
      control = '<input type="checkbox" name="' + attr(name) + '">';
    } else if (type === "number" || type === "integer") {
      control = '<input type="number" name="' + attr(name) + '"' + (required ? " required" : "") + ">";
    } else if (type === "object" || type === "array") {
      control =
        '<textarea name="' +
        attr(name) +
        '" data-json="true"' +
        (required ? " required" : "") +
        ">" +
        (type === "array" ? "[]" : "{}") +
        "</textarea>";
    } else {
      control = '<input type="text" name="' + attr(name) + '"' + (required ? " required" : "") + ">";
    }
    return "<label><span>" + label + "</span>" + control + help + "</label>";
  }

  async function callTool(form) {
    const toolName = form.dataset.toolName;
    const risky = form.dataset.risky === "true";
    const button = form.querySelector('button[type="submit"]');
    if (risky && form.dataset.armed !== "true") {
      form.dataset.armed = "true";
      button.textContent = "Confirm run";
      showToast("Confirm the tool call to continue.");
      return;
    }
    button.disabled = true;
    button.textContent = "Running";
    const result = document.getElementById("result-" + domId(toolName));
    const resultOutput = result ? result.closest(".result-output") : null;
    if (resultOutput) {
      resultOutput.classList.remove("idle", "error-output");
    }
    try {
      const args = collectFormArgs(form);
      const response = await rpc("tools/call", { name: toolName, arguments: args });
      result.innerHTML = formatJsonHtml(response);
    } catch (error) {
      if (resultOutput) resultOutput.classList.add("error-output");
      result.textContent = errorMessage(error);
    } finally {
      button.disabled = false;
      button.textContent = risky ? "Review and run" : "Run tool";
      form.dataset.armed = "false";
    }
  }

  function collectFormArgs(form) {
    const args = {};
    form.querySelectorAll("input, textarea, select").forEach((field) => {
      if (!field.name) return;
      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        args[field.name] = field.checked;
        return;
      }
      if (field instanceof HTMLTextAreaElement && field.dataset.json === "true") {
        args[field.name] = field.value.trim() ? JSON.parse(field.value) : null;
        return;
      }
      if (field instanceof HTMLInputElement && field.type === "number") {
        args[field.name] = field.value === "" ? undefined : Number(field.value);
        return;
      }
      args[field.name] = field.value;
    });
    Object.keys(args).forEach((key) => args[key] === undefined && delete args[key]);
    return args;
  }

  function renderResources() {
    renderSimpleList(
      state.resources,
      "No resources were reported by resources/list.",
      "resource",
      (item) => item.uri,
      (item) => item.description || item.name || "Resource"
    );
  }

  function renderResourceTemplates() {
    renderSimpleList(
      state.resourceTemplates,
      "No resource templates were reported by resources/templates/list.",
      "template",
      (item) => item.uriTemplate,
      (item) => item.description || item.name || "Resource template"
    );
  }

  function renderPrompts() {
    renderSimpleList(
      state.prompts,
      "No prompts were reported by prompts/list.",
      "prompt",
      (item) => item.name,
      (item) => {
        const args = Array.isArray(item.arguments) ? " Arguments: " + item.arguments.map((arg) => arg.name).join(", ") : "";
        return (item.description || "Prompt") + args;
      }
    );
  }

  function renderConfig() {
    els.inventory.innerHTML =
      '<form class="config-panel" id="headers-form">' +
      '<label><span>Request headers for /mcp</span>' +
      '<textarea name="headers" spellcheck="false" placeholder="{&quot;Authorization&quot;:&quot;Bearer token&quot;}">' +
      escapeText(JSON.stringify(state.headers, null, 2)) +
      '</textarea><span class="field-help">Headers stay in memory for this page session only.</span></label>' +
      '<div class="submit-row"><span></span><button class="button primary" type="submit">Apply headers</button></div>' +
      "</form>";
  }

  function renderSimpleList(items, emptyText, iconName, getPath, getSummary) {
    if (!items.length) {
      els.inventory.innerHTML = renderEmpty(iconName, emptyText);
      return;
    }
    els.inventory.innerHTML = items
      .map((item) => {
        return (
          '<div class="item-row"><span class="icon-badge">' +
          icon(iconName) +
          '</span><span class="item-main"><span class="path">' +
          escapeText(getPath(item) || "") +
          '</span><br><span class="summary">' +
          escapeText(getSummary(item) || "") +
          '</span></span><span class="tags">' +
          renderTags([[item.name || item.title || "metadata", ""]]) +
          "</span></div>"
        );
      })
      .join("");
  }

  function renderTags(tags) {
    return tags
      .filter(Boolean)
      .map((tag) => '<span class="tag ' + (tag[1] || "") + '">' + escapeText(tag[0]) + "</span>")
      .join("");
  }

  function renderCapabilities(capabilities) {
    const reported = capabilities && typeof capabilities === "object" ? capabilities : {};
    const knownKeys = capabilityDefinitions.map((capability) => capability.key);
    const customDefinitions = Object.keys(reported)
      .filter((key) => !knownKeys.includes(key))
      .map((key) => ({ key, label: titleCase(key), icon: "capabilities", custom: true }));
    els.capabilities.innerHTML = capabilityDefinitions.concat(customDefinitions)
      .map((capability) => {
        const active = Object.prototype.hasOwnProperty.call(reported, capability.key);
        return (
          '<span class="capability-chip ' +
          (active ? "active" : "inactive") +
          '" title="' +
          escapeText(active ? "Active capability" : "Not reported by this server") +
          '"><span class="icon">' +
          icon(capability.icon) +
          "</span><span>" +
          escapeText(capability.label) +
          "</span></span>"
        );
      })
      .join("");
  }

  function renderEmpty(iconName, text) {
    return '<div class="empty"><span class="icon-badge">' + icon(iconName) + "</span><span>" + escapeText(text) + "</span></div>";
  }

  function applyHeaders(form) {
    try {
      const input = form.elements.headers;
      const value = input instanceof HTMLTextAreaElement ? input.value : "";
      const parsed = value.trim() ? JSON.parse(value) : {};
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Headers must be a JSON object.");
      }
      state.headers = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          state.headers[key] = String(value);
        }
      });
      showToast("Headers applied for this page session.");
      loadAll();
    } catch (error) {
      showToast(errorMessage(error));
    }
  }

  function setText(el, text) {
    el.textContent = text;
  }

  function titleCase(value) {
    return String(value)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function normalizePath(path) {
    return path.startsWith("/") ? path : "/" + path;
  }

  function format(value) {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  function formatJsonHtml(value) {
    if (typeof value === "string") {
      return escapeText(value);
    }
    return escapeText(JSON.stringify(value, null, 2)).replace(
      /(&quot;(?:\\.|[^&])*?&quot;)(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?\b|[{}[\],:]/g,
      (match, quoted, colon, literal) => {
        if (quoted) {
          return colon
            ? '<span class="json-key">' + quoted + '</span><span class="json-punctuation">' + colon + '</span>'
            : '<span class="json-string">' + quoted + '</span>';
        }
        if (literal) return '<span class="json-literal">' + literal + "</span>";
        if (/^-?\d/.test(match)) return '<span class="json-number">' + match + "</span>";
        return '<span class="json-punctuation">' + match + "</span>";
      }
    );
  }

  function errorMessage(error) {
    if (!error) return "Unknown error";
    if (error.message) return error.message;
    return format(error);
  }

  function domId(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  function escapeText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function attr(value) {
    return escapeText(value);
  }

  function icon(name) {
    return icons[name] || icons.terminal;
  }

  function setServerIcon(iconsList) {
    const selected = selectServerIcon(iconsList);
    if (!selected || !els.serverIcon) return;
    els.serverIcon.src = selected.src;
    els.serverIcon.classList.add("visible");
  }

  function selectServerIcon(iconsList) {
    if (!Array.isArray(iconsList)) return null;
    return iconsList.find((item) => {
      if (!item || typeof item.src !== "string") return false;
      return /^(https?:\/\/|data:image\/|\/|\.\/|\.\.\/)/.test(item.src);
    }) || null;
  }

  async function copyText(text, message) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      showToast(message || "Copied.");
    } catch {
      showToast("Unable to copy.");
    }
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    setTimeout(() => els.toast.classList.remove("show"), TOAST_TIMEOUT_MS);
  }
})();
`;

const homeTemplate = (
  endpoint: string,
  serverName: string | undefined,
  serverDescription: string | undefined
) => {
  const resolvedName = serverName?.trim() || "xmcp server";
  const resolvedDescription =
    serverDescription?.trim() || FALLBACK_DESCRIPTION;
  const escapedName = escapeHtml(resolvedName);
  const escapedDescription = escapeHtml(resolvedDescription);
  const config = JSON.stringify({
    endpoint,
    serverName: resolvedName,
    serverDescription: resolvedDescription,
  }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapedName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist+Sans:wght@400;500;600;650&family=Geist+Mono:wght@400;500;650;800&display=swap" rel="stylesheet" />
    <style>${styles}</style>
  </head>
  <body>
    <main class="layout">
      <header class="topbar">
        <div class="brand">
          <div class="brand-head">
            <img class="server-icon" id="server-icon" alt="" />
            <div>
              <div class="server-title-row">
                <h1 id="server-name">${escapedName}</h1>
                <span class="server-version" id="server-version">vLoading</span>
              </div>
            </div>
          </div>
          <p class="description" id="server-description">${escapedDescription}</p>
        </div>
        <div class="actions">
          <button class="button primary" type="button" id="mcp-url-copy" data-copy="${escapeHtml(endpoint)}" data-copy-message="Copied MCP URL.">
            <span class="icon">${ICONS.copy}</span>
            <span>Get MCP URL</span>
          </button>
        </div>
      </header>

      <section class="status-grid" aria-label="Server status">
        <div class="stat">
          <div class="stat-label"><span class="icon">${ICONS.capabilities}</span>Capabilities</div>
          <div class="capability-list" id="capabilities">
            <span class="capability-chip inactive"><span class="icon">${ICONS.tool}</span><span>Tools</span></span>
            <span class="capability-chip inactive"><span class="icon">${ICONS.resource}</span><span>Resources</span></span>
            <span class="capability-chip inactive"><span class="icon">${ICONS.prompt}</span><span>Prompts</span></span>
            <span class="capability-chip inactive"><span class="icon">${ICONS.completion}</span><span>Completions</span></span>
            <span class="capability-chip inactive"><span class="icon">${ICONS.logging}</span><span>Logging</span></span>
            <span class="capability-chip inactive"><span class="icon">${ICONS.task}</span><span>Tasks</span></span>
            <span class="capability-chip inactive"><span class="icon">${ICONS.experimental}</span><span>Experimental</span></span>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-title explorer-header">
          <div class="tabs terminal-tabs" role="tablist" aria-label="MCP inventory">
            <button class="tab active" type="button" role="tab" aria-selected="true" tabindex="0" data-tab="tools"><span class="icon">${ICONS.tool}</span>Tools</button>
            <button class="tab" type="button" role="tab" aria-selected="false" tabindex="-1" data-tab="resources"><span class="icon">${ICONS.resource}</span>Resources</button>
            <button class="tab" type="button" role="tab" aria-selected="false" tabindex="-1" data-tab="templates"><span class="icon">${ICONS.template}</span>Templates</button>
            <button class="tab" type="button" role="tab" aria-selected="false" tabindex="-1" data-tab="prompts"><span class="icon">${ICONS.prompt}</span>Prompts</button>
            <button class="tab" type="button" role="tab" aria-selected="false" tabindex="-1" data-tab="config"><span class="icon">${ICONS.server}</span>Config</button>
          </div>
        </div>
        <div class="panel" id="inventory" role="tabpanel">
          <div class="empty"><span class="icon-badge">${ICONS.server}</span><span>Loading MCP inventory.</span></div>
        </div>
      </section>

    </main>

    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <script>window.__XMCP_CONSOLE_CONFIG__ = ${config};</script>
    <script>${clientScript}</script>
  </body>
</html>`;
};

export default homeTemplate;
