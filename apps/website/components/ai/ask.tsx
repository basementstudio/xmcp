import { detectMacFromHeaders } from "@/utils/detect-os";
import { AskAIButtonClient } from "./ask-button";

export async function AskAIButton() {
  const isMac = await detectMacFromHeaders();

  return <AskAIButtonClient isMac={isMac} />;
}
