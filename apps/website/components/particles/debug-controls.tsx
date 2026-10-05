"use client";
import { useEffect } from "react";
import { useControls, folder } from "leva";
import type { ParticleControls } from "./controls";

export default function DebugControls({
  name,
  defaults,
  onChange,
}: {
  name: string;
  defaults: ParticleControls;
  onChange: (controls: ParticleControls) => void;
}) {
  const controls = useControls(name, {
    "Mouse Effect": folder({
      mouseAreaSize: {
        value: 0.26,
        min: 0.05,
        max: 1,
        step: 0.01,
      },
      displacementForce: {
        value: 2.0,
        min: 0,
        max: 10,
        step: 0.1,
      },
    }),
    "Particle Settings": folder({
      particleQuantity: {
        value: defaults.particleQuantity,
        min: 32,
        max: 512,
        step: 32,
      },
      particleSize: {
        value: defaults.particleSize,
        min: 0.01,
        max: 1,
        step: 0.01,
      },
      motionBlurStrength: {
        value: defaults.motionBlurStrength,
        min: 0,
        max: 3,
        step: 0.1,
      },
    }),
    Displacement: folder({
      displacementStrength: {
        value: 2.8,
        min: 0,
        max: 10,
        step: 0.1,
      },
      smoothstepMin: {
        value: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
      },
      smoothstepMax: {
        value: 0.82,
        min: 0,
        max: 1,
        step: 0.01,
      },
    }),
    "Cursor Trail": folder({
      fadeSpeed: {
        value: 0.03,
        min: 0.001,
        max: 0.1,
        step: 0.001,
      },
      glowSizeMultiplier: {
        value: 0.22,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
      speedAlphaMultiplier: {
        value: 0.18,
        min: 0.01,
        max: 0.3,
        step: 0.01,
      },
      cursorSmoothing: {
        value: 0.2,
        min: 0.01,
        max: 0.5,
        step: 0.01,
      },
      cursorLerpStrength: {
        value: 0.24,
        min: 0.01,
        max: 0.3,
        step: 0.01,
      },
    }),
    Advanced: folder({
      canvasResolution: {
        value: 256,
        min: 64,
        max: 512,
        step: 64,
      },
    }),
  });
  useEffect(() => {
    onChange(controls);
  }, [controls, onChange]);
  return null;
}
