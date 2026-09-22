"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { ParticleSceneProps } from "@/components/particles/viewport";
import { HERO_CONTROLS } from "@/components/particles/controls";
import { createHeroRenderer } from "./webgpu-renderer";

const DebugControls = lazy(
  () => import("@/components/particles/debug-controls")
);

export default function WebGPUCanvas({
  active,
  onReady,
  onError,
}: ParticleSceneProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createHeroRenderer> | null>(null);
  const [controls, setControls] = useState(HERO_CONTROLS);
  const debug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debug");

  useEffect(() => {
    const instance = createHeroRenderer(
      canvas.current!,
      false,
      onReady,
      onError
    );
    renderer.current = instance;
    return () => {
      instance.dispose();
      renderer.current = null;
    };
  }, [onReady, onError]);

  useEffect(() => {
    renderer.current?.setActive(active);
  }, [active]);
  useEffect(() => {
    renderer.current?.setControls(controls);
  }, [controls]);

  return (
    <>
      <canvas
        ref={canvas}
        data-renderer="webgpu"
        className="absolute inset-0 h-full w-full"
      />
      {debug && (
        <Suspense fallback={null}>
          <DebugControls
            name="hero"
            defaults={HERO_CONTROLS}
            onChange={setControls}
          />
        </Suspense>
      )}
    </>
  );
}
