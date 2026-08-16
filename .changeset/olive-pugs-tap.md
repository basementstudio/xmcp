---
"xmcp": patch
---

Stop shipping `src` in the published package. Every entry point in `main`,
`types`, `bin`, `exports`, and `typesVersions` resolves into `dist`, and no
source maps reference `src`, so the directory was dead weight in the tarball:
223 files down to 71.
