"use client";

import { lazy, Suspense } from "react";
import { ParticleViewport } from "@/components/particles/viewport";

const PrefooterScene = lazy(() => import("./prefooter-scene"));

export default function PrefooterShader() {
  return (
    <ParticleViewport
      className="w-[127px] h-[154px]"
      texture="/x.webp"
      width={176}
      height={212}
      deferred
    >
      {(props) => (
        <Suspense fallback={null}>
          <PrefooterScene {...props} />
        </Suspense>
      )}
    </ParticleViewport>
  );
}
