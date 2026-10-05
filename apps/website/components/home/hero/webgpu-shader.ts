// Port of the hero's GLSL shader. Keep the motion equations and color pipeline
// aligned with particles-cursor-animation.tsx (the WebGL fallback).
export const heroShader = /* wgsl */ `
struct Uniforms {
  // Physical canvas width/height, plane width/height.
  size: vec4f,
  // Seconds, plane aspect, picture aspect, projection cotangent.
  scene: vec4f,
  // Displacement force, point size, smoothstep min/max.
  effect: vec4f,
  // Motion strength, cursor velocity x/y, unused.
  motion: vec4f,
}
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var picture: texture_2d<f32>;
@group(0) @binding(2) var trail: texture_2d<f32>;
@group(0) @binding(3) var imageSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
  @location(1) uv: vec2f,
  @location(2) pointUv: vec2f,
}

@vertex fn vertexMain(
  @builtin(vertex_index) vertex: u32,
  @location(0) particle: vec4f
) -> VertexOutput {
  let uv = particle.xy;
  let intensity = particle.z;
  let angle = particle.w;
  let time = u.scene.x;
  let motion = u.motion.x;
  let position = vec3f((uv - 0.5) * u.size.zw, 0.0);
  var adjustedUv = uv;
  if (u.scene.y > u.scene.z) {
    adjustedUv.x = (uv.x - 0.5) * (u.scene.y / u.scene.z) + 0.5;
  } else {
    adjustedUv.y = (uv.y - 0.5) * (u.scene.z / u.scene.y) + 0.5;
  }
  let pictureIntensity = textureSampleLevel(picture, imageSampler, adjustedUv, 0.0).r;
  let raw = textureSampleLevel(trail, imageSampler, uv, 0.0).r;
  var displacementIntensity = smoothstep(u.effect.z, u.effect.w, raw);
  displacementIntensity = pow(mix(displacementIntensity, raw, 0.4), 0.8);
  displacementIntensity += pow(raw, 3.5) * 0.3;
  let radial = vec3f(cos(angle) * 0.25, sin(angle) * 0.25, 1.2);
  let flow = vec3f(u.motion.yz * 2.0, 0.3);
  var displacement = normalize(mix(radial, flow, displacementIntensity * 0.7));
  displacement.z += pow(displacementIntensity, 1.5) * 0.3;
  displacement *= displacementIntensity * u.effect.x * intensity * pictureIntensity;
  var newPosition = position + displacement;
  let driftSpeed = time * 0.3;
  var drift = vec3f(
    sin(driftSpeed + angle * 3.0) * 0.03 + sin(driftSpeed * 0.5 + angle) * 0.015,
    cos(driftSpeed + angle * 2.0) * 0.03 + cos(driftSpeed * 0.7 + angle * 1.5) * 0.015,
    sin(driftSpeed + angle) * 0.02 + cos(driftSpeed * 0.3) * 0.01
  );
  let displacementFactor = 1.0 - displacementIntensity * 0.5;
  drift *= intensity * motion * displacementFactor * (1.0 - pictureIntensity * 0.5);
  let wave1 = sin(time * 0.5 + position.x * 0.5 + position.y * 0.3) * 0.02;
  let wave2 = cos(time * 0.3 + position.x * 0.3 + position.y * 0.5) * 0.015;
  drift.z += (wave1 + wave2) * motion * (1.0 - pictureIntensity * 0.3);
  drift.x += cos(time * 0.2 + angle * 6.28) * 0.01 * motion * displacementFactor;
  drift.y += sin(time * 0.2 + angle * 6.28) * 0.01 * motion * displacementFactor;
  newPosition += drift;
  let distance = 18.0 - newPosition.z;
  let twinkle1 = sin(time * 0.4 + angle * 10.0 + position.x * 2.0) * 0.5 + 0.5;
  let twinkle2 = sin(time * 0.25 + angle * 7.0 + position.y * 2.0) * 0.5 + 0.5;
  let twinkle3 = sin(time * 0.6 + angle * 13.0) * 0.5 + 0.5;
  let basePulse = sin(time * 0.3) * 0.5 + 0.5;
  var twinkle = mix(mix(mix(twinkle1, twinkle2, 0.5), twinkle3, 0.3), basePulse, 0.2);
  twinkle = smoothstep(0.2, 0.8, twinkle);
  let brightness = 0.6 + twinkle * 0.6 * (1.0 - displacementIntensity * 0.5) * motion;
  let sizePulse = 1.0 + sin(time * 0.5 + angle * 5.0) * 0.12 * motion * (1.0 - pictureIntensity * 0.8);
  // WebGL clamps point sizes to at least one physical pixel.
  let pointSize = max(1.0, u.effect.y * pictureIntensity * u.size.y * sizePulse * mix(0.85, 1.15, brightness) / distance);
  let corners = array<vec2f, 6>(
    vec2f(-0.5, -0.5), vec2f(0.5, -0.5), vec2f(-0.5, 0.5),
    vec2f(-0.5, 0.5), vec2f(0.5, -0.5), vec2f(0.5, 0.5)
  );
  let corner = corners[vertex];
  var output: VertexOutput;
  // Same perspective camera (fov 35, near .1, far 1000), WebGPU's 0..1 depth.
  output.position = vec4f(newPosition.xy * vec2f(u.scene.w / u.scene.y, u.scene.w),
    (1000.0 * distance - 100.0) / 999.9, distance);
  output.position.x += corner.x * pointSize * 2.0 / u.size.x * distance;
  output.position.y += corner.y * pointSize * 2.0 / u.size.y * distance;
  output.color = vec3f(pow(pictureIntensity, 1.2) * 1.8 * brightness);
  output.uv = uv;
  output.pointUv = corner + 0.5;
  return output;
}

// Match Three.js r178 ACESFilmicToneMapping and sRGBTransferOETF.
fn displayColor(input: vec3f) -> vec3f {
  let inputMatrix = mat3x3f(vec3f(0.59719, 0.07600, 0.02840),
    vec3f(0.35458, 0.90834, 0.13383), vec3f(0.04823, 0.01566, 0.83777));
  let outputMatrix = mat3x3f(vec3f(1.60475, -0.10208, -0.00327),
    vec3f(-0.53108, 1.10813, -0.07276), vec3f(-0.07367, -0.00605, 1.07602));
  let v = inputMatrix * (input / 0.6);
  let a = v * (v + 0.0245786) - 0.000090537;
  let b = v * (0.983729 * v + 0.4329510) + 0.238081;
  let color = clamp(outputMatrix * (a / b), vec3f(0.0), vec3f(1.0));
  return select(pow(color, vec3f(0.41666)) * 1.055 - 0.055,
    color * 12.92, color <= vec3f(0.0031308));
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let distanceToCenter = length(input.pointUv - 0.5);
  if (distanceToCenter > 0.5) { discard; }
  let edge = min(input.uv, 1.0 - input.uv);
  let edgeFade = smoothstep(0.0, 0.4, min(edge.x, edge.y));
  let alpha = pow(1.0 - smoothstep(0.0, 0.5, distanceToCenter), 0.8);
  let glow = pow(alpha, 2.0) * 0.5;
  let color = input.color * (1.0 + alpha * 0.4 + glow) * edgeFade;
  return vec4f(displayColor(color), 1.0);
}
`;
