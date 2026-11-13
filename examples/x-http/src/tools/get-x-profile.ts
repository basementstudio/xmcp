import type { ToolMetadata } from "xmcp";
import { currentUser, toolResult } from "../x";
export const schema = {};
export const metadata: ToolMetadata = {
  name: "get-x-profile",
  description:
    "Identify the X account authorized by the server's OAuth user token before reading mentions or publishing posts.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
export default async function getProfile() {
  const result = await currentUser();
  return "error" in result
    ? result.error
    : toolResult({ user: result.data.data });
}
