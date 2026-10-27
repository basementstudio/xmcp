// Keep the CPU buoyancy and vertex displacement equations identical.
export const RIPPLE_COUNT = 24;
export function wakeAmplitude(speed) {
  return Math.min(0.18, 0.07 + speed * 0.015);
}
export function waveHeight(x, z, time, strength = 0.7, ripples = []) {
  let height =
    strength *
    (Math.sin(x * 0.65 + z * 0.43 - time * 1.1) * 0.19 +
      Math.sin(x * -0.38 + z * 0.95 - time * 0.8) * 0.11 +
      Math.sin(x * 1.5 + z * 0.65 - time * 1.75) * 0.045);
  for (const ripple of ripples) {
    const age = time - ripple.z;
    if (age < 0 || age > 7) continue;
    const distance = Math.hypot(x - ripple.x, z - ripple.y);
    const ring = distance - age * 1.8;
    height +=
      ripple.w *
      Math.sin(distance * 5.4 - age * 4.0) *
      Math.exp(-ring * ring * 0.8 - age * 0.42) *
      Math.min(age * 4, 1);
  }
  return height;
}
export function waterNormal(x, z, time, strength, ripples) {
  const e = 0.08;
  const dx =
    (waveHeight(x + e, z, time, strength, ripples) -
      waveHeight(x - e, z, time, strength, ripples)) /
    (2 * e);
  const dz =
    (waveHeight(x, z + e, time, strength, ripples) -
      waveHeight(x, z - e, time, strength, ripples)) /
    (2 * e);
  const length = Math.hypot(dx, 1, dz);
  return [-dx / length, 1 / length, -dz / length];
}
export const waveGLSL = /* glsl */ `
uniform float uTime;
uniform float uStrength;
uniform vec4 uRipples[${RIPPLE_COUNT}];
float waveHeight(vec2 p){
  float h=uStrength*(sin(p.x*0.65+p.y*0.43-uTime*1.1)*0.19+sin(p.x*-0.38+p.y*0.95-uTime*0.8)*0.11+sin(p.x*1.5+p.y*0.65-uTime*1.75)*0.045);
  for(int i=0;i<${RIPPLE_COUNT};i++){
    vec4 r=uRipples[i];float age=uTime-r.z;
    if(age<0.0||age>7.0)continue;
    float d=length(p-r.xy),ring=d-age*1.8;
    h+=r.w*sin(d*5.4-age*4.0)*exp(-ring*ring*0.8-age*0.42)*min(age*4.0,1.0);
  }
  return h;
}
vec3 waveNormal(vec2 p){
  float e=0.08;
  float dx=(waveHeight(p+vec2(e,0))-waveHeight(p-vec2(e,0)))/(2.0*e);
  float dz=(waveHeight(p+vec2(0,e))-waveHeight(p-vec2(0,e)))/(2.0*e);
  return normalize(vec3(-dx,1.0,-dz));
}
`;
