import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "app-config",
  title: "Application Config",
  description: "Static application configuration",
};

export default function appConfig() {
  const mimeType = "application/json";
  return {
    contents: [
      {
        mimeType,
        text: JSON.stringify(
          {
            app: "audit-clean",
            environment: "demo",
          },
          null,
          2
        ),
      },
    ],
  };
}
