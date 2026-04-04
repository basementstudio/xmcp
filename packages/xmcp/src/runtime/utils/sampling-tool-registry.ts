import type { Tool } from "@modelcontextprotocol/sdk/types";
import type { SampleToolSelection } from "@/types/tool";
import type { McpToolHandler } from "./transformers/tool";

export interface SamplingToolRegistration {
  definition: Tool;
  validateInput: (input: unknown) => unknown;
  execute: McpToolHandler;
}

export type SamplingToolRegistry = Map<string, SamplingToolRegistration>;

const defaultSamplingToolRegistry: SamplingToolRegistry =
  createSamplingToolRegistry();

export function createSamplingToolRegistry(): SamplingToolRegistry {
  return new Map<string, SamplingToolRegistration>();
}

export function clearSamplingToolRegistry(
  registry: SamplingToolRegistry = defaultSamplingToolRegistry
): void {
  registry.clear();
}

export function registerSamplingTool(
  name: string,
  registration: SamplingToolRegistration,
  registry: SamplingToolRegistry = defaultSamplingToolRegistry
): void {
  registry.set(name, registration);
}

export function resolveSamplingTools(
  selection: SampleToolSelection,
  registry: SamplingToolRegistry = defaultSamplingToolRegistry
): SamplingToolRegistration[] {
  if (selection === "all") {
    return Array.from(registry.values());
  }

  const resolved: SamplingToolRegistration[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const name of selection) {
    if (seen.has(name)) {
      continue;
    }

    seen.add(name);
    const tool = registry.get(name);

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
