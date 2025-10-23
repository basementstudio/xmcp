"use client";

import { Canvas } from "@react-three/fiber";
import ParticlesCursorAnimation from "./particles-cursor-animation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Shader() {
  const [isUnmounting, setIsUnmounting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleUnmount = () => setIsUnmounting(true);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsUnmounting(true);
      } else {
        setIsUnmounting(false);
      }
    };
    window.addEventListener("beforeunload", handleUnmount);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleUnmount);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <main
      className={cn(
        "w-full aspect-square max-h-[250px] sm:max-h-[350px] md:max-h-[450px] lg:max-h-[500px] relative"
      )}
    >
      <Canvas
        camera={{ position: [0, 0, 18], fov: 35 }}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
        }}
        className={cn(
          isLoaded && !isUnmounting
            ? "opacity-100 transition-opacity duration-600 ease-in-out"
            : "opacity-0"
        )}
      >
        <color attach="background" args={["#000000"]} />
        <ParticlesCursorAnimation onLoaded={() => setIsLoaded(true)} />
      </Canvas>
    </main>
  );
}
