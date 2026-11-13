---
"xmcp": minor
---

Serve Agent Skills through the MCP Skills extension (`io.modelcontextprotocol/skills`). Skill directories under `src/skills` (configurable with `paths.skills`) are validated and embedded at build time, published through `skills/list` and `skills/get`, and readable as `skill://` resources.

`src/skills` is now read by default: every directory there with a `SKILL.md` is served to MCP clients, and other files and directories are skipped with a warning. Set `paths.skills` to `false` if the directory is not for skills.
