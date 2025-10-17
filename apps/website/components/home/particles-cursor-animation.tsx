"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
uniform vec2 uResolution;
uniform sampler2D uPictureTexture;
uniform sampler2D uDisplacementTexture;
uniform float uDisplacementStrength;
uniform float uPointSizeMultiplier;
uniform float uSmoothstepMin;
uniform float uSmoothstepMax;
uniform float uTime;
uniform float uMotionBlurStrength;

attribute float aIntensity;
attribute float aAngle;

varying vec3 vColor;

void main()
{
    // intensity of the picture
    float pictureIntensity = texture(uPictureTexture, uv).r;
    
    vec3 newPosition = position;
    float displacementIntensity = texture(uDisplacementTexture, uv).r;
    displacementIntensity = smoothstep(uSmoothstepMin, uSmoothstepMax, displacementIntensity);

    // displacement of the particles by the cursor
    vec3 displacement = vec3(
        cos(aAngle) * 0.2,
        sin(aAngle) * 0.2,
        1.0
    );
    displacement = normalize(displacement);
    displacement *= displacementIntensity;
    displacement *= uDisplacementStrength;
    displacement *= aIntensity;
    displacement *= pictureIntensity; 
    
    newPosition += displacement;

    // motion blur 
    float driftSpeed = uTime * 0.3;
    
    // multi-layered drift
    vec3 drift = vec3(
        sin(driftSpeed + aAngle * 3.0) * 0.03 + sin(driftSpeed * 0.5 + aAngle) * 0.015,
        cos(driftSpeed + aAngle * 2.0) * 0.03 + cos(driftSpeed * 0.7 + aAngle * 1.5) * 0.015,
        sin(driftSpeed + aAngle) * 0.02 + cos(driftSpeed * 0.3) * 0.01
    );
    drift *= aIntensity;
    drift *= uMotionBlurStrength;
    
    // more movement when not displaced, less when displaced
    float displacementFactor = 1.0 - displacementIntensity * 0.5;
    drift *= displacementFactor;
    drift *= (1.0 - pictureIntensity * 0.5); 
    
    // add organic wave motion with multiple frequencies
    float wave1 = sin(uTime * 0.5 + position.x * 0.5 + position.y * 0.3) * 0.02;
    float wave2 = cos(uTime * 0.3 + position.x * 0.3 + position.y * 0.5) * 0.015;
    drift.z += (wave1 + wave2) * uMotionBlurStrength * (1.0 - pictureIntensity * 0.3);
    
    // add subtle circular motion
    float circularMotion = uTime * 0.2;
    drift.x += cos(circularMotion + aAngle * 6.28) * 0.01 * uMotionBlurStrength * displacementFactor;
    drift.y += sin(circularMotion + aAngle * 6.28) * 0.01 * uMotionBlurStrength * displacementFactor;
    
    newPosition += drift;

    // final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // star-like twinkling - multiple frequencies for natural effect
    float twinkle1 = sin(uTime * 1.5 + aAngle * 10.0 + position.x * 2.0) * 0.5 + 0.5;
    float twinkle2 = sin(uTime * 0.8 + aAngle * 7.0 + position.y * 2.0) * 0.5 + 0.5;
    float twinkle3 = sin(uTime * 2.3 + aAngle * 13.0) * 0.5 + 0.5;
    
    // combine twinkle effects
    float twinkleCombined = mix(twinkle1, twinkle2, 0.5);
    twinkleCombined = mix(twinkleCombined, twinkle3, 0.3);
    
    // more twinkling when not displaced
    float twinkleStrength = (1.0 - displacementIntensity * 0.7) * uMotionBlurStrength;
    float brightnessVariation = 0.85 + twinkleCombined * 0.3 * twinkleStrength;
    
    // point size with pulsing and twinkling
    float sizePulse = 1.0 + sin(uTime * 2.0 + aAngle * 5.0) * 0.08 * uMotionBlurStrength * (1.0 - pictureIntensity * 0.8);
    gl_PointSize = uPointSizeMultiplier * pictureIntensity * uResolution.y * sizePulse * brightnessVariation;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // varyings - brighter particles with twinkling effect
    vColor = vec3(pow(pictureIntensity, 1.3) * 1.5 * brightnessVariation);
}
`;

const fragmentShader = `
varying vec3 vColor;

