"use client";

// Adapted from pqoqubbw/icons; see README.md and LICENSE in this directory.

import type { Variants } from "framer-motion";
import { motion, useAnimation } from "framer-motion";
import type { Ref, SVGAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/cn";

export interface ChartNoAxesColumnIncreasingIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
  resetAnimation: () => void;
}

interface ChartNoAxesColumnIncreasingIconProps extends SVGAttributes<SVGSVGElement> {
  size?: number;
  svgRef?: Ref<SVGSVGElement>;
}

const LINE_VARIANTS: Variants = {
  visible: { pathLength: 1, opacity: 1 },
  hidden: { pathLength: 0, opacity: 0 },
};

const ChartNoAxesColumnIncreasingIcon = forwardRef<
  ChartNoAxesColumnIncreasingIconHandle,
  ChartNoAxesColumnIncreasingIconProps
>(
  (
    { onMouseEnter, onMouseLeave, className, size = 15, svgRef, ...props },
    ref
  ) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);
    const animationVersion = useRef(0);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        resetAnimation: () => {
          ++animationVersion.current;
          controls.stop();
          controls.set("visible");
        },
        startAnimation: async () => {
          const version = ++animationVersion.current;
          await controls.start((i) => ({
            pathLength: 0,
            opacity: 0,
            transition: { delay: i * 0.1, duration: 0.3 },
          }));
          if (version !== animationVersion.current) return;
          await controls.start((i) => ({
            pathLength: 1,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.3 },
          }));
        },
        stopAnimation: () => {
          ++animationVersion.current;
          return controls.start("visible");
        },
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<SVGSVGElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          await controls.start((i) => ({
            pathLength: 0,
            opacity: 0,
            transition: { delay: i * 0.1, duration: 0.3 },
          }));
          await controls.start((i) => ({
            pathLength: 1,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.3 },
          }));
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<SVGSVGElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("visible");
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
          custom={0}
          d="M6 20v-4"
          initial="visible"
          variants={LINE_VARIANTS}
        />
        <motion.path
          animate={controls}
          custom={1}
          d="M12 20v-10"
          initial="visible"
          variants={LINE_VARIANTS}
        />
        <motion.path
          animate={controls}
          custom={2}
          d="M18 20v-16"
          initial="visible"
          variants={LINE_VARIANTS}
        />
      </svg>
    );
  }
);

ChartNoAxesColumnIncreasingIcon.displayName = "ChartNoAxesColumnIncreasingIcon";

export { ChartNoAxesColumnIncreasingIcon };
