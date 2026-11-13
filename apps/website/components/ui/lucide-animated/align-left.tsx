"use client";

// Adapted from pqoqubbw/icons; see README.md and LICENSE in this directory.

import type { Transition } from "framer-motion";
import { motion, useAnimation } from "framer-motion";
import type { Ref, SVGAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/cn";

export interface AlignLeftIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
  resetAnimation: () => void;
}

interface AlignLeftIconProps extends SVGAttributes<SVGSVGElement> {
  size?: number;
  svgRef?: Ref<SVGSVGElement>;
}

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 150,
  damping: 15,
  mass: 0.3,
};

const AlignLeftIcon = forwardRef<AlignLeftIconHandle, AlignLeftIconProps>(
  (
    { onMouseEnter, onMouseLeave, className, size = 15, svgRef, ...props },
    ref
  ) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        resetAnimation: () => {
          controls.stop();
          controls.set("normal");
        },
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<SVGSVGElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<SVGSVGElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <svg
        ref={svgRef}
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.line
          animate={controls}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: { x2: 21 },
            animate: { x2: 21 },
          }}
          x1="3"
          x2="21"
          y1="6"
          y2="6"
        />

        <motion.line
          animate={controls}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: { x2: 15 },
            animate: { x2: 19 },
          }}
          x1="3"
          x2="15"
          y1="12"
          y2="12"
        />

        <motion.line
          animate={controls}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: { x2: 17 },
            animate: { x2: 12 },
          }}
          x1="3"
          x2="17"
          y1="18"
          y2="18"
        />
      </svg>
    );
  }
);

AlignLeftIcon.displayName = "AlignLeftIcon";

export { AlignLeftIcon };
