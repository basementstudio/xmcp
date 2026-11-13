"use client";

import { lazy, Suspense, type ReactNode } from "react";
import { ParticleViewport } from "./viewport";
import {
  CARD_DUST_CONTROLS,
  BLOG_DUST_CONTROLS,
  FOOTER_DUST_CONTROLS,
  type DustControls,
} from "./dust";

const DustScene = lazy(() => import("./dust-scene"));

const PRESETS = {
  card: CARD_DUST_CONTROLS,
  footer: FOOTER_DUST_CONTROLS,
  blog: BLOG_DUST_CONTROLS,
} satisfies Record<string, DustControls>;

export default function ParticleImage({
  src,
  width,
  height,
  className,
  preset = "card",
  fallback,
  fadeIn = false,
  prepare = false,
}: {
  src: string;
  width: number;
  height: number;
  className: string;
  preset?: keyof typeof PRESETS;
  fallback?: ReactNode;
  fadeIn?: boolean;
  prepare?: boolean;
}) {
  return (
    <ParticleViewport
      className={className}
      texture={src}
      width={width}
      height={height}
      deferred
      fallback={fallback}
      fadeIn={fadeIn}
      prepare={prepare}
    >
      {(props) => (
        <Suspense fallback={null}>
          <DustScene
            {...props}
            picture={src}
            name={preset}
            defaults={PRESETS[preset]}
          />
        </Suspense>
      )}
    </ParticleViewport>
  );
}
