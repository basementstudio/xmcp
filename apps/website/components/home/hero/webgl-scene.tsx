"use client";

import { ParticleCanvas } from "@/components/particles/canvas";
import type { ParticleSceneProps } from "@/components/particles/viewport";
import ParticlesCursorAnimation from "./particles-cursor-animation";

export default function WebGLScene({
  active,
  onReady,
  onError,
}: ParticleSceneProps) {
  return (
    <ParticleCanvas active={active} onError={onError}>
      <ParticlesCursorAnimation onReady={onReady} />
    </ParticleCanvas>
  );
}
