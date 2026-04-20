import { z } from "zod";

export const schema = {
  // xmcp-audit-ignore-next-line XMCP-SCHEMA-001 payload truly is opaque here
  payload: z.any(),
};

export const metadata = {
  name: "suppressed",
  description: "A tool with a suppressed finding",
};

export default async function suppressed({ payload }: { payload: unknown }) {
  return payload;
}
