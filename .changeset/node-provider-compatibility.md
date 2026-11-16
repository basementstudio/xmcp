---
"xmcp": patch
"@xmcp-dev/compiler": patch
---

Support native ESM named imports from the xmcp root entry so provider plugins load directly in Node.js. Return a nonzero exit status when production compilation fails.

Generate adapter type declarations before type checking so clean adapter builds can include host imports without disabling type checking.
