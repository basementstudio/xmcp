import { useMemo } from "react";
import type { ChatMessage } from "@/types/chat";

/** Unique tools used by the current conversation. */
export function useTools(messages: ChatMessage[]): string[] {
  return useMemo(
    () =>
      Array.from(
        new Set(
          messages.flatMap((message) =>
            message.parts
              .filter((part) => part.type?.includes("tool"))
              .map((part) => part.type)
          )
        )
      ),
    [messages]
  );
}
