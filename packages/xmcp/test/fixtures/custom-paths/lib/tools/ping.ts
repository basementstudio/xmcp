import { type ToolMetadata } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "ping",
  description: "Returns pong",
  annotations: {
    title: "Ping",
    readOnlyHint: true,
    idempotentHint: true,
  },
};

export default function ping() {
  return "pong";
}
