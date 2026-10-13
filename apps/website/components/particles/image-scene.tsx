"use client";

import ImageParticles from "./image-particles";
import { ParticleCanvas } from "@/components/particles/canvas";
import type { ParticleSceneProps } from "@/components/particles/viewport";

export default function ImageScene({
  active,
  onReady,
  onError,
  texture,
}: ParticleSceneProps & { texture: string }) {
  return (
    <ParticleCanvas active={active} onError={onError}>
      <ImageParticles onReady={onReady} texture={texture} />
    </ParticleCanvas>
  );
}
