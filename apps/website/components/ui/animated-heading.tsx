"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { cn } from "@/utils/cn";
import CustomEase from "gsap/dist/CustomEase";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  delay?: number;
  duration?: number;
  effectDuration?: number;
  masked?: boolean;
  fromY?: number;
}

CustomEase.create("customBezier", "M0,0 C0.126,0.382 0.264,1 1,1 ");

export function AnimatedHeading({
  children,
  className,
  as: Component = "h1",
  delay = 0,
  duration = 6,
  effectDuration = 3,
  fromY = 20,
  masked = false,
}: AnimatedHeadingProps) {
  const textRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (!textRef.current) return;

    const element = textRef.current;

    const initTl = gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start: "top 80%",
        end: "top 60%",
        toggleActions: "play none none none",
      },
    });

    const timeline = gsap.timeline({
      delay,
      repeat: -1,
      ease: "none",
    });

    if (masked) {
      initTl.set(element, {
        maskImage:
          "radial-gradient(circle at center, black 0%, transparent 0%)",
        maskRepeat: "no-repeat",
        maskPosition: "center center",
        WebkitMaskImage:
          "radial-gradient(circle at center, black 0%, transparent 0%)",
      });

      // mask
      initTl.to(element, {
        autoAlpha: 1,
        duration: effectDuration / 3,
        ease: "power2.out",
      });

      initTl.to(
        element,
        {
          maskImage:
            "radial-gradient(circle at center, black 70%, transparent 350%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 70%, transparent 350%)",
          duration: effectDuration,
          ease: "customBezier",
        },
        "<"
      );

      initTl.set(
        element,
        {
          filter: "none",
          maskImage: "none",
          WebkitMaskImage: "none",
        },
        ">"
      );
    } else {
      initTl.set(element, {
        y: fromY,
      });

      initTl.to(element, {
        autoAlpha: 1,
        y: 0,
        duration: effectDuration / 3,
        ease: "power2.out",
      });

      initTl.set(
        element,
        {
          filter: "none",
        },
        ">"
      );
    }

    // continued bg anim
    timeline.to(
      element,
      {
        backgroundPosition: "250% 0%",
        duration: duration,
        ease: "none",
      },
      2
    );
  }, [delay, duration]);

  return (
    <Component
      ref={textRef}
      className={cn("relative text-gradient invisible", className)}
    >
      {children}
    </Component>
  );
}
