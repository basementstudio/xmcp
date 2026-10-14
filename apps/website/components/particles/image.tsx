"use client";

import { lazy, Suspense } from "react";
import { ParticleViewport } from "./viewport";

const ImageScene = lazy(() => import("./image-scene"));

export default function ParticleImage({
  src,
  width,
  height,
  className,
}: {
  src: string;
  width: number;
  height: number;
  className: string;
}) {
  return (
    <ParticleViewport
      className={className}
      texture={src}
      width={width}
      height={height}
      deferred
    >
      {(props) => (
        <Suspense fallback={null}>
          <ImageScene {...props} texture={src} />
        </Suspense>
      )}
    </ParticleViewport>
  );
}
