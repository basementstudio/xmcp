---
"xmcp": minor
---

Add `npx xmcp@latest upgrade` (aliases `update` and `up`) to move projects from xmcp 0.x to the current release. It updates `xmcp`, adds `@xmcp-dev/compiler`, moves zod to v4, removes `swc-loader`, raises `engines.node`, installs with the project's package manager, and lists code changes it does not make. Supports `--dry-run` and `--no-install`.
