---
"xmcp": patch
"@xmcp-dev/compiler": patch
---

Fix `xmcp build --cf` / `xmcp dev --cf` failing with `Module not found: Can't resolve '.../node_modules/xmcp/src/runtime/platforms/cloudflare/worker.ts'` since `src/` stopped shipping in the published package (0.7.1). The Cloudflare worker runtime is now prebuilt into `dist/runtime/cloudflare-worker.js` like the other runtimes, and the compiler uses that artifact as the `--cf` entry instead of bundling xmcp's TypeScript source from `node_modules`.
