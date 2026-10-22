"use client";

// Adapted from pqoqubbw/icons; see README.md and LICENSE in this directory.

import type { Variants } from "framer-motion";
import { motion, useAnimation } from "framer-motion";
import type { Ref, SVGAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/cn";

export interface SquareStackIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
  resetAnimation: () => void;
}

interface SquareStackIconProps extends SVGAttributes<SVGSVGElement> {
  size?: number;
  svgRef?: Ref<SVGSVGElement>;
}

const RECT_VARIANTS: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 0.8, 1],
    transition: { duration: 0.4 },
  },
};

const PATH_VARIANTS: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 0.9, 1],
  },
};

const SquareStackIcon = forwardRef<SquareStackIconHandle, SquareStackIconProps>(
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
        <motion.path
          animate={controls}
          d="M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2"
          transition={{
            delay: 0.3,
            duration: 0.4,
          }}
          variants={PATH_VARIANTS}
        />
        <motion.path
          animate={controls}
          d="M10 16c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2"
          transition={{
            delay: 0.2,
            duration: 0.2,
          }}
          variants={PATH_VARIANTS}
        />
        <motion.rect
          animate={controls}
          height="8"
          rx="2"
          variants={RECT_VARIANTS}
          width="8"
          x="14"
          y="14"
        />
      </svg>
    );
  }
);

SquareStackIcon.displayName = "SquareStackIcon";

export { SquareStackIcon };
