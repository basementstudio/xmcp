import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <main>
      <h1>xmcp + TanStack</h1>
      <p>
        Connect an MCP client to <code>/mcp</code> and call the{" "}
        <code>greet</code> tool.
      </p>
    </main>
  ),
});
