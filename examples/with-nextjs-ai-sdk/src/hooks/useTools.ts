import { useState, useEffect } from 'react';
import { ChatMessage, MessagePart } from '@/types/chat';

/**
 * Custom hook to extract and track tool usage from messages
 * @param messages - Array of chat messages
 * @returns Array of unique tool names that have been used
 */
export function useTools(messages: ChatMessage[]): string[] {
  const [tools, setTools] = useState<string[]>([]);

  useEffect(() => {
    const extractedTools = messages.flatMap((message) =>
      message.parts
        .filter((part: MessagePart) => part.type?.includes('tool'))
        .map((part: MessagePart) => part.type)
    );

    setTools((prev) => {
      const toolSet = new Set([...prev, ...extractedTools]);
      return Array.from(toolSet);
    });
  }, [messages]);

  return tools;
}