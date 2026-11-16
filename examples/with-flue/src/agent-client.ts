import { randomUUID } from "node:crypto";
import { createFlueClient } from "@flue/sdk";
import { required } from "./env";

export type Conversation = Pick<
  ReturnType<typeof createFlueClient>,
  "send" | "read"
>;

/** Every call opens a fresh conversation, so no state leaks between callers. */
export function newConversation(): Conversation {
  const agentUrl = required("FLUE_AGENT_URL").replace(/\/$/, "");
  return createFlueClient({
    url: `${agentUrl}/${randomUUID()}`,
    token: required("FLUE_TOKEN"),
    fetch: (input, init) => fetch(input, { ...init, redirect: "error" }),
  });
}

/**
 * Sends one prompt and waits for the reply. The submission is never retried:
 * an aborted call stops reading, but the agent may still finish the turn.
 */
export async function askAgent(
  prompt: string,
  signal: AbortSignal,
  conversation: Conversation = newConversation()
): Promise<string> {
  signal.throwIfAborted();
  try {
    const admission = await conversation.send({
      message: { kind: "user", body: prompt },
      signal,
    });
    const reply = await conversation.read(admission, { signal });
    if (!reply.text.trim()) throw new Error("Empty reply");
    return reply.text;
  } catch {
    signal.throwIfAborted();
    throw new Error("Flue agent request failed");
  }
}
