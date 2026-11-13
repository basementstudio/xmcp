"use client";

// Original motion for the existing Lucide glyphs. Artwork: lucide-react 0.544.0;
// see lucide.LICENSE. Keep these separate from the vendored Lucide Animated set.

import { motion, useAnimation, type Variants } from "framer-motion";
import type { ReactNode, Ref, SVGAttributes } from "react";
import { forwardRef, useImperativeHandle } from "react";

import type { IconAnimation } from "./icon-interaction";

interface IconProps extends SVGAttributes<SVGSVGElement> {
  size?: number;
  svgRef?: Ref<SVGSVGElement>;
}

const TRANSITION = { duration: 0.45, ease: "easeInOut" } as const;
const DRAW: Variants = {
  normal: { pathLength: 1, opacity: 1 },
  animate: (index = 0) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: { ...TRANSITION, delay: index * 0.04 },
  }),
};

// Share the same imperative contract as the vendored icons. The siteIcon
// wrapper owns all interaction so reduced motion and keyboard behavior agree.
function docsIcon(
  name: string,
  render: (controls: ReturnType<typeof useAnimation>) => ReactNode
) {
  const Icon = forwardRef<IconAnimation, IconProps>(
    ({ size = 15, svgRef, ...props }, ref) => {
      const controls = useAnimation();
      useImperativeHandle(ref, () => ({
        startAnimation: () => {
          void controls.start("animate");
        },
        stopAnimation: () => {
          controls.stop();
          void controls.start("normal");
        },
        resetAnimation: () => {
          controls.stop();
          controls.set("normal");
        },
      }));

      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
          ref={svgRef}
        >
          {render(controls)}
        </svg>
      );
    }
  );
  Icon.displayName = name;
  return Icon;
}

export const ActivityIcon = docsIcon("ActivityIcon", (controls) => (
  <motion.path
    d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
    initial="normal"
    animate={controls}
    variants={DRAW}
  />
));

export const AppWindowIcon = docsIcon("AppWindowIcon", (controls) => (
  <>
    <motion.rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="2"
      initial="normal"
      animate={controls}
      variants={DRAW}
    />
    <motion.g
      initial="normal"
      animate={controls}
      variants={{ normal: { opacity: 1 }, animate: { opacity: [0.4, 1] } }}
      transition={TRANSITION}
    >
      <path d="M10 4v4" />
      <path d="M2 8h20" />
      <path d="M6 4v4" />
    </motion.g>
  </>
));

export const FileInputIcon = docsIcon("FileInputIcon", (controls) => (
  <>
    <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <motion.g
      initial="normal"
      animate={controls}
      variants={{ normal: { x: 0 }, animate: { x: [0, 2, 0] } }}
      transition={TRANSITION}
    >
      <path d="M2 15h10" />
      <path d="m9 18 3-3-3-3" />
    </motion.g>
  </>
));

const FINGERPRINT_PATHS = [
  "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",
  "M14 13.12c0 2.38 0 6.38-1 8.88",
  "M17.29 21.02c.12-.6.43-2.3.5-3.02",
  "M2 12a10 10 0 0 1 18-6",
  "M2 16h.01",
  "M21.8 16c.2-2 .131-5.354 0-6",
  "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",
  "M8.65 22c.21-.66.45-1.32.57-2",
  "M9 6.8a6 6 0 0 1 9 5.2v2",
];

export const FingerprintIcon = docsIcon("FingerprintIcon", (controls) => (
  <>
    {FINGERPRINT_PATHS.map((d, index) => (
      <motion.path
        key={d}
        d={d}
        initial="normal"
        animate={controls}
        variants={DRAW}
        custom={index}
      />
    ))}
  </>
));

export const InfoIcon = docsIcon("InfoIcon", (controls) => (
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <motion.path
      d="M12 8h.01"
      initial="normal"
      animate={controls}
      variants={{
        normal: { strokeWidth: 2 },
        animate: { strokeWidth: [2, 3.5, 2] },
      }}
      transition={TRANSITION}
    />
  </>
));

export const KeyRoundIcon = docsIcon("KeyRoundIcon", (controls) => (
  <motion.g
    initial="normal"
    animate={controls}
    variants={{ normal: { rotate: 0 }, animate: { rotate: [0, -6, 0] } }}
    transition={TRANSITION}
    style={{ transformOrigin: "12px 12px" }}
  >
    <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
    <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
  </motion.g>
));

export const ScanLineIcon = docsIcon("ScanLineIcon", (controls) => (
  <>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <motion.path
      d="M7 12h10"
      initial="normal"
      animate={controls}
      variants={{ normal: { y: 0 }, animate: { y: [0, -4, 4, 0] } }}
      transition={{ ...TRANSITION, duration: 0.6 }}
    />
  </>
));
