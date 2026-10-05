# Execution observability

This example enables built-in execution logs for tools, prompts, and resource reads over HTTP and STDIO. No handler wrappers or external services are required.

From the repository root, install dependencies and build the local framework/compiler:

```sh
pnpm install
pnpm build
cd examples/execution-observability
pnpm build
pnpm start 2>execution.log
```

From another terminal, call the HTTP server:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -H 'traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"greet","arguments":{"name":"Ada"}}}'
```

Inspect `execution.log` for JSON `execution.start` / `execution.end` events sharing a `transaction.id`. The end event includes the outcome and nanosecond duration. The name argument and greeting result are not logged. The supplied trace and parent IDs are included for correlation.

Call `fail` to see a safe failure summary. An MCP client can also retrieve the `greeting` prompt and read `example://info` to observe those operations.

To use STDIO, configure your MCP client to run `node dist/stdio.js` with this example as its working directory. Logs go to stderr; stdout carries only MCP messages. You can also run `pnpm start:stdio` for local inspection.

Set `observability.enabled` to `false` and rebuild to disable execution logs. No original exception messages, arguments, results, or resource URI parameters are emitted. Logging does not enable the deprecated MCP logging capability or create OpenTelemetry spans.
