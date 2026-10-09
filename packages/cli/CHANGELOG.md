# @xmcp-dev/cli

## 0.2.0

### Minor Changes

- Add `inspect` and `list` commands for HTTP URLs, named clients, and STDIO servers. Support JSON output, preserve stdout for results, collect complete component catalogs, and close managed connections on success or failure.
- Add `call`, `read-resource`, and `get-prompt` commands with JSON results, argument flags/files/stdin, schema validation, distinct invalid-input exit codes, and managed connection cleanup.
- Add `install` to export MCP JSON or install named, HTTP, and STDIO server entries into Cursor, Claude Desktop, or a custom config. Support dry runs and explicit replacement while preserving unrelated settings and literal environment references.
- Add `import-openapi` to generate GET tools from OpenAPI 3.0/3.1 JSON, with operation selection, local schema references, validated path/query inputs, and fetch handlers. Reject unsupported inputs and existing output files.
