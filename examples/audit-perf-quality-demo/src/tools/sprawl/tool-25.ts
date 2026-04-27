import { type ToolMetadata } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "sprawl_25",
  description:
    "Trivial sprawl tool number 25 — exists only to push the project past 50 tools.",
};

export default async function sprawl25() {
  return "ok 25";
}
