"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { FlutedGlassEffect } from "@/components/hero-image/fluted-glass-effect";
import { HeroImageMesh } from "./hero-image-mesh";
import * as THREE from "three";
import heroImage from "@/components/hero-image/image.png";

const GLASS_SEGMENTS = 270;
const GLASS_OPACITY = 0;

export function HeroImage() {
  return (
    <div
      className="w-full -mt-8 sm:-mt-10"
      style={{ height: "clamp(300px, 40vw, 500px)" }}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 75 }}
        shadows={{ type: THREE.PCFSoftShadowMap }}
      >
        <Suspense fallback={null}>
          <HeroImageMesh imageUrl={heroImage.src} />

          <EffectComposer>
            <FlutedGlassEffect
              rotation={90}
              segments={GLASS_SEGMENTS}
              overlayOpacity={GLASS_OPACITY}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
