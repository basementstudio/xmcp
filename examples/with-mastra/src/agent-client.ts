import { Agent } from "@mastra/core/agent";
import type { MastraModelConfig } from "@mastra/core/llm";
import { shippingClient, shippingTools } from "./connection";
import { required } from "./env";

/** Bounds tool-call loops for one question. */
const MAX_STEPS = 3;

/**
 * Runs a fresh in-process agent per call. Aborting stops the model and tool
 * calls; nothing is retried. `model` is injectable for deterministic tests.
 */
export async function askAgent(
  prompt: string,
  signal: AbortSignal,
  model: MastraModelConfig = required("MASTRA_MODEL")
): Promise<string> {
  signal.throwIfAborted();
  const client = shippingClient();
  try {
    const agent = new Agent({
      id: "shipping",
      name: "Shipping assistant",
      instructions:
        "Answer shipping questions using the shipping policy tool. Do not invent policies.",
      model,
      tools: await shippingTools(client),
    });
    const result = await agent.generate(prompt, {
      abortSignal: signal,
      maxSteps: MAX_STEPS,
    });
    if (!result.text.trim()) throw new Error("Empty reply");
    return result.text;
  } catch {
    signal.throwIfAborted();
    throw new Error("Mastra agent request failed");
  } finally {
    await client.disconnect();
  }
}
