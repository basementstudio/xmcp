"use client";
import { useEffect, useState } from "react";

function BlinkingCursor({ isVisible }: { isVisible: boolean }) {
  const [isBlinking, setIsBlinking] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`inline-block text-white ${
        isVisible && isBlinking ? "opacity-100" : "opacity-0"
      }`}
    >
      ▐
    </span>
  );
}

function SolidCursor() {
  return <span className="inline-block text-white">▐</span>;
}

function TypewriterText({
  text,
  className,
  initialDelay = 0,
  delay = 0,
  speed = 25,
  onComplete,
  showCursor = true,
}: {
  text: string;
  className?: string;
  initialDelay?: number;
  delay?: number;
  speed?: number;
  onComplete?: () => void;
  showCursor?: boolean;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBlinkingCursor, setShowBlinkingCursor] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(initialDelay === 0);

  useEffect(() => {
    if (!started) return;

    const startTimer = setTimeout(() => {
      setShowBlinkingCursor(true);
      setIsTyping(true);

      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          setDisplayedText(text.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        }, speed);
        return () => clearTimeout(timer);
      } else if (currentIndex === text.length && onComplete) {
        setIsTyping(false);
        onComplete();
      }
    }, delay);

    return () => clearTimeout(startTimer);
  }, [currentIndex, text, delay, speed, onComplete, started]);

  useEffect(() => {
    if (initialDelay === 0) {
      return;
    }

    const init = setTimeout(() => {
      setStarted(true);
    }, initialDelay);

    return () => clearTimeout(init);
  }, [initialDelay]);

  return (
    <span className={className}>
      {displayedText}
      {showBlinkingCursor && showCursor && isTyping && <SolidCursor />}
    </span>
  );
}

export default function TypingEffect({
  children,
  initialDelay = 0,
}: {
  children: string;
  initialDelay?: number;
}) {
  const [isComplete, setIsComplete] = useState(false);

  return (
    <div className="text-left flex items-center py-2">
      <span className="text-white mr-2 select-none font-bold">⊹</span>
      <TypewriterText
        text={children}
        className="text-white"
        speed={80}
        initialDelay={initialDelay}
        onComplete={() => setIsComplete(true)}
      />
      <div className="inline-block w-1.5">
        <BlinkingCursor isVisible={isComplete} />
      </div>
    </div>
  );
}
