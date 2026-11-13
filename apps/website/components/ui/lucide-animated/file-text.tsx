"use client";

// Adapted from pqoqubbw/icons; see README.md and LICENSE in this directory.

import type { SVGMotionProps } from "framer-motion";
import { motion, useAnimation } from "framer-motion";
import type React from "react";
import type { Ref, SVGAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/cn";

export interface FileTextIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
  resetAnimation: () => void;
}

interface FileTextIconProps extends SVGAttributes<SVGSVGElement> {
  size?: number;
  svgRef?: Ref<SVGSVGElement>;
}

const FILE_TEXT = forwardRef<FileTextIconHandle, FileTextIconProps>(
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
      <motion.svg
        ref={svgRef}
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...(props as SVGMotionProps<SVGSVGElement>)}
        animate={controls}
        fill="none"
        height={size}
        initial="normal"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        variants={{
          normal: { scale: 1 },
          animate: {
            scale: 1.05,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
        }}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />

        <motion.path
          d="M10 9H8"
          stroke="currentColor"
          strokeWidth="2"
          variants={{
            normal: {
              pathLength: 1,
              x1: 8,
              x2: 10,
            },
            animate: {
              pathLength: [1, 0, 1],
              x1: [8, 10, 8],
              x2: [10, 10, 10],
              transition: {
                duration: 0.7,
                delay: 0.3,
              },
            },
          }}
        />
        <motion.path
          d="M16 13H8"
          stroke="currentColor"
          strokeWidth="2"
          variants={{
            normal: {
              pathLength: 1,
              x1: 8,
              x2: 16,
            },
            animate: {
              pathLength: [1, 0, 1],
              x1: [8, 16, 8],
              x2: [16, 16, 16],
              transition: {
                duration: 0.7,
                delay: 0.5,
              },
            },
          }}
        />
        <motion.path
          d="M16 17H8"
          stroke="currentColor"
          strokeWidth="2"
          variants={{
            normal: {
              pathLength: 1,
              x1: 8,
              x2: 16,
            },
            animate: {
              pathLength: [1, 0, 1],
              x1: [8, 16, 8],
              x2: [16, 16, 16],
              transition: {
                duration: 0.7,
                delay: 0.7,
              },
            },
          }}
        />
      </motion.svg>
    );
  }
);

FILE_TEXT.displayName = "FileTextIcon";

export { FILE_TEXT as FileTextIcon };
