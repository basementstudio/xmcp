"use client";

import PrefooterParticlesCursorAnimation from "./prefooter-particles-cursor-animation";
import { ParticleCanvas } from "@/components/particles/canvas";
import type { ParticleSceneProps } from "@/components/particles/viewport";

export default function PrefooterScene({
  active,
  onReady,
  onError,
}: ParticleSceneProps) {
  return (
    <ParticleCanvas active={active} onError={onError}>
      <PrefooterParticlesCursorAnimation onReady={onReady} />
    </ParticleCanvas>
  );
}
