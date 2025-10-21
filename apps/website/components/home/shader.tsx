"use client";
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import ParticlesCursorAnimation from "./particles-cursor-animation";
import { cn } from "@/lib/utils";

export default function Shader() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <main className="w-full aspect-square max-h-[250px] sm:max-h-[350px] md:max-h-[450px] lg:max-h-[500px]">
      <Canvas
        camera={{ position: [0, 0, 18], fov: 35 }}
        gl={{ antialias: true }}
        className={cn(
          "transition-opacity duration-800 ease-in-out",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      >
        <color attach="background" args={["#000000"]} />
        <ParticlesCursorAnimation onLoaded={() => setIsLoaded(true)} />
      </Canvas>
    </main>
  );
}
