"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, type ReactNode } from "react";
import type { ParticleSceneProps } from "./viewport";

const CONTEXT_OPTIONS: WebGLContextAttributes = {
  antialias: true,
  alpha: false,
  depth: true,
  stencil: false,
  powerPreference: "high-performance",
  // Disabling preservation caused surrounding text/buttons to disappear in
  // Chromium visual checks. Recheck visual output before changing this.
  preserveDrawingBuffer: true,
};

function checkContext(canvas: HTMLCanvasElement | null) {
  // Check the actual canvas synchronously so our error boundary can handle
  // unavailable WebGL. Fiber initializes its renderer asynchronously; Three
  // reuses this same context, without allocating a second GPU context.
  if (canvas && !canvas.getContext("webgl2", CONTEXT_OPTIONS)) {
    throw new Error("WebGL2 is unavailable");
  }
}

function ContextLoss({ onError }: Pick<ParticleSceneProps, "onError">) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", onError);
    return () => canvas.removeEventListener("webglcontextlost", onError);
  }, [gl, onError]);
  return null;
}

export function ParticleCanvas({
  active,
  onError,
  children,
}: Omit<ParticleSceneProps, "onReady"> & { children: ReactNode }) {
  return (
    <Canvas
      ref={checkContext}
      camera={{ position: [0, 0, 18], fov: 35 }}
      gl={CONTEXT_OPTIONS}
      frameloop={active ? "always" : "never"}
    >
      <color attach="background" args={["#000000"]} />
      <ContextLoss onError={onError} />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
