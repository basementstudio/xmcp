import type { Client } from "@modelcontextprotocol/client";
import type { Fixture } from "./fixture.js";
import type { ProtocolMode } from "./client-options.js";

export type Capability =
  | "tools"
  | "prompts"
  | "resources"
  | "templates"
  | "input-required"
  | "stateless-http";
export interface Target {
  fixture: Fixture;
  mode: ProtocolMode;
  client: Client;
  capabilities: ReadonlySet<Capability>;
  unsupportedReasons?: Partial<Record<Capability, string>>;
  url?: string;
  close(): Promise<void>;
}
export const BASE_CAPABILITIES: readonly Capability[] = [
  "tools",
  "prompts",
  "resources",
  "templates",
  "input-required",
];
export function supports(
  target: Pick<Target, "capabilities">,
  capability: Capability
): boolean {
  return target.capabilities.has(capability);
}
