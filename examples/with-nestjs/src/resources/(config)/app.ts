import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "app-config",
  title: "Application Configuration",
  description: "Application configuration and settings",
};

export default function handler() {
  return JSON.stringify(
    {
      name: "NestJS + XMCP Example",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      features: {
        mcp: true,
        tools: true,
        prompts: true,
        resources: true,
      },
    },
    null,
    2
  );
}
