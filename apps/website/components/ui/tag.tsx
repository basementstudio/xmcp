"use client";

import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/dist/ScrambleTextPlugin";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

export const Tag = ({
  text,
  className,
  animate = false,
  ref,
}: {
  text?: string;
  className?: string;
  animate?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const elementRef = ref || internalRef;

  useGSAP(() => {
    if (
      !animate ||
      !text ||
      !elementRef ||
      !("current" in elementRef) ||
      !elementRef.current
    )
      return;

    const element = elementRef.current;

    gsap.set(element, { autoAlpha: 0 });

    gsap.to(element, {
      duration: 0.6,
      autoAlpha: 1,
      scrambleText: {
        text: text,
        chars: "XMCP",
        revealDelay: 0.5,
        speed: 0.3,
      },
      scrollTrigger: {
        trigger: element,
        start: "top 80%",
        once: true,
      },
    });
  }, [animate, text]);

  return (
    <div
      ref={elementRef}
      className={cn(
        "py-1 px-2 bg-brand-neutral-600 text-[0.625rem] uppercase border border-dashed border-brand-neutral-400 text-brand-neutral-100 overflow-clip whitespace-nowrap font-mono",
        animate && "invisible",
        className
      )}
    >
      {text}
    </div>
  );
};
