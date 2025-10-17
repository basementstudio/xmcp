"use client";
import { Canvas } from "@react-three/fiber";
import PrefooterParticlesCursorAnimation from "./prefooter-particles-cursor-animation";

export default function PrefooterShader() {
  return (
    <div className="w-[127px] h-[154px]">
      <Canvas
        camera={{ position: [0, 0, 18], fov: 35 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#000000"]} />
        <PrefooterParticlesCursorAnimation />
      </Canvas>
    </div>
  );
}
