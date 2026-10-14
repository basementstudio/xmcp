"use client";

import { lazy, Suspense, useCallback, useState } from "react";
import {
  ParticleViewport,
  type ParticleSceneProps,
} from "@/components/particles/viewport";
import WebGPUCanvas from "./webgpu-canvas";

const WebGLScene = lazy(() => import("./webgl-scene"));

function HeroScene(props: ParticleSceneProps) {
  const [fallback, setFallback] = useState(false);
  const useFallback = useCallback(() => setFallback(true), []);
  return fallback ? (
    <Suspense fallback={null}>
      <WebGLScene {...props} />
    </Suspense>
  ) : (
    <WebGPUCanvas {...props} onError={useFallback} />
  );
}

export default function HeroParticles({ active }: { active: boolean }) {
  return (
    <>
      {/* Both renderers and the fallback artwork are monochrome. Inverting the
          finished scene preserves their identical additive glow in light mode,
          and changes theme without rebuilding GPU resources or cursor state. */}
      <div className="hero-particles">
        <ParticleViewport
          className="hero-scene-size"
          texture="/xmcp.webp"
          width={850}
          height={742}
        >
          {(props) => <HeroScene {...props} active={active && props.active} />}
        </ParticleViewport>
      </div>
    </>
  );
}
