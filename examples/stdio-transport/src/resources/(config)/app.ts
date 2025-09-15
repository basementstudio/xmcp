import { type ResourceMetadata } from "xmcp";

// uri comes from folder structure, resulting in config://app
// no params - no schema

// resulting URI is config://app
export const metadata: ResourceMetadata = {
  name: "app-config",
  title: "Application Config",
  description: "Application configuration data",
};

export default function handler() {
  return "App configuration here";
}
