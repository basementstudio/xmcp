"use client";

import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./shaders";

const ANIMATION_SPEED = 0.5;
const FREQUENCY_AMPLITUDE = 0.07;
const FREQUENCY_SPEED = 1.5;
const CONTRAST_POWER = 2.5;
const BRIGHTNESS = 3.5;
const BLACK_THRESHOLD = 0.2;
const ROTATION_Y = Math.PI * 2;
const SCALE_SIZE = 1;

interface HeroImageMeshProps {
  imageUrl: string;
}

export function HeroImageMesh({ imageUrl }: HeroImageMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  // Calculate aspect ratio from the texture
  const aspectRatio = texture.image.width / texture.image.height;
  const width = aspectRatio >= 1 ? 4 : 4 * aspectRatio;
  const height = aspectRatio >= 1 ? 4 / aspectRatio : 4;

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      imageTexture: { value: texture },
      frequencyAmplitude: { value: FREQUENCY_AMPLITUDE },
      frequencySpeed: { value: FREQUENCY_SPEED },
      contrastPower: { value: CONTRAST_POWER },
      brightness: { value: BRIGHTNESS },
      blackThreshold: { value: BLACK_THRESHOLD },
    }),
    [texture]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value =
        state.clock.elapsedTime * ANIMATION_SPEED;
      materialRef.current.uniforms.frequencyAmplitude.value =
        FREQUENCY_AMPLITUDE;
      materialRef.current.uniforms.frequencySpeed.value = FREQUENCY_SPEED;
      materialRef.current.uniforms.contrastPower.value = CONTRAST_POWER;
      materialRef.current.uniforms.brightness.value = BRIGHTNESS;
      materialRef.current.uniforms.blackThreshold.value = BLACK_THRESHOLD;
    }
  });

  return (
    <mesh
      scale={[SCALE_SIZE, SCALE_SIZE, SCALE_SIZE]}
      rotation={[0, ROTATION_Y, 0]}
    >
      <planeGeometry args={[width, height, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
