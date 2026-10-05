import { EventEmitter, once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { REQUEST_TIMEOUT_MS } from "./constants.js";

// Test-owned observations stay outside the application. An aborted HTTP stream
// cannot carry proof of server-side cleanup, and a later MCP request must not
// depend on hidden state from the cancelled request.
export async function cancellationProbe() {
  const events = new EventEmitter();
  const observations = new Map<string, Record<string, unknown>>();
  const server = createServer(async (request, response) => {
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const { phase, ...data } = JSON.parse(Buffer.concat(chunks).toString());
      observations.set(phase, data);
      response.end();
      events.emit(phase, data);
    } catch {
      response.writeHead(400).end();
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    async wait(phase: string): Promise<Record<string, unknown>> {
      return (
        observations.get(phase) ??
        (
          await once(events, phase, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          })
        )[0]
      );
    },
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      });
    },
  };
}
