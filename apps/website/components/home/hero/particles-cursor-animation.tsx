"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useControls, folder } from "leva";

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
uniform float uPlaneAspect;
uniform float uImageAspect;
uniform vec2 uCursorVelocity;
attribute float aIntensity;
attribute float aAngle;
varying vec3 vColor;
varying vec2 vUv;
void main()
{
    vec2 adjustedUv = uv;
    if (uPlaneAspect > uImageAspect) {
        float scale = uPlaneAspect / uImageAspect;
        adjustedUv.x = (uv.x - 0.5) * scale + 0.5;
    } else {
        float scale = uImageAspect / uPlaneAspect;
        adjustedUv.y = (uv.y - 0.5) * scale + 0.5;
    }
    float pictureIntensity = texture(uPictureTexture, adjustedUv).r;
    vec3 newPosition = position;
    float displacementIntensity = texture(uDisplacementTexture, uv).r;
    float rawIntensity = displacementIntensity;
    displacementIntensity = smoothstep(uSmoothstepMin, uSmoothstepMax, displacementIntensity);
    displacementIntensity = mix(displacementIntensity, rawIntensity, 0.4);
    displacementIntensity = pow(displacementIntensity, 0.8);
    float bulgePeak = pow(rawIntensity, 3.5) * 0.3;
    displacementIntensity += bulgePeak;
    vec3 radialDisplacement = vec3(
        cos(aAngle) * 0.25,
        sin(aAngle) * 0.25,
        1.2
    );
    vec3 flowDisplacement = vec3(
        uCursorVelocity.x * 2.0,
        uCursorVelocity.y * 2.0,
        0.3
    );
    vec3 displacement = mix(radialDisplacement, flowDisplacement, displacementIntensity * 0.7);
    displacement = normalize(displacement);
    float centerBulge = pow(displacementIntensity, 1.5);
    displacement.z += centerBulge * 0.3;
    displacement *= displacementIntensity;
    displacement *= uDisplacementStrength;
    displacement *= aIntensity;
    displacement *= pictureIntensity;
    newPosition += displacement;
    float driftSpeed = uTime * 0.3;
    vec3 drift = vec3(
        sin(driftSpeed + aAngle * 3.0) * 0.03 + sin(driftSpeed * 0.5 + aAngle) * 0.015,
        cos(driftSpeed + aAngle * 2.0) * 0.03 + cos(driftSpeed * 0.7 + aAngle * 1.5) * 0.015,
        sin(driftSpeed + aAngle) * 0.02 + cos(driftSpeed * 0.3) * 0.01
    );
    drift *= aIntensity;
    drift *= uMotionBlurStrength;
    float displacementFactor = 1.0 - displacementIntensity * 0.5;
    drift *= displacementFactor;
    drift *= (1.0 - pictureIntensity * 0.5);
    float wave1 = sin(uTime * 0.5 + position.x * 0.5 + position.y * 0.3) * 0.02;
    float wave2 = cos(uTime * 0.3 + position.x * 0.3 + position.y * 0.5) * 0.015;
    drift.z += (wave1 + wave2) * uMotionBlurStrength * (1.0 - pictureIntensity * 0.3);
    float circularMotion = uTime * 0.2;
    drift.x += cos(circularMotion + aAngle * 6.28) * 0.01 * uMotionBlurStrength * displacementFactor;
    drift.y += sin(circularMotion + aAngle * 6.28) * 0.01 * uMotionBlurStrength * displacementFactor;
    newPosition += drift;
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    float twinkle1 = sin(uTime * 0.4 + aAngle * 10.0 + position.x * 2.0) * 0.5 + 0.5;
    float twinkle2 = sin(uTime * 0.25 + aAngle * 7.0 + position.y * 2.0) * 0.5 + 0.5;
    float twinkle3 = sin(uTime * 0.6 + aAngle * 13.0) * 0.5 + 0.5;
    float basePulse = sin(uTime * 0.3) * 0.5 + 0.5;
    float twinkleCombined = mix(twinkle1, twinkle2, 0.5);
    twinkleCombined = mix(twinkleCombined, twinkle3, 0.3);
    twinkleCombined = mix(twinkleCombined, basePulse, 0.2);
    twinkleCombined = smoothstep(0.2, 0.8, twinkleCombined);
    float twinkleStrength = (1.0 - displacementIntensity * 0.5) * uMotionBlurStrength;
    float brightnessVariation = 0.6 + twinkleCombined * 0.6 * twinkleStrength;
    float sizePulse = 1.0 + sin(uTime * 0.5 + aAngle * 5.0) * 0.12 * uMotionBlurStrength * (1.0 - pictureIntensity * 0.8);
    float sizeFromBrightness = mix(0.85, 1.15, brightnessVariation);
    gl_PointSize = uPointSizeMultiplier * pictureIntensity * uResolution.y * sizePulse * sizeFromBrightness;
    gl_PointSize *= (1.0 / - viewPosition.z);
    vColor = vec3(pow(pictureIntensity, 1.2) * 1.8 * brightnessVariation);
    vUv = uv;
}
`;
const fragmentShader = `
varying vec3 vColor;
varying vec2 vUv;
void main()
{
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - vec2(0.5));
    if(distanceToCenter > 0.5)
        discard;
    float edgeFadeSize = 0.4;
    float edgeDistX = min(vUv.x, 1.0 - vUv.x);
    float edgeDistY = min(vUv.y, 1.0 - vUv.y);
    float edgeDist = min(edgeDistX, edgeDistY);
    float edgeFade = smoothstep(0.0, edgeFadeSize, edgeDist);
    float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
    alpha = pow(alpha, 0.8);
    float glow = pow(alpha, 2.0) * 0.5;
    vec3 brighterColor = vColor * (1.0 + alpha * 0.4 + glow);
    brighterColor *= edgeFade;
    gl_FragColor = vec4(brighterColor, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export default function ParticlesCursorAnimation() {
  const { size, camera, raycaster, gl } = useThree();
  const meshRef = useRef<THREE.Points>(null);
  const interactivePlaneRef = useRef<THREE.Mesh>(null);
  const intersectionsRef = useRef<THREE.Intersection[]>([]);
  const previousScreenCursorRef = useRef<THREE.Vector2>(
    new THREE.Vector2(9999, 9999)
  );
  const previousCanvasCursorRef = useRef<THREE.Vector2>(
    new THREE.Vector2(9999, 9999)
  );

  // Check if debug mode is enabled via URL
  const isDebugMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debug");

  const controls = isDebugMode
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useControls({
        "Mouse Effect": folder({
          mouseAreaSize: {
            value: 0.26,
            min: 0.05,
            max: 1,
            step: 0.01,
          },
          displacementForce: {
            value: 2.0,
            min: 0,
            max: 10,
            step: 0.1,
          },
        }),
        "Particle Settings": folder({
          particleQuantity: {
            value: 420,
            min: 32,
            max: 512,
            step: 32,
          },
          particleSize: {
            value: 0.08,
            min: 0.01,
            max: 1,
            step: 0.01,
          },
          motionBlurStrength: {
            value: 0.7,
            min: 0,
            max: 3,
            step: 0.1,
          },
        }),
        Displacement: folder({
          displacementStrength: {
            value: 2.8,
            min: 0,
            max: 10,
            step: 0.1,
          },
          smoothstepMin: {
            value: 0.35,
            min: 0,
            max: 1,
            step: 0.01,
          },
          smoothstepMax: {
            value: 0.82,
            min: 0,
            max: 1,
            step: 0.01,
          },
        }),
        "Cursor Trail": folder({
          fadeSpeed: {
            value: 0.03,
            min: 0.001,
            max: 0.1,
            step: 0.001,
          },
          glowSizeMultiplier: {
            value: 0.22,
            min: 0.1,
            max: 1,
            step: 0.01,
          },
          speedAlphaMultiplier: {
            value: 0.18,
            min: 0.01,
            max: 0.3,
            step: 0.01,
          },
          cursorSmoothing: {
            value: 0.2,
            min: 0.01,
            max: 0.5,
            step: 0.01,
          },
          cursorLerpStrength: {
            value: 0.24,
            min: 0.01,
            max: 0.3,
            step: 0.01,
          },
        }),
        Advanced: folder({
          canvasResolution: {
            value: 256,
            min: 64,
            max: 512,
            step: 64,
          },
        }),
      })
    : {
        mouseAreaSize: 0.26,
        displacementForce: 2.0,
        particleQuantity: 384,
        particleSize: 0.08,
        motionBlurStrength: 0.7,
        smoothstepMin: 0.35,
        smoothstepMax: 0.82,
        fadeSpeed: 0.03,
        speedAlphaMultiplier: 0.18,
        cursorSmoothing: 0.2,
        cursorLerpStrength: 0.24,
        canvasResolution: 256,
      };

  const {
    particleQuantity,
    particleSize,
    displacementForce,
    mouseAreaSize,
    fadeSpeed,
    speedAlphaMultiplier,
    smoothstepMin,
    smoothstepMax,
    canvasResolution,
    cursorSmoothing,
    cursorLerpStrength,
    motionBlurStrength,
  } = controls;

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
      canvasCursorSmoothed: new THREE.Vector2(9999, 9999),
      velocity: new THREE.Vector2(0, 0),
      velocitySmoothed: new THREE.Vector2(0, 0),
    };
  }, [canvasResolution]);

  const glowImage = useMemo(() => {
    const img = new Image();
    img.src = "/glow.png";
    return img;
  }, []);

  const [imageAspect, setImageAspect] = useState(1);

  const pictureTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load("/xmcp.png", (texture) => {
      const { width, height } = texture.image as HTMLImageElement;
      if (width && height) {
        setImageAspect(width / height);
      }
    });
  }, []);

  const planeSize = useMemo(() => {
    if (!(camera instanceof THREE.PerspectiveCamera))
      return { width: 10, height: 10, aspect: 1 };

    const cameraDistance = 18;
    const vFov = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFov / 2) * cameraDistance;

    const canvasAspect = size.width / size.height;
    const visibleWidth = visibleHeight * canvasAspect;

    return {
      width: visibleWidth * 0.9,
      height: visibleHeight * 0.9,
      aspect: canvasAspect,
    };
  }, [camera, size]);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      planeSize.width,
      planeSize.height,
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
        uDisplacementStrength: new THREE.Uniform(displacementForce),
        uPointSizeMultiplier: new THREE.Uniform(particleSize),
        uSmoothstepMin: new THREE.Uniform(smoothstepMin),
        uSmoothstepMax: new THREE.Uniform(smoothstepMax),
        uTime: new THREE.Uniform(0),
        uMotionBlurStrength: new THREE.Uniform(motionBlurStrength),
        uPlaneAspect: new THREE.Uniform(planeSize.aspect),
        uImageAspect: new THREE.Uniform(imageAspect),
        uCursorVelocity: new THREE.Uniform(new THREE.Vector2(0, 0)),
        uViewportWidth: new THREE.Uniform(size.width),
      },
      blending: THREE.AdditiveBlending,
    });
  }, [
    size,
    pictureTexture,
    displacement.texture,
    displacementForce,
    particleSize,
    smoothstepMin,
    smoothstepMax,
    motionBlurStrength,
    planeSize.aspect,
    imageAspect,
  ]);

  useEffect(() => {
    return () => {
      displacement.texture.dispose();
      geometry.dispose();
      material.dispose();
      pictureTexture.dispose();
    };
  }, [displacement.texture, geometry, material, pictureTexture]);

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();

      // Calculate mouse position relative to the canvas
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert to normalized device coordinates (-1 to +1)
      displacement.screenCursor.x = (x / rect.width) * 2 - 1;
      displacement.screenCursor.y = -(y / rect.height) * 2 + 1;
    };

    const handlePointerLeave = () => {
      displacement.screenCursor.set(9999, 9999);
      displacement.canvasCursorTarget.set(9999, 9999);
      displacement.canvasCursorSmoothed.set(9999, 9999);
      previousCanvasCursorRef.current.set(9999, 9999);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [displacement, gl]);

  useEffect(() => {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    material.uniforms.uResolution.value.set(
      size.width * pixelRatio,
      size.height * pixelRatio
    );
    material.uniforms.uDisplacementStrength.value = displacementForce;
    material.uniforms.uPointSizeMultiplier.value = particleSize;
    material.uniforms.uSmoothstepMin.value = smoothstepMin;
    material.uniforms.uSmoothstepMax.value = smoothstepMax;
    material.uniforms.uMotionBlurStrength.value = motionBlurStrength;
    material.uniforms.uViewportWidth.value = size.width;
    material.uniforms.uPlaneAspect.value = planeSize.aspect;
    material.uniforms.uImageAspect.value = imageAspect;
  }, [
    size,
    material,
    displacementForce,
    particleSize,
    smoothstepMin,
    smoothstepMax,
    motionBlurStrength,
    planeSize.aspect,
    imageAspect,
  ]);

  // Update interactive plane when planeSize changes
  useEffect(() => {
    if (interactivePlaneRef.current) {
      const planeGeo = interactivePlaneRef.current
        .geometry as THREE.PlaneGeometry;
      planeGeo.dispose();
      interactivePlaneRef.current.geometry = new THREE.PlaneGeometry(
        planeSize.width,
        planeSize.height
      );
    }
  }, [planeSize]);

  useFrame((state) => {
    if (!interactivePlaneRef.current || !displacement.context) return;

    material.uniforms.uTime.value = state.clock.elapsedTime;

    const hasPointerInView =
      Math.abs(displacement.screenCursor.x) <= 1 &&
      Math.abs(displacement.screenCursor.y) <= 1;

    // Only execute raycaster if screenCursor has changed
    const cursorChanged =
      previousScreenCursorRef.current.x !== displacement.screenCursor.x ||
      previousScreenCursorRef.current.y !== displacement.screenCursor.y;

    if (hasPointerInView && cursorChanged) {
      // Update raycaster with current camera and mouse position
      raycaster.setFromCamera(displacement.screenCursor, camera);
      const intersections = intersectionsRef.current;
      intersections.length = 0;
      raycaster.intersectObject(
        interactivePlaneRef.current,
        false,
        intersections
      );

      if (intersections.length > 0 && intersections[0].uv) {
        const uv = intersections[0].uv;
        displacement.canvasCursorTarget.x = uv.x * displacement.canvas.width;
        displacement.canvasCursorTarget.y =
          (1 - uv.y) * displacement.canvas.height;
      }

      // Update previous cursor position
      previousScreenCursorRef.current.copy(displacement.screenCursor);
    } else if (!hasPointerInView) {
      // Reset previous cursor when pointer leaves view
      previousScreenCursorRef.current.set(9999, 9999);
    }

    displacement.canvasCursorSmoothed.x +=
      (displacement.canvasCursorTarget.x -
        displacement.canvasCursorSmoothed.x) *
      cursorSmoothing;
    displacement.canvasCursorSmoothed.y +=
      (displacement.canvasCursorTarget.y -
        displacement.canvasCursorSmoothed.y) *
      cursorSmoothing;

    const oldX = displacement.canvasCursor.x;
    const oldY = displacement.canvasCursor.y;

    displacement.canvasCursor.x +=
      (displacement.canvasCursorSmoothed.x - displacement.canvasCursor.x) *
      cursorLerpStrength;
    displacement.canvasCursor.y +=
      (displacement.canvasCursorSmoothed.y - displacement.canvasCursor.y) *
      cursorLerpStrength;

    displacement.velocity.x =
      (displacement.canvasCursor.x - oldX) / displacement.canvas.width;
    displacement.velocity.y =
      -(displacement.canvasCursor.y - oldY) / displacement.canvas.height;

    displacement.velocitySmoothed.x +=
      (displacement.velocity.x - displacement.velocitySmoothed.x) * 0.15;
    displacement.velocitySmoothed.y +=
      (displacement.velocity.y - displacement.velocitySmoothed.y) * 0.15;

    material.uniforms.uCursorVelocity.value.copy(displacement.velocitySmoothed);

    // Check if canvas cursor moved significantly (using a threshold to avoid micro-movements)
    const canvasCursorMoved =
      Math.abs(
        displacement.canvasCursor.x - previousCanvasCursorRef.current.x
      ) > 0.1 ||
      Math.abs(
        displacement.canvasCursor.y - previousCanvasCursorRef.current.y
      ) > 0.1;

    const cursorDistance = displacement.canvasCursorPrevious.distanceTo(
      displacement.canvasCursor
    );
    displacement.canvasCursorPrevious.copy(displacement.canvasCursor);
    const alpha = Math.min(cursorDistance * speedAlphaMultiplier, 1);

    // Only update canvas if cursor moved significantly or if we need to draw glow
    const shouldUpdateCanvas =
      canvasCursorMoved || (alpha > 0.001 && glowImage.complete);

    if (shouldUpdateCanvas) {
      displacement.context.globalCompositeOperation = "source-over";
      displacement.context.globalAlpha = fadeSpeed;
      displacement.context.fillStyle = "#000000";
      displacement.context.fillRect(
        0,
        0,
        displacement.canvas.width,
        displacement.canvas.height
      );

      if (alpha > 0.001 && glowImage.complete) {
        const glowSize = displacement.canvas.width * mouseAreaSize;
        displacement.context.globalCompositeOperation = "lighten";
        displacement.context.globalAlpha = alpha;
        displacement.context.drawImage(
          glowImage,
          displacement.canvasCursor.x - glowSize * 0.5,
          displacement.canvasCursor.y - glowSize * 0.5,
          glowSize,
          glowSize
        );
      }

      displacement.texture.needsUpdate = true;
      previousCanvasCursorRef.current.copy(displacement.canvasCursor);
    }
  });

  return (
    <>
      <mesh ref={interactivePlaneRef} visible={false} position={[0, 0, 0]}>
        <planeGeometry args={[planeSize.width, planeSize.height]} />
        <meshBasicMaterial color="red" side={THREE.DoubleSide} />
      </mesh>

      <points
        ref={meshRef}
        geometry={geometry}
        material={material}
        position={[0, 0, 0]}
      />
    </>
  );
}
