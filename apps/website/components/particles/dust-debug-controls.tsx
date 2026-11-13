"use client";
import { useEffect } from "react";
import { useControls, folder } from "leva";
import type { DustControls } from "./dust";

export default function DustDebugControls({
  name,
  defaults: d,
  onChange,
}: {
  name: string;
  defaults: DustControls;
  onChange: (controls: DustControls) => void;
}) {
  const controls = useControls(name, {
    Shape: folder({
      rows: { value: d.rows, min: 8, max: 240, step: 1 },
      segments: { value: d.segments, min: 16, max: 320, step: 1 },
      twist: { value: d.twist, min: 0, max: 20, step: 0.1 },
    }),
    Motion: folder({
      speed: { value: d.speed, min: 0, max: 4, step: 0.05 },
    }),
    Look: folder({
      size: { value: d.size, min: 0.25, max: 4, step: 0.05 },
      density: { value: d.density, min: 0, max: 1, step: 0.01 },
      dash: { value: d.dash, min: 0.1, max: 3, step: 0.05 },
      brightness: { value: d.brightness, min: 0, max: 3, step: 0.05 },
      vignette: { value: d.vignette, min: 0, max: 1, step: 0.01 },
    }),
    Mouse: folder({
      mouseRadius: { value: d.mouseRadius, min: 0, max: 0.6, step: 0.01 },
      mouseForce: { value: d.mouseForce, min: 0, max: 3, step: 0.05 },
    }),
  });
  useEffect(() => {
    onChange(controls);
  }, [controls, onChange]);
  return null;
}
