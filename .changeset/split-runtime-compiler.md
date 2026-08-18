---
"xmcp": minor
"@xmcp-dev/compiler": minor
"create-xmcp-app": minor
"init-xmcp": minor
---

Move the development compiler into `@xmcp-dev/compiler` so production `xmcp` installs contain only the self-contained runtime. Existing `xmcp dev`, `xmcp build`, and `xmcp create` commands remain available through a runtime-package shim, but projects must add `@xmcp-dev/compiler` as a development dependency.
