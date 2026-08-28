---
"xmcp": patch
"@xmcp-dev/compiler": patch
---

Fix the Next.js adapter producing a dead `/mcp` route in `"type": "module"` projects (Next 16 / Turbopack included). The compiler was parsing the prebuilt CommonJS adapter runtime as strict ESM, so `.xmcp/adapter/index.js` ended up with no exports, and the output had no CommonJS marker so the host bundler mis-parsed it as ESM. Adapter builds now parse the prebuilt runtime as CommonJS in ESM projects and emit a `{"type":"commonjs"}` package.json into `.xmcp/adapter/`. The runtime tool/prompt/resource loaders also unwrap the extra interop namespace the host bundler's `require()` of ESM tool files can add, and the Next.js adapter now logs MCP handler errors when `http.debug` is enabled instead of failing silently.
