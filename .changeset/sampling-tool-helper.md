---
"xmcp": minor
---

Add `extra.sample()` so tool handlers can request LLM completions from the connected client via MCP sampling (`sampling/createMessage`), mirroring `extra.elicit()`. Supports text/image/audio messages, `systemPrompt`, `maxTokens`, `modelPreferences`, `temperature`, `stopSequences`, `includeContext`, and `metadata`, and exports the `SampleRequest`/`SampleResult` types. The `tools`/`toolChoice` sampling loop and task-augmented sampling are rejected with a clear error until the client tool-call flow is wired.
