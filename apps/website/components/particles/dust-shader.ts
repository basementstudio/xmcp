// A picture drawn as rows of short dashes. Each dash flows along its row and
// takes its brightness from the picture underneath it, so the image stays
// readable while the dust moves through it. Every dash is generated from its
// instance index, so neither renderer needs vertex buffers. Keep the WGSL and
// GLSL versions in step.

export const dustWGSL = /* wgsl */ `
struct Uniforms {
  // Physical canvas width/height, seconds, canvas aspect.
  frame: vec4f,
  // Rows, dashes per row, twist, picture aspect.
  shape: vec4f,
  // Dash thickness, density, dash length, brightness.
  look: vec4f,
  // Vignette, speed, pixel ratio, unused.
  extra: vec4f,
  // Pointer x/y in physical y-up pixels from the center, radius, influence.
  pointer: vec4f,
  // Pointer velocity in physical pixels per second, unused.
  drag: vec4f,
}
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var picture: texture_2d<f32>;
@group(0) @binding(2) var pictureSampler: sampler;

const TAU = 6.2831853;
const DUST = vec3f(0.925, 0.941, 0.965);

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) local: vec2f,
  @location(1) @interpolate(flat) dash: vec3f,
}

fn hash(seed: u32) -> f32 {
  var x = seed * 747796405u + 2891336453u;
  x = ((x >> ((x >> 28u) + 4u)) ^ x) * 277803737u;
  x = (x >> 22u) ^ x;
  return f32(x) / 4294967295.0;
}

@vertex fn vertexMain(
  @builtin(vertex_index) vertex: u32,
  @builtin(instance_index) instance: u32
) -> VertexOutput {
  let rows = max(u.shape.x, 1.0);
  let segments = max(u32(u.shape.y), 1u);
  let row = instance / segments;
  let index = instance % segments;
  let h0 = hash(instance * 4u);
  let h1 = hash(instance * 4u + 1u);
  let h2 = hash(instance * 4u + 2u);
  let h3 = hash(instance * 4u + 3u);
  let time = u.frame.z * u.extra.y;
  let v = (f32(row) + 0.5) / rows;
  // Rows drift at different speeds, so the twist shears the dust like rings
  // turning at different rates.
  let flow = time * 0.012 * (1.4 + sin(v * u.shape.z));
  let x = fract((f32(index) + (h0 - 0.5) * 0.7) / f32(segments) + flow);
  // The picture is itself dotted; average the cell so dashes follow its tone.
  let cell = vec2f(0.3 / f32(segments), 0.3 / rows);
  var tone = 0.0;
  for (var i = 0; i < 5; i++) {
    let offset = vec2f(f32(i % 3) - 1.0, f32(i / 3) * 2.0 - 1.0) * cell;
    tone += textureSampleLevel(picture, pictureSampler, vec2f(x, v) + offset, 0.0).r;
  }
  let lum = clamp(tone / 5.0 * 1.7, 0.0, 1.0);

  let height = min(0.94 * u.frame.y, 0.94 * u.frame.x / u.shape.w);
  let size = vec2f(height * u.shape.w, height);
  let wave = sin(x * TAU * 1.5 + v * u.shape.z - time * 0.8) * 0.12 / rows;
  var center = (vec2f(x, v + wave) - 0.5) * vec2f(1.0, -1.0) * size;
  // Ease the rows apart around the pointer and draw them along its motion.
  let toPointer = center - u.pointer.xy;
  let reach = u.pointer.z * size.y;
  let touch = exp(-dot(toPointer, toPointer) / (reach * reach)) * u.pointer.w;
  let away = toPointer / max(length(toPointer), 1.0);
  let pull = clamp(u.drag.xy * 0.04, vec2f(-reach * 0.3), vec2f(reach * 0.3));
  center += (away * reach * 0.14 + pull) * touch;
  let halfLength = 0.5 * size.x / f32(segments) * 0.6 * u.look.z
    * mix(0.6, 1.2, h2) * mix(0.55, 1.15, lum) * (1.0 + touch * 0.6);
  let halfWidth = max(0.5, 0.6 * u.look.x * u.extra.z);

  let twinkle = 0.5 + 0.5 * sin(time * (0.8 + h3 * 2.4) + h1 * TAU);
  // A band of light travels up the picture.
  let band = 0.5 + 0.5 * sin(v * TAU * 1.2 + x * 2.0 + time * 0.45);
  let edges = smoothstep(0.0, 0.06, x) * smoothstep(1.0, 0.94, x);
  let vignette = 1.0 - u.extra.x * smoothstep(0.25, 1.2, length(center / size * 2.0));
  // A few dashes catch the light; the rest stay dim dust.
  let sparkle = select(1.0, 2.0, h3 > 0.9);
  var intensity = u.look.w * 2.4 * (pow(lum, 1.3) + 0.015 + touch * 0.06)
    * mix(mix(0.2, 0.6, lum), 1.0, twinkle) * mix(0.65, 1.0, band)
    * edges * vignette * mix(0.6, 1.0, h0) * sparkle * (1.0 + touch * 0.6);
  if (h2 > u.look.y * 0.92) { intensity = 0.0; }

  let corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
  );
  let local = corners[vertex] * vec2f(halfLength + halfWidth + 1.0, halfWidth + 1.0);
  var output: VertexOutput;
  output.position = vec4f((center + local) / (u.frame.xy * 0.5), 0.0, 1.0);
  if (intensity <= 0.002) { output.position = vec4f(2.0, 2.0, 0.0, 1.0); }
  output.local = local;
  output.dash = vec3f(halfLength, halfWidth, intensity);
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let along = max(abs(input.local.x) - input.dash.x, 0.0);
  let coverage = clamp(input.dash.y + 0.5 - length(vec2f(along, input.local.y)), 0.0, 1.0);
  return vec4f(DUST * input.dash.z * coverage, 1.0);
}
`;

