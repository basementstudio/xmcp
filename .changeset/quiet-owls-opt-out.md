---
"@xmcp-dev/compiler": patch
---

Add the `xmcp telemetry [status|enable|disable]` command the first-run notice already pointed to, stop build-failure telemetry from sending module paths as the error type, and hash only the package name for the anonymous project id so version bumps no longer count as new projects.
