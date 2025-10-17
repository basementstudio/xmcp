"use client";
import { Canvas } from "@react-three/fiber";
import ParticlesCursorAnimation from "./particles-cursor-animation";

export default function Shader() {
  return (
    <main className="w-full aspect-square max-h-[250px] sm:max-h-[350px] md:max-h-[450px] lg:max-h-[500px]">
      <Canvas
        camera={{ position: [0, 0, 18], fov: 35 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#000000"]} />
        <ParticlesCursorAnimation />
      </Canvas>
    </main>
  );
}