void main()
{
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - vec2(0.5));

    if(distanceToCenter > 0.5)
        discard;

    float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
    vec3 brighterColor = vColor * (1.0 + alpha * 0.3);
    
    gl_FragColor = vec4(brighterColor, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export default function ParticlesCursorAnimation() {
  const { size, camera, raycaster } = useThree();
  const meshRef = useRef<THREE.Points>(null);
  const interactivePlaneRef = useRef<THREE.Mesh>(null);

  const particleQuantity = 480;
  const particleSize = 0.06;
  const displacementStrength = 0.8;
  const fadeSpeed = 0.082;
  const glowSizeMultiplier = 0.24;
  const speedAlphaMultiplier = 0.04;
  const smoothstepMin = 0.2;
  const smoothstepMax = 0.6;
  const planeSize = 10;
  const canvasResolution = 256;
  const cursorSmoothing = 0.5;
  const motionBlurStrength = 1;

  const displacement = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvasResolution;
    canvas.height = canvasResolution;

    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#000000";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const texture = new THREE.CanvasTexture(canvas);

    return {
      canvas,
      context,
      texture,
      screenCursor: new THREE.Vector2(9999, 9999),
      canvasCursor: new THREE.Vector2(9999, 9999),
      canvasCursorPrevious: new THREE.Vector2(9999, 9999),
      canvasCursorTarget: new THREE.Vector2(9999, 9999),
    };
  }, [canvasResolution]);

  const glowImage = useMemo(() => {
    const img = new Image();
    img.src = "/glow.png";
    return img;
  }, []);

  const pictureTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load("/xmcp.png");
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      planeSize,
      planeSize,
      particleQuantity,
      particleQuantity
    );
    geo.setIndex(null);
    geo.deleteAttribute("normal");

    const count = geo.attributes.position.count;
    const intensitiesArray = new Float32Array(count);
    const anglesArray = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      intensitiesArray[i] = Math.random();
      anglesArray[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute(
      "aIntensity",
      new THREE.BufferAttribute(intensitiesArray, 1)
    );
    geo.setAttribute("aAngle", new THREE.BufferAttribute(anglesArray, 1));

    return geo;
  }, [planeSize, particleQuantity]);

  const material = useMemo(() => {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uResolution: new THREE.Uniform(
          new THREE.Vector2(size.width * pixelRatio, size.height * pixelRatio)
        ),
        uPictureTexture: new THREE.Uniform(pictureTexture),
        uDisplacementTexture: new THREE.Uniform(displacement.texture),
        uDisplacementStrength: new THREE.Uniform(displacementStrength),
        uPointSizeMultiplier: new THREE.Uniform(particleSize),
        uSmoothstepMin: new THREE.Uniform(smoothstepMin),
        uSmoothstepMax: new THREE.Uniform(smoothstepMax),
        uTime: new THREE.Uniform(0),
        uMotionBlurStrength: new THREE.Uniform(motionBlurStrength),
      },
      blending: THREE.AdditiveBlending,
    });
  }, [
    size,
    pictureTexture,
    displacement.texture,
    displacementStrength,
    particleSize,
    smoothstepMin,
    smoothstepMax,
    motionBlurStrength,
  ]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      // Get the canvas element from the Three.js context
      const canvas = document.querySelector("canvas");
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      // Calculate position relative to the canvas
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert to normalized device coordinates (-1 to 1)
      displacement.screenCursor.x = (x / rect.width) * 2 - 1;
      displacement.screenCursor.y = -(y / rect.height) * 2 + 1;
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [displacement]);

  useEffect(() => {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    material.uniforms.uResolution.value.set(
      size.width * pixelRatio,
      size.height * pixelRatio
    );
    material.uniforms.uDisplacementStrength.value = displacementStrength;
    material.uniforms.uPointSizeMultiplier.value = particleSize;
    material.uniforms.uSmoothstepMin.value = smoothstepMin;
    material.uniforms.uSmoothstepMax.value = smoothstepMax;
    material.uniforms.uMotionBlurStrength.value = motionBlurStrength;
  }, [
    size,
    material,
    displacementStrength,
    particleSize,
    smoothstepMin,
    smoothstepMax,
    motionBlurStrength,
  ]);

  useFrame((state) => {
    if (!interactivePlaneRef.current || !displacement.context) return;

    material.uniforms.uTime.value = state.clock.elapsedTime;

    raycaster.setFromCamera(displacement.screenCursor, camera);
    const intersections = raycaster.intersectObject(
      interactivePlaneRef.current
    );

    if (intersections.length > 0 && intersections[0].uv) {
      const uv = intersections[0].uv;
      displacement.canvasCursorTarget.x = uv.x * displacement.canvas.width;
      displacement.canvasCursorTarget.y =
        (1 - uv.y) * displacement.canvas.height;
    }

    displacement.canvasCursor.x +=
      (displacement.canvasCursorTarget.x - displacement.canvasCursor.x) *
      cursorSmoothing;
    displacement.canvasCursor.y +=
      (displacement.canvasCursorTarget.y - displacement.canvasCursor.y) *
      cursorSmoothing;

    displacement.context.globalCompositeOperation = "source-over";
    displacement.context.globalAlpha = fadeSpeed;
    displacement.context.fillStyle = "#000000";
    displacement.context.fillRect(
      0,
      0,
      displacement.canvas.width,
      displacement.canvas.height
    );

    const cursorDistance = displacement.canvasCursorPrevious.distanceTo(
      displacement.canvasCursor
    );
    displacement.canvasCursorPrevious.copy(displacement.canvasCursor);
    const alpha = Math.min(cursorDistance * speedAlphaMultiplier, 1);

    const glowSize = displacement.canvas.width * glowSizeMultiplier;
    displacement.context.globalCompositeOperation = "lighten";
    displacement.context.globalAlpha = alpha;

    if (glowImage.complete) {
      displacement.context.drawImage(
        glowImage,
        displacement.canvasCursor.x - glowSize * 0.5,
        displacement.canvasCursor.y - glowSize * 0.5,
        glowSize,
        glowSize
      );
    }

    displacement.texture.needsUpdate = true;
  });

  return (
    <>
      <mesh ref={interactivePlaneRef} visible={false}>
        <planeGeometry args={[planeSize, planeSize]} />
        <meshBasicMaterial color="red" side={THREE.DoubleSide} />
      </mesh>

      <points ref={meshRef} geometry={geometry} material={material} />
    </>
  );
}
