"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { RefObject } from "react";

gsap.registerPlugin(ScrollTrigger);

interface UseFadeInOptions {
  refs: RefObject<HTMLElement | null>[];
  stagger?: number;
  duration?: number;
  yOffset?: number;
  delay?: number;
  ease?: string;
  trigger?: HTMLElement | string;
  start?: string;
  end?: string;
}

export function useFadeIn({
  refs,
  stagger = 0.1,
  duration = 0.6,
  yOffset = 30,
  delay = 0,
  ease = "sine.out",
  trigger,
  start = "top 80%",
  end = "top 40%",
}: UseFadeInOptions) {
  useGSAP(() => {
    const elements = refs
      .map((ref) => ref.current)
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger || elements[0],
        start,
        toggleActions: "play none none none",
      },
      delay,
    });

    // stagger
    tl.from(elements, {
      autoAlpha: 0,
      y: yOffset,
      duration,
      ease,
      stagger,
      // Round values to prevent subpixel rendering
    });
  }, [refs, stagger, duration, yOffset, delay, ease, trigger, start, end]);
}
