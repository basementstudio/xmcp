"use client";

// Adapted from pqoqubbw/icons; see README.md and LICENSE in this directory.

import type { Transition, Variants } from "framer-motion";
import { motion, useAnimation } from "framer-motion";
import type { Ref, SVGAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/cn";

export interface ClockIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
  resetAnimation: () => void;
}

interface ClockIconProps extends SVGAttributes<SVGSVGElement> {
  size?: number;
  svgRef?: Ref<SVGSVGElement>;
}

const HAND_TRANSITION: Transition = {
  duration: 0.6,
  ease: [0.4, 0, 0.2, 1],
};

const HAND_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    originX: "0%",
    originY: "100%",
  },
  animate: {
    rotate: 360,
    originX: "0%",
    originY: "100%",
  },
};

const MINUTE_HAND_TRANSITION: Transition = {
  duration: 0.5,
  ease: "easeInOut",
};

const MINUTE_HAND_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    originX: "0%",
    originY: "100%",
  },
  animate: {
    rotate: 45,
    originX: "0%",
    originY: "100%",
  },
};

const ClockIcon = forwardRef<ClockIconHandle, ClockIconProps>(
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
        <circle cx="12" cy="12" r="10" />
        <motion.line
          animate={controls}
          initial="normal"
          transition={HAND_TRANSITION}
          variants={HAND_VARIANTS}
          x1="12"
          x2="12"
          y1="12"
          y2="6"
        />
        <motion.line
          animate={controls}
          initial="normal"
          transition={MINUTE_HAND_TRANSITION}
          variants={MINUTE_HAND_VARIANTS}
          x1="12"
          x2="16"
          y1="12"
          y2="12"
        />
      </svg>
    );
  }
);

ClockIcon.displayName = "ClockIcon";

export { ClockIcon };
