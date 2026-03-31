import type { Tool } from "@modelcontextprotocol/sdk/types";
import type { SampleToolSelection } from "@/types/tool";
import type { McpToolHandler } from "./transformers/tool";

export interface SamplingToolRegistration {
  definition: Tool;
  validateInput: (input: unknown) => unknown;
  execute: McpToolHandler;
}

const samplingToolRegistry = new Map<string, SamplingToolRegistration>();

export function clearSamplingToolRegistry(): void {
  samplingToolRegistry.clear();
}

export function registerSamplingTool(
  name: string,
  registration: SamplingToolRegistration
): void {
  samplingToolRegistry.set(name, registration);
}

export function resolveSamplingTools(
  selection: SampleToolSelection
): SamplingToolRegistration[] {
  if (selection === "all") {
    return Array.from(samplingToolRegistry.values());
  }

  const resolved: SamplingToolRegistration[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const name of selection) {
    if (seen.has(name)) {
      continue;
    }

    seen.add(name);
    const tool = samplingToolRegistry.get(name);

    if (!tool) {
      missing.push(name);
      continue;
    }

    resolved.push(tool);
  }

  if (missing.length > 0) {
    throw new Error(`Unknown sampling tool(s): ${missing.join(", ")}`);
  }

  return resolved;
}
