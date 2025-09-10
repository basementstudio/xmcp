"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatInput, ChatMessages } from "@/components/chat";
import { Header } from "@/components/layout";
import { useTools } from "@/hooks";
import { ChatMessage, ChatStatus } from "@/types/chat";

/**
 * Main chat application page
 * Based on the Chatbot example from AI SDK:
 * https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
 */
export default function Home() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  // Type assertion for messages - AI SDK doesn't export proper types
  const typedMessages = messages as ChatMessage[];
  const typedStatus = status as ChatStatus;

  // Extract tools from messages using custom hook
  const tools = useTools(typedMessages);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <Header tools={tools} />
      <ChatMessages messages={typedMessages} status={typedStatus} />
      <ChatInput sendMessage={sendMessage} status={typedStatus} />
    </div>
  );
}
