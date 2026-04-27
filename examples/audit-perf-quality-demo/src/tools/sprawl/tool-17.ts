import { type ToolMetadata } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "sprawl_17",
  description:
    "Trivial sprawl tool number 17 — exists only to push the project past 50 tools.",
};

export default async function sprawl17() {
  return "ok 17";
}
