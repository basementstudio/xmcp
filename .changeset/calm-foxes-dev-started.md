---
"@xmcp-dev/compiler": minor
---

Telemetry now sends one `dev:started` event per `xmcp dev` session, adds the command, package manager, deploy target, and a fixed list of enabled framework features to build and dev events, and reports config, compile, and client transpile failures in addition to bundler failures.
