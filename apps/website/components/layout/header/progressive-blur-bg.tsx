"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./progressive-blur.module.css";

gsap.registerPlugin(ScrollTrigger);

export function ProgressiveBlurBackground() {
  const progressiveBlurRef = useRef<HTMLDivElement>(null);
  const solidBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const progressiveBlurEl = progressiveBlurRef.current;
    const solidBgEl = solidBgRef.current;

    if (!progressiveBlurEl || !solidBgEl) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 769px)", () => {
      gsap.set(progressiveBlurEl, { opacity: 0 });
      gsap.set(solidBgEl, { opacity: 1 });

      const tl = gsap.timeline({
        defaults: {
          duration: 0.4,
          ease: "power2.inOut",
        },
        delay: 0.4, // wait some time for the header in anim
        scrollTrigger: {
          trigger: "body",
          start: "top top-=20px",
          end: "+=0",
          toggleActions: "play none none reverse",
        },
      });

      tl.to(
        progressiveBlurEl,
        {
          opacity: 1,
        },
        0
      );

      tl.to(
        solidBgEl,
        {
          opacity: 0,
        },
        ">-0.15"
      );

      return () => {
        tl.kill();
      };
    });

    return () => {
      mm.kill();
    };
  }, []);

  return (
    <>
      <div ref={progressiveBlurRef} className={styles.progressiveBlur}>
        <div />
        <div />
        <div />
      </div>
      <div
        ref={solidBgRef}
        className="bg-brand-black absolute inset-0 w-full h-[calc(100%+1px)] border-b border-brand-neutral-600"
      />
    </>
  );
}
