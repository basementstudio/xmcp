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

export default function Shader() {
  return (
    <ParticleViewport
      className="w-full aspect-square max-h-[250px] sm:max-h-[350px] md:max-h-[450px] lg:max-h-[500px]"
      texture="/xmcp.webp"
      width={850}
      height={742}
      showLoadingArtwork={false}
    >
      {(props) => <HeroScene {...props} />}
    </ParticleViewport>
  );
}
