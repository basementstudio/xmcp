import type { ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "now",
  title: "Live status",
  description: "The current server time, different on every read",
};

export default function now() {
  return JSON.stringify({ checkedAt: new Date().toISOString() });
}
