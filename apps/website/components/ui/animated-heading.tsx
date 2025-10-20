"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/utils/cn";

interface AnimatedHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  delay?: number;
  duration?: number;
}

export function AnimatedHeading({
  children,
  className,
  as: Component = "h1",

  delay = 0,
  duration = 6,
}: AnimatedHeadingProps) {
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;

    const timeline = gsap.timeline({
      delay,
      repeat: -1,
      ease: "none",
    });

    timeline.to(element, {
      backgroundPosition: "250% 0%",
      duration: duration,
      ease: "none",
    });

    return () => {
      timeline.kill();
    };
  }, [delay, duration]);

  return (
    <Component
      ref={textRef}
      className={cn("relative text-gradient", className)}
    >
      {children}
    </Component>
  );
}
