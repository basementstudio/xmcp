---
"@xmcp-dev/compiler": minor
---

Emit ESM server bundles when the application's `package.json` declares `"type": "module"`. The build writes a `dist/package.json` module marker so the self-contained output keeps running when deployed without the project, and node builtins resolve through `createRequire`. Projects without the field keep CommonJS output unchanged.
