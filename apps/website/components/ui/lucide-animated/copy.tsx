"use client";

// Adapted from pqoqubbw/icons; see README.md and LICENSE in this directory.

import type { Transition } from "framer-motion";
import { motion, useAnimation } from "framer-motion";
import type { Ref, SVGAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/cn";

export interface CopyIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
  resetAnimation: () => void;
}

interface CopyIconProps extends SVGAttributes<SVGSVGElement> {
  size?: number;
  svgRef?: Ref<SVGSVGElement>;
}

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 160,
  damping: 17,
  mass: 1,
};

const CopyIcon = forwardRef<CopyIconHandle, CopyIconProps>(
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
        <motion.rect
          animate={controls}
          height="14"
          rx="2"
          ry="2"
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: { translateY: 0, translateX: 0 },
            animate: { translateY: -3, translateX: -3 },
          }}
          width="14"
          x="8"
          y="8"
        />
        <motion.path
          animate={controls}
          d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: { x: 0, y: 0 },
            animate: { x: 3, y: 3 },
          }}
        />
      </svg>
    );
  }
);

CopyIcon.displayName = "CopyIcon";

export { CopyIcon };
