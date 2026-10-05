import { BufferAttribute, BufferGeometry } from "three";

/** Match PlaneGeometry's vertex/UV order without allocating triangles or normals. */
export function createParticleGeometry(
  width: number,
  height: number,
  segments: number
) {
  const count = (segments + 1) ** 2;
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const intensities = new Float32Array(count);
  const angles = new Float32Array(count);

  for (let y = 0; y <= segments; y++) {
    for (let x = 0; x <= segments; x++) {
      const i = y * (segments + 1) + x;
      positions[i * 3] = x * (width / segments) - width / 2;
      positions[i * 3 + 1] = -(y * (height / segments) - height / 2);
      uvs[i * 2] = x / segments;
      uvs[i * 2 + 1] = 1 - y / segments;
      intensities[i] = Math.random();
      angles[i] = Math.random() * Math.PI * 2;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setAttribute("aIntensity", new BufferAttribute(intensities, 1));
  geometry.setAttribute("aAngle", new BufferAttribute(angles, 1));
  return geometry;
}