export const dustVertexGLSL = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform vec4 frame;
uniform vec4 shape;
uniform vec4 look;
uniform vec4 extra;
uniform vec4 pointer;
uniform vec4 drag;
uniform sampler2D picture;
out vec2 local;
flat out vec3 dash;

const float TAU = 6.2831853;

float hash(uint seed) {
  uint x = seed * 747796405u + 2891336453u;
  x = ((x >> ((x >> 28u) + 4u)) ^ x) * 277803737u;
  x = (x >> 22u) ^ x;
  return float(x) / 4294967295.0;
}

void main() {
  float rows = max(shape.x, 1.0);
  uint instance = uint(gl_InstanceID);
  uint segments = max(uint(shape.y), 1u);
  uint row = instance / segments;
  uint index = instance % segments;
  float h0 = hash(instance * 4u);
  float h1 = hash(instance * 4u + 1u);
  float h2 = hash(instance * 4u + 2u);
  float h3 = hash(instance * 4u + 3u);
  float time = frame.z * extra.y;
  float v = (float(row) + 0.5) / rows;
  float flow = time * 0.012 * (1.4 + sin(v * shape.z));
  float x = fract((float(index) + (h0 - 0.5) * 0.7) / float(segments) + flow);
  vec2 cell = vec2(0.3 / float(segments), 0.3 / rows);
  float tone = 0.0;
  for (int i = 0; i < 5; i++) {
    vec2 offset = vec2(float(i % 3) - 1.0, float(i / 3) * 2.0 - 1.0) * cell;
    tone += textureLod(picture, vec2(x, v) + offset, 0.0).r;
  }
  float lum = clamp(tone / 5.0 * 1.7, 0.0, 1.0);

  float height = min(0.94 * frame.y, 0.94 * frame.x / shape.w);
  vec2 size = vec2(height * shape.w, height);
  float wave = sin(x * TAU * 1.5 + v * shape.z - time * 0.8) * 0.12 / rows;
  vec2 center = (vec2(x, v + wave) - 0.5) * vec2(1.0, -1.0) * size;
  vec2 toPointer = center - pointer.xy;
  float reach = pointer.z * size.y;
  float touch = exp(-dot(toPointer, toPointer) / (reach * reach)) * pointer.w;
  vec2 away = toPointer / max(length(toPointer), 1.0);
  vec2 pull = clamp(drag.xy * 0.04, vec2(-reach * 0.3), vec2(reach * 0.3));
  center += (away * reach * 0.14 + pull) * touch;
  float halfLength = 0.5 * size.x / float(segments) * 0.6 * look.z
    * mix(0.6, 1.2, h2) * mix(0.55, 1.15, lum) * (1.0 + touch * 0.6);
  float halfWidth = max(0.5, 0.6 * look.x * extra.z);

  float twinkle = 0.5 + 0.5 * sin(time * (0.8 + h3 * 2.4) + h1 * TAU);
  float band = 0.5 + 0.5 * sin(v * TAU * 1.2 + x * 2.0 + time * 0.45);
  float edges = smoothstep(0.0, 0.06, x) * smoothstep(1.0, 0.94, x);
  float vignette = 1.0 - extra.x * smoothstep(0.25, 1.2, length(center / size * 2.0));
  float sparkle = h3 > 0.9 ? 2.0 : 1.0;
  float intensity = look.w * 2.4 * (pow(lum, 1.3) + 0.015 + touch * 0.06)
    * mix(mix(0.2, 0.6, lum), 1.0, twinkle) * mix(0.65, 1.0, band)
    * edges * vignette * mix(0.6, 1.0, h0) * sparkle * (1.0 + touch * 0.6);
  if (h2 > look.y * 0.92) intensity = 0.0;

  int vertex = gl_VertexID;
  vec2 corner = vec2(
    (vertex == 1 || vertex == 4 || vertex == 5) ? 1.0 : -1.0,
    (vertex == 2 || vertex == 3 || vertex == 5) ? 1.0 : -1.0
  );
  local = corner * vec2(halfLength + halfWidth + 1.0, halfWidth + 1.0);
  gl_Position = intensity > 0.002
    ? vec4((center + local) / (frame.xy * 0.5), 0.0, 1.0)
    : vec4(2.0, 2.0, 0.0, 1.0);
  dash = vec3(halfLength, halfWidth, intensity);
}
`;

export const dustFragmentGLSL = /* glsl */ `#version 300 es
precision highp float;
in vec2 local;
flat in vec3 dash;
out vec4 color;
const vec3 DUST = vec3(0.925, 0.941, 0.965);

void main() {
  float along = max(abs(local.x) - dash.x, 0.0);
  float coverage = clamp(dash.y + 0.5 - length(vec2(along, local.y)), 0.0, 1.0);
  color = vec4(DUST * dash.z * coverage, 1.0);
}
`;
