import { type ToolMetadata } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "sprawl_42",
  description:
    "Trivial sprawl tool number 42 — exists only to push the project past 50 tools.",
};

export default async function sprawl42() {
  return "ok 42";
}
