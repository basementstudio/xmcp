/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { forwardRef, useMemo } from "react";
import { Effect } from "postprocessing";
import { Uniform, Vector2 } from "three";

const fragmentShader = `
  uniform vec2 resolution;
  uniform float uMotionValue; 
  uniform float uRotation;
  uniform float uSegments;
  uniform float uOverlayOpacity;
  uniform vec3 uOverlayColor;
  uniform vec3 uOverlayColorWhite;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float canvasAspect = resolution.x / resolution.y;
    float numSlices = uSegments;
    float rotationRadians = uRotation * (3.14159265 / 180.0);

    // Adjust the UV coordinates for aspect ratio
    vec2 scaledUV = uv;
    
    // Rotate the texture to align it with the warping axis
    vec2 rotatedUV = vec2(
      cos(rotationRadians) * (scaledUV.x - 0.5) - sin(rotationRadians) * (scaledUV.y - 0.5) + 0.5,
      sin(rotationRadians) * (scaledUV.x - 0.5) + cos(rotationRadians) * (scaledUV.y - 0.5) + 0.5
    );

    // Apply the warping effect along the aligned axis
    float sliceProgress = fract(rotatedUV.x * numSlices + uMotionValue);
    float amplitude = 0.003;
    rotatedUV.x += amplitude * sin(sliceProgress * 3.14159265 * 2.0) * (1.0 - 0.5 * abs(sliceProgress - 0.5));

    // Rotate the UVs back to the original orientation
    vec2 finalUV = vec2(
      cos(-rotationRadians) * (rotatedUV.x - 0.5) - sin(-rotationRadians) * (rotatedUV.y - 0.5) + 0.5,
      sin(-rotationRadians) * (rotatedUV.x - 0.5) + cos(-rotationRadians) * (rotatedUV.y - 0.5) + 0.5
    );

    // Clamp UVs to prevent sampling outside texture
    finalUV = clamp(finalUV, 0.0, 1.0);
    
    vec4 color = texture2D(inputBuffer, finalUV);

    // Create depth effect: each slice becomes fully black at the bottom
    float depthFactor = 1.0 - sliceProgress; // Goes from 1.0 at top to 0.0 at bottom
    depthFactor = pow(depthFactor, 2.0); // Make the gradient steeper
    color.rgb *= depthFactor;

    if (uOverlayOpacity > 0.0) {
      // Apply overlays with the specified opacity
      float blackOverlayAlpha = 0.05 * (1.0 - abs(sin(sliceProgress * 3.14159265 * 0.5 + 1.57))) * (uOverlayOpacity / 100.0);
      color.rgb *= (1.0 - blackOverlayAlpha);

      float whiteOverlayAlpha = 0.15 * (1.0 - abs(sin(sliceProgress * 3.14159265 * 0.7 - 0.7))) * (uOverlayOpacity / 100.0);
      color.rgb = mix(color.rgb, uOverlayColorWhite, whiteOverlayAlpha);
    }

    outputColor = color;
  }
`;

let FlutedGlassEffectImpl: any;

class FlutedGlassEffectClass extends Effect {
  constructor({
    resolution = new Vector2(1024, 1024),
    motionValue = 0.5,
    rotation = 0.0,
    segments = 80.0,
    overlayOpacity = 30.0,
    overlayColor = [0.0, 0.0, 0.0],
    overlayColorWhite = [1.0, 1.0, 1.0],
  }: {
    resolution?: Vector2;
    motionValue?: number;
    rotation?: number;
    segments?: number;
    overlayOpacity?: number;
    overlayColor?: [number, number, number];
    overlayColorWhite?: [number, number, number];
  }) {
    super("FlutedGlassEffect", fragmentShader, {
      uniforms: new Map<string, Uniform<any>>([
        ["resolution", new Uniform(resolution)],
        ["uMotionValue", new Uniform(motionValue)],
        ["uRotation", new Uniform(rotation)],
        ["uSegments", new Uniform(segments)],
        ["uOverlayOpacity", new Uniform(overlayOpacity)],
        ["uOverlayColor", new Uniform(overlayColor)],
        ["uOverlayColorWhite", new Uniform(overlayColorWhite)],
      ]),
    });
  }

  setSize(width: number, height: number) {
    this.uniforms.get("resolution")!.value.set(width, height);
  }
}

// eslint-disable-next-line prefer-const
FlutedGlassEffectImpl = FlutedGlassEffectClass;

export const FlutedGlassEffect = forwardRef<
  any,
  {
    motionValue?: number;
    rotation?: number;
    segments?: number;
    overlayOpacity?: number;
    overlayColor?: [number, number, number];
    overlayColorWhite?: [number, number, number];
  }
>(
  (
    {
      motionValue = 0.5,
      rotation = 0.0,
      segments = 80.0,
      overlayOpacity = 30.0,
      overlayColor = [0.0, 0.0, 0.0],
      overlayColorWhite = [1.0, 1.0, 1.0],
    },
    ref
  ) => {
    const effect = useMemo(
      () =>
        new FlutedGlassEffectImpl({
          resolution: new Vector2(window.innerWidth, window.innerHeight),
          motionValue,
          rotation,
          segments,
          overlayOpacity,
          overlayColor,
          overlayColorWhite,
        }),
      [
        motionValue,
        rotation,
        segments,
        overlayOpacity,
        overlayColor,
        overlayColorWhite,
      ]
    );

    return <primitive ref={ref} object={effect} dispose={null} />;
  }
);

FlutedGlassEffect.displayName = "FlutedGlassEffect";
