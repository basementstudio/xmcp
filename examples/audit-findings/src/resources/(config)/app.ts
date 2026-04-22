import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "app-config",
  title: "Application Config",
  description: "Static audit demo config",
};

export default function appConfig() {
  return "App configuration for audit findings playground";
}
