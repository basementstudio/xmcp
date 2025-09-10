import { useState } from "react";
import { ChatStatus } from "@/types/chat";

interface ChatInputProps {
  sendMessage: (message: { text: string }) => void;
  status: ChatStatus;
}

export default function ChatInput({ sendMessage, status }: ChatInputProps) {
  const [input, setInput] = useState("");

  return (
    <div className="flex-shrink-0 border-t border-gray-600 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
        className="flex space-x-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
          placeholder="Type your message..."
          className="flex-1 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={status !== "ready" || !input.trim()}
          className="bg-cyan-600 hover:bg-cyan-800 disabled:bg-cyan-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
