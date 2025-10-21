"use client";

import { cn } from "../../utils/cn";
import styles from "./terminal.module.css";
import TypingEffect from "./typing-effect";
import { useEffect, useState } from "react";
import { CopyButton } from "../ui/copy-button";

function TerminalContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(styles.container, "p-1 relative group", className)}>
      <div className="p-1 px-2 bg-black border border-gray-400">{children}</div>
      <div className="pointer-none absolute -top-1 left-4 flex gap-1.5 [&>div]:w-2 [&>div]:h-4 [&>div]:bg-black">
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}

export function Terminal({
  children,
  initialDelay = 0,
  className,
}: {
  children: string;
  initialDelay?: number;
  className?: string;
}) {
  const [codeText, setCodeText] = useState("");

  useEffect(() => {
    setCodeText(children);
  }, [children]);

  return (
    <TerminalContainer className={className}>
      <div>
        <TypingEffect initialDelay={initialDelay}>{children}</TypingEffect>
      </div>
      <CopyButton
        text={codeText}
        className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      />
    </TerminalContainer>
  );
}
