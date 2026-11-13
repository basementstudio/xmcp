---
"xmcp": patch
"@xmcp-dev/compiler": patch
"create-xmcp-app": patch
"init-xmcp": patch
"@xmcp-dev/better-auth": patch
---

The compiler now runs on Rspack 2, which is ESM-only, so xmcp requires Node.js 22.12 or later. Configs passed to the `bundler` hook receive Rspack 2 options. The Better Auth plugin bundles its sign-in UI, so React and React Router are no longer installed as runtime dependencies.
