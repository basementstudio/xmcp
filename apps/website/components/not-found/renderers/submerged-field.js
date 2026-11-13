// Height-field wave equation with reflecting, invisible obstacles.
// Neighboring solid cells use the current cell's height (no flux through walls).
function box(x, z, bx, bz, r = 0) {
  const qx = Math.abs(x) - bx + r,
    qz = Math.abs(z) - bz + r;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) +
    Math.min(Math.max(qx, qz), 0) -
    r
  );
}
function four(x, z) {
  return Math.min(
    box(x + 0.43, z + 0.48, 0.15, 0.72, 0.03),
    box(x - 0.43, z, 0.15, 1.2, 0.03),
    box(x, z - 0.08, 0.58, 0.15, 0.03)
  );
}
export function collider404SDF(x, z) {
  const zero = Math.max(
    box(x, z, 0.65, 1.2, 0.12),
    -box(x, z, 0.34, 0.88, 0.08)
  );
  return Math.min(four(x + 1.8, z), zero, four(x - 1.8, z));
}
export const colliderGLSL = /* glsl */ `
uniform vec3 uCollider;
float glyphBox(vec2 p,vec2 b,float radius){vec2 q=abs(p)-b+radius;return length(max(q,vec2(0)))+min(max(q.x,q.y),0.0)-radius;}
float glyphFour(vec2 p){return min(min(glyphBox(p+vec2(0.43,0.48),vec2(0.15,0.72),0.03),glyphBox(p-vec2(0.43,0),vec2(0.15,1.2),0.03)),glyphBox(p-vec2(0,0.08),vec2(0.58,0.15),0.03));}
float glyphDistance(vec2 world){vec2 p=(world-uCollider.xy)/uCollider.z;float zero=max(glyphBox(p,vec2(0.65,1.2),0.12),-glyphBox(p,vec2(0.34,0.88),0.08));return min(min(glyphFour(p+vec2(1.8,0)),zero),glyphFour(p-vec2(1.8,0)))*uCollider.z;}
`;
export class RippleField {
  constructor({
    nx = 224,
    nz = 168,
    width = 24,
    depth = 18,
    centerX = 0,
    centerZ = -1.8,
    scale = 1,
  } = {}) {
    Object.assign(this, { nx, nz, width, depth });
    const count = nx * nz;
    this.current = new Float32Array(count);
    this.previous = new Float32Array(count);
    this.next = new Float32Array(count);
    this.mask = new Uint8Array(count);
    this.damping = new Float32Array(count);
    for (let z = 0; z < nz; z++)
      for (let x = 0; x < nx; x++) {
        const edge = Math.min(x, z, nx - 1 - x, nz - 1 - z);
        this.damping[z * nx + x] = 0.92 + 0.074 * Math.min(edge / 16, 1);
      }
    this.setCollider(centerX, centerZ, scale);
  }
  worldX(x) {
    return (x / (this.nx - 1) - 0.5) * this.width;
  }
  worldZ(z) {
    return (z / (this.nz - 1) - 0.5) * this.depth;
  }
  setObstacle(predicate) {
    for (let z = 0; z < this.nz; z++)
      for (let x = 0; x < this.nx; x++)
        this.mask[z * this.nx + x] = predicate(this.worldX(x), this.worldZ(z))
          ? 1
          : 0;
    this.clear();
  }
  setCollider(x, z, scale = 1) {
    this.setObstacle(
      (wx, wz) => collider404SDF((wx - x) / scale, (wz - z) / scale) < 0
    );
  }
  clear() {
    this.current.fill(0);
    this.previous.fill(0);
    this.next.fill(0);
  }
  disturb(x, z, strength = 0.22, radius = 0.38) {
    const gx = (x / this.width + 0.5) * (this.nx - 1),
      gz = (z / this.depth + 0.5) * (this.nz - 1);
    const rx = (radius / this.width) * (this.nx - 1),
      rz = (radius / this.depth) * (this.nz - 1);
    const x0 = Math.max(1, Math.floor(gx - rx * 2.8)),
      x1 = Math.min(this.nx - 2, Math.ceil(gx + rx * 2.8));
    const z0 = Math.max(1, Math.floor(gz - rz * 2.8)),
      z1 = Math.min(this.nz - 2, Math.ceil(gz + rz * 2.8));
    for (let iz = z0; iz <= z1; iz++)
      for (let ix = x0; ix <= x1; ix++) {
        const i = iz * this.nx + ix;
        if (this.mask[i]) continue;
        const d = ((ix - gx) / rx) ** 2 + ((iz - gz) / rz) ** 2;
        const impulse = strength * Math.exp(-d * 1.8);
        this.current[i] += impulse;
        this.previous[i] += impulse;
      }
  }
  step() {
    const { nx, nz, current: c, previous: p, next: n, mask: m, damping } = this;
    for (let z = 1; z < nz - 1; z++)
      for (let x = 1; x < nx - 1; x++) {
        const i = z * nx + x;
        if (m[i]) {
          n[i] = 0;
          continue;
        }
        const h = c[i];
        const left = m[i - 1] ? h : c[i - 1],
          right = m[i + 1] ? h : c[i + 1];
        const back = m[i - nx] ? h : c[i - nx],
          front = m[i + nx] ? h : c[i + nx];
        n[i] =
          (2 * h - p[i] + 0.22 * (left + right + back + front - 4 * h)) *
          damping[i];
      }
    this.previous = c;
    this.current = n;
    this.next = p;
  }
}
