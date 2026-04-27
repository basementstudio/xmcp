import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "ping_addr",
  description: "Ping a host and return whether it answered.",
};

export default async function pingAddr({ host }: { host: string }) {
  return `pinged ${host}`;
}
