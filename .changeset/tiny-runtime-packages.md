---
"xmcp": patch
---

Reduce published and generated bundle sizes by loading prebuilt runtime files from disk, avoiding vendored install duplicates, and removing compiler-only schema and terminal dependencies from runtime bundles.
