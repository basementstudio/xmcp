"use client";

// Adapted from pqoqubbw/icons; see README.md and LICENSE in this directory.

import { motion, useAnimation, type Variants } from "framer-motion";
import type { Ref, SVGAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/cn";

export interface UsersRoundIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
  resetAnimation: () => void;
}

interface UsersRoundIconProps extends SVGAttributes<SVGSVGElement> {
  size?: number;
  svgRef?: Ref<SVGSVGElement>;
}

const PATH_VARIANTS: Variants = {
  normal: {
    translateX: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 13,
    },
  },
  animate: {
    translateX: [-4, 0],
    opacity: [0, 1],
    transition: {
      delay: 0.1,
      type: "spring",
      stiffness: 200,
      damping: 13,
    },
  },
};

const UsersRoundIcon = forwardRef<UsersRoundIconHandle, UsersRoundIconProps>(
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
        <path d="M18 21a8 8 0 0 0-16 0" />
        <circle cx="10" cy="8" r="5" />
        <motion.path
          animate={controls}
          d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"
          initial="normal"
          variants={PATH_VARIANTS}
        />
      </svg>
    );
  }
);

UsersRoundIcon.displayName = "UsersRoundIcon";

export { UsersRoundIcon };
