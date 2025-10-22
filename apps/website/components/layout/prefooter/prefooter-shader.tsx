"use client";
import { Canvas } from "@react-three/fiber";
import PrefooterParticlesCursorAnimation from "./prefooter-particles-cursor-animation";
import { useState, useEffect } from "react";

export default function PrefooterShader() {
  const [isUnmounting, setIsUnmounting] = useState(false);
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
    <div className="w-[127px] h-[154px]">
      <Canvas
        camera={{ position: [0, 0, 18], fov: 35 }}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        style={{
          opacity: isUnmounting ? 0 : 1,
        }}
      >
        <color attach="background" args={["#000000"]} />
        <PrefooterParticlesCursorAnimation />
      </Canvas>
    </div>
  );
}
