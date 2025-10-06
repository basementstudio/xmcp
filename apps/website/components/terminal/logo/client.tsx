"use client";

import {
  MeshDiscardMaterial,
  PerspectiveCamera,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef, useCallback, useState, Suspense } from "react";
import { GLTF } from "three/examples/jsm/Addons.js";
import * as THREE from "three";
import { useShader } from "../../../hooks/use-shader";
import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { cn } from "../../../utils/cn";
import { clamp } from "three/src/math/MathUtils.js";
import { ErrorBoundary } from "react-error-boundary";

const revealStart = 0.2;
const revealEnd = 0.8;

const animated = {
  current: false,
};

type GLTFResult = GLTF & {
  nodes: {
    Xmcp_1: THREE.Mesh;
    Xmcp_2: THREE.Mesh;
  };
  materials: {
    Glass: THREE.MeshPhysicalMaterial;
  };
};

function ThreeLogo({ matcap }: { matcap: string }) {
  const groupRef = useRef<THREE.Group>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { nodes } = useGLTF("/xmcp.glb") as any as GLTFResult;

  // const [matcap] = useMatcapTexture("3B3C3F_DAD9D5_929290_ABACA8", 1024);
  const matcapTexture = useTexture(matcap);

  const gl = useThree((state) => state.gl);

  gl.setClearColor(0x000000, 1);

  const matcapMaterial = useShader(
    {
      transparent: true,
      vertexShader: /*glsl*/ `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        // Transform normal to view space
        vNormal = normalize(normalMatrix * normal);
        
        // Calculate view position
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;

        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
      fragmentShader: /*glsl*/ `
      uniform sampler2D uMatcap;
      uniform float uReveal;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      ${noise}

      float revealSdf() {
         float s = -vWorldPosition.y * 0.4 + 0.5 + noise(vWorldPosition * 10.) * 0.1;
         s -= uReveal;
         s = step(s, 0.02);
         return s;
       }

      
      void main() {
        vec3 viewDir = normalize( vViewPosition );
        vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
        vec3 y = cross( viewDir, x );
        vec2 uv = vec2( dot( x, vNormal ), dot( y, vNormal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks
        
        // Sample the matcap texture
        vec4 matcapColor = texture2D(uMatcap, uv);

        float reveal = revealSdf();
        
        gl_FragColor.rgb = matcapColor.rgb;
        gl_FragColor.a = reveal;
      }
    `,
    },
    {
      uReveal: { value: animated.current ? revealEnd : revealStart },
      uMatcap: { value: matcapTexture },
    }
  );

  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const previousMouseX = useRef(0);
  const velocity = useRef(0);
  const damping = 0.95;
  const autoRotationSpeed = 1;

  const reveal = useMotionValue(revealStart);

  useMotionValueEvent(reveal, "change", (value) => {
    matcapMaterial.uniforms.uReveal.value = value;
  });

  useEffect(() => {
    if (animated.current) return;

    animate(reveal, revealEnd, {
      duration: 1,
      ease: "easeOut",
      onComplete: () => {
        animated.current = true;
      },
    });
  }, [reveal]);

  // Global mouse event handlers for cursor
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("mouseleave", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("mouseleave", handleGlobalMouseUp);
    };
  }, []);

  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    isDraggingRef.current = true;
    previousMouseX.current = event.clientX;
    setIsDragging(true);
    event.stopPropagation();
  }, []);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isDraggingRef.current) return;

    const deltaX = event.clientX - previousMouseX.current;

    if (Math.abs(deltaX) < 1) {
      return;
    }

    const dragSensitivity = 0.6;

    const desiredVelocity = clamp(deltaX * dragSensitivity, -40, 40);

    // Update velocity based on drag movement
    velocity.current = THREE.MathUtils.lerp(
      velocity.current,
      desiredVelocity,
      0.2
    );
    previousMouseX.current = event.clientX;

    event.stopPropagation();
  }, []);

  const handlePointerUp = useCallback((event?: ThreeEvent<PointerEvent>) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    if (event) event.stopPropagation();
  }, []);

  // Enhanced cursor handling with manual CSS cursor
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "grabbing";
    } else if (hovered) {
      document.body.style.cursor = "grab";
    } else {
      document.body.style.cursor = "default";
    }

    return () => {
      document.body.style.cursor = "default";
    };
  }, [isDragging, hovered]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    velocity.current = THREE.MathUtils.lerp(
      velocity.current,
      autoRotationSpeed,
      Math.min(delta * damping, 1)
    );

    groupRef.current.rotation.y += delta * velocity.current;
  });

  return (
    <>
      <mesh
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <planeGeometry args={[4, 4]} />
        <MeshDiscardMaterial />
      </mesh>
      <group ref={groupRef} scale-z={2} rotation-y={-Math.PI * 0.2}>
        <primitive object={nodes.Xmcp_1} material={matcapMaterial}></primitive>
        <primitive object={nodes.Xmcp_2} material={matcapMaterial}></primitive>
      </group>
    </>
  );
}

// Preload the model for better performance
useGLTF.preload("/xmcp.glb");

export const XmcpLogo = ({ matcap }: { matcap: string }) => {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        className={cn("absolute inset-0 w-full h-full", {})}
      >
        <Suspense fallback={null}>
          <ThreeLogo matcap={matcap} />
          <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={25} />
          <color attach="background" args={["#000000"]} />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  );
};

const noise = /*glsl*/ `
float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}
`;
