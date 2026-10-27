import { dashNoiseGLSL } from "./matrix-pattern.js";
// The moving dash / twinkle / light-band treatment from the 404, evaluated
// along water-surface coordinates so it follows every wave and collider crest.
export const waterPatternGLSL = /* glsl */ `
${dashNoiseGLSL}
vec2 waterDash(vec2 position,float density,float seconds){
  float time=seconds*1.72;
  float row=floor(position.y*density+0.5);
  float flow=time*0.55*(1.4+sin(row*0.17));
  float along=position.x*density*6.0-flow;
  float column=floor(along);
  uint seed=uint(int(column))*19349663u^uint(int(row))*73856093u;
  float a=dashRandom(seed*4u),b=dashRandom(seed*4u+1u),c=dashRandom(seed*4u+2u),d=dashRandom(seed*4u+3u);
  float center=0.5+(a-0.5)*0.18;
  float halfLength=0.5*0.63*mix(0.6,1.2,c)*1.15;
  float width=max(fwidth(along)*0.65,0.025);
  float coverage=1.0-smoothstep(halfLength-width,halfLength+width,abs(fract(along)-center));
  if(c>0.92)coverage=0.0;
  float twinkle=0.5+0.5*sin(time*(0.8+d*2.4)+b*6.2831853);
  float band=0.5+0.5*sin(position.y*0.7+position.x*0.16+time*0.45);
  float intensity=mix(0.35,1.0,twinkle)*mix(0.65,1.0,band)*mix(0.6,1.0,a)*(d>0.9?1.65:1.0);
  return vec2(coverage,intensity);
}
`;
