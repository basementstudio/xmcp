import {
  Client,
  StreamableHTTPClientTransport,
  type ClientOptions,
  type ConnectOptions,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { CLIENT_IDENTITY } from "./index";
import {
  capabilitiesForHandlers,
  type ClientHandlers,
  registerClientHandlers,
} from "./handlers";
import { headersToRecord } from "./headers";
import type { ClientDefinition } from "./types";

export type { ClientHandlers } from "./handlers";

export interface ManagedClientOptions {
  handlers?: ClientHandlers;
  /** Defaults to automatic modern/legacy protocol negotiation. */
  versionNegotiation?: ClientOptions["versionNegotiation"];
  /** SDK connection options, including timeout and cancellation signal. */
  connect?: ConnectOptions;
  /** Receives piped subprocess stderr; otherwise it is forwarded to stderr. */
  onStderrData?: (chunk: Buffer) => void;
}

/** Connect using a client definition, with handlers installed before negotiation. */
export async function createClient(
  definition: ClientDefinition,
  options: ManagedClientOptions = {}
): Promise<Client> {
  const { handlers = {} } = options;
  const client = new Client(CLIENT_IDENTITY, {
    capabilities: capabilitiesForHandlers(handlers),
    versionNegotiation: options.versionNegotiation ?? { mode: "auto" },
  });
  registerClientHandlers(client, handlers);

  const transport =
    definition.type === "http"
      ? new StreamableHTTPClientTransport(new URL(definition.url), {
          requestInit: {
            headers: headersToRecord(definition.headers ?? []),
          },
        })
      : new StdioClientTransport({
          command: definition.command,
          args: definition.args,
          env: definition.env,
          cwd: definition.cwd,
          stderr:
            definition.stderr ?? (options.onStderrData ? "pipe" : "inherit"),
        });
  if (transport instanceof StdioClientTransport) {
    // Drain an explicitly piped stream even without a callback so a noisy
    // subprocess cannot block on its stderr buffer.
    transport.stderr?.on(
      "data",
      options.onStderrData ??
        ((chunk: Buffer) => {
          process.stderr.write(chunk);
        })
    );
  }

  // The SDK may start closing after a failed handshake without awaiting it.
  // Share that promise so cleanup waits for the subprocess to actually exit.
  const closeTransport = transport.close.bind(transport);
  let closingTransport: Promise<void> | undefined;
  transport.close = () => (closingTransport ??= closeTransport());
  const closeClient = client.close.bind(client);
  client.close = async () => {
    try {
      await closeClient();
    } finally {
      // Negotiation can fail before the SDK attaches the transport to the client.
      await transport.close();
    }
  };

  const signal = options.connect?.signal;
  // SDK negotiation runs before its normal request cancellation is attached.
  // Closing the transport also interrupts that initial discovery probe.
  const abortConnect = () => {
    void transport.close().catch(() => {});
  };
  try {
    signal?.throwIfAborted();
    signal?.addEventListener("abort", abortConnect, { once: true });
    await client.connect(transport, options.connect);
    signal?.throwIfAborted();
    return client;
  } catch (error) {
    try {
      await client.close();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Client connection and cleanup failed",
        { cause: error }
      );
    }
    signal?.throwIfAborted();
    throw error;
  } finally {
    signal?.removeEventListener("abort", abortConnect);
  }
}

/** Run an operation and close the connection even when the operation fails. */
export async function withClient<T>(
  definition: ClientDefinition,
  operation: (client: Client) => T | Promise<T>,
  options?: ManagedClientOptions
): Promise<T> {
  const client = await createClient(definition, options);
  try {
    return await operation(client);
  } finally {
    await client.close();
  }
}
