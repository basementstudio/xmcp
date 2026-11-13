// Smooth the pointer in time, then emit at fixed distances along its path.
// This avoids separate blobs and gaps when pointer events arrive unevenly.
export class WaterTrail {
  constructor(spacing = 0.1) {
    this.spacing = spacing;
    this.ready = false;
    this.residual = 0;
  }
  target(x, z) {
    if (!this.ready) {
      this.x = x;
      this.z = z;
      this.residual = 0;
      this.ready = true;
    }
    this.tx = x;
    this.tz = z;
  }
  leave() {
    this.ready = false;
    this.residual = 0;
  }
  advance(dt, emit) {
    if (!this.ready) return;
    const alpha = 1 - Math.exp(-20 * dt);
    this.sample(
      this.x + (this.tx - this.x) * alpha,
      this.z + (this.tz - this.z) * alpha,
      emit
    );
  }
  sample(x, z, emit) {
    if (!this.ready) {
      this.target(x, z);
      return;
    }
    const dx = x - this.x,
      dz = z - this.z,
      distance = Math.hypot(dx, dz),
      oldX = this.x,
      oldZ = this.z;
    this.x = x;
    this.z = z;
    if (distance < 0.00001) return;
    const total = this.residual + distance;
    const count = Math.min(64, Math.floor(total / this.spacing));
    for (let i = 0; i < count; i++) {
      const t = (this.spacing - this.residual + i * this.spacing) / distance;
      emit(oldX + dx * t, oldZ + dz * t);
    }
    this.residual = total - count * this.spacing;
    if (count === 64) this.residual = 0;
  }
}
