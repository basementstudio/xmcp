import {
  ChatMessage as ChatMessageType,
  isTextPart,
  hasToolOutput,
} from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * Renders a single chat message with all its parts
 */
export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
          isUser
            ? "bg-cyan-600 text-white"
            : "bg-gray-900 text-gray-100 border border-gray-800"
        }`}
      >
        {message.parts.map((part, index) => {
          // Handle text parts
          if (isTextPart(part)) {
            return (
              <div key={index} className="whitespace-pre-wrap">
                {part.text}
              </div>
            );
          }

          // Handle tool parts with output
          if (hasToolOutput(part)) {
            return part.output.content.map((contentPart, contentIndex) => {
              if (contentPart.type === "text" && contentPart.text) {
                return (
                  <div
                    key={`${index}-${contentIndex}`}
                    className="whitespace-pre-wrap"
                  >
                    {contentPart.text}
                  </div>
                );
              }
              return null;
            });
          }

          return null;
        })}
      </div>
    </div>
  );
}
