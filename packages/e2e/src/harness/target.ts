import type { Client } from "@modelcontextprotocol/client";
import type { Fixture, FixtureSpec } from "./fixture.js";
import type { ProtocolMode } from "./client-options.js";

export type Capability =
  | "tools"
  | "prompts"
  | "resources"
  | "templates"
  | "input-required"
  | "request-context"
  | "request-helpers"
  | "mcp-middleware"
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
  "request-context",
  "request-helpers",
  "mcp-middleware",
];

export function getTargetCapabilities(
  spec: Pick<FixtureSpec, "kind" | "capabilities">,
  mode: ProtocolMode
): Pick<Target, "capabilities" | "unsupportedReasons"> {
  const capabilities = new Set(spec.capabilities ?? BASE_CAPABILITIES);
  const unsupportedReasons: Partial<Record<Capability, string>> = {};
  if (spec.kind === "stdio") {
    capabilities.delete("stateless-http");
  } else {
    if (spec.capabilities === undefined) capabilities.add("stateless-http");
    if (mode === "legacy") {
      capabilities.delete("input-required");
      unsupportedReasons["input-required"] =
        "Stateless legacy HTTP cannot receive server-to-client input requests";
    }
  }
  return { capabilities, unsupportedReasons };
}

export function supports(
  target: Pick<Target, "capabilities">,
  capability: Capability
): boolean {
  return target.capabilities.has(capability);
}
