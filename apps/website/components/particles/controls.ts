export const HERO_CONTROLS = {
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
export type ParticleControls = typeof HERO_CONTROLS;
export const FOOTER_CONTROLS: ParticleControls = {
  ...HERO_CONTROLS,
  particleQuantity: 128,
  particleSize: 0.14,
  motionBlurStrength: 1.3,
};
