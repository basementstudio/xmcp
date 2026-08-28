---
"@xmcp-dev/compiler": patch
---

Fix the framework adapters producing an export-less bundle in projects whose `package.json` declares `"type": "module"`. In a Next.js 16 app this made the `/mcp` route come up dead: Turbopack reported `The export xmcpHandler was not found in module .xmcp/adapter/index.js. The module has no exports at all.`

Adapter output is CommonJS because the host framework re-bundles it, but `"type": "module"` put the whole `.xmcp` folder under strict ESM parsing on both sides of that handoff. During the xmcp build it left the prebuilt runtime's `module.exports` assignment dead — stripping every export off the bundle — and gave externalized tool files ESM default interop that the host bundler does not apply, so tools failed to load with `Default export must be a tool handler function`. The host bundler then read the emitted CommonJS `index.js` as ESM as well.

`.xmcp` is now parsed with CommonJS semantics regardless of the application's module type, and `.xmcp/adapter/package.json` pins the output folder to `"type": "commonjs"`. Output for CommonJS projects, plain server builds, and Cloudflare builds is byte-for-byte unchanged.
