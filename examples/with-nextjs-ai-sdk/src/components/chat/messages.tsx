import { useEffect, useRef } from "react";
import ChatMessage from "./message";
import { ChatMessage as ChatMessageType, ChatStatus } from "@/types/chat";

interface ChatMessagesProps {
  messages: ChatMessageType[];
  status: ChatStatus;
}

/**
 * Container component for displaying all chat messages
 */
export default function ChatMessages({ messages, status }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Loading indicator */}
      {(status === "submitted" || status === "streaming") && (
        <div className="flex justify-start">
          <div className="p-3 max-w-xs sm:max-w-md">
            <span className="text-md">Thinking...</span>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
