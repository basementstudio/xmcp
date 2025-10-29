"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AskAIDialog } from "./ask-dialog";

interface AskAIContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AskAIContext = createContext<AskAIContextType | null>(null);

export function useAskAI() {
  const context = useContext(AskAIContext);
  if (!context) {
    throw new Error("useAskAI must be used within AskAIProvider");
  }
  return context;
}

export function AskAIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AskAIContext.Provider value={{ open, setOpen }}>
      {children}
      <AskAIDialog open={open} onOpenChange={setOpen} />
    </AskAIContext.Provider>
  );
}
