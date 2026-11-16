import { Client } from "eve/client";
import { required } from "./env";

export type EveClient = Pick<Client, "sessions">;

export function newClient(): EveClient {
  return new Client({
    baseUrl: required("EVE_URL"),
    auth: { bearer: required("EVE_TOKEN") },
  });
}

/**
 * Starts a new eve session per call and waits for its reply. Submissions are
 * never retried: an aborted call stops waiting, but the run may still finish.
 */
export async function askAgent(
  prompt: string,
  signal: AbortSignal,
  client: EveClient = newClient()
): Promise<string> {
  signal.throwIfAborted();
  try {
    const { delivery } = await client.sessions.create({
      message: prompt,
      signal,
      reconnect: false,
    });
    const result = await delivery.result({ signal });
    if (result.status === "failed" || !result.reply?.trim()) {
      throw new Error("No completed reply");
    }
    return result.reply;
  } catch {
    signal.throwIfAborted();
    throw new Error("eve agent request failed");
  }
}
