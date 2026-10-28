// Reference: https://xmcp.dev/templates — a field of moving horizontal dashes,
// with a smooth radial pointer force and velocity-following drag.
export const DASH_ROWS = 56;
export const DASH_COLUMNS = 260;
export const dashNoiseGLSL = /* glsl */ `
float dashRandom(uint seed){
  uint value=seed*747796405u+2891336453u;
  value=((value>>((value>>28u)+4u))^value)*277803737u;
  return float((value>>22u)^value)/4294967295.0;
}
`;
export function matrixLayout(width, height) {
  const mobile = width / height < 0.85;
  const unit = Math.min(height * 0.205, width * (mobile ? 0.205 : 0.13));
  return {
    cx: width * (mobile ? 0.5 : 0.655),
    cy: height * (mobile ? 0.3 : 0.46),
    unit,
    width: unit * 3.7,
    height: unit * 2.08,
  };
}
export class LogoPointer {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.presence = 0;
    this.started = false;
  }
  update(x, y, inside, dt) {
    dt = Math.min(Math.max(dt, 0), 0.1);
    if (!this.started && inside) {
      this.x = x;
      this.y = y;
      this.started = true;
    }
    const oldX = this.x,
      oldY = this.y,
      follow = 1 - Math.exp(-dt * 7);
    this.x += (x - this.x) * follow;
    this.y += (y - this.y) * follow;
    const velocity = 1 - Math.exp(-dt * 5);
    if (dt > 0) {
      this.vx += ((this.x - oldX) / dt - this.vx) * velocity;
      this.vy += ((this.y - oldY) / dt - this.vy) * velocity;
    }
    this.presence +=
      ((inside ? 1 : 0) - this.presence) *
      (1 - Math.exp(-dt * (inside ? 4 : 1.5)));
    return this;
  }
}
export const shapeGLSL = /* glsl */ `
float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,vec2(0)))+min(max(q.x,q.y),0.0)-r;}
float four(vec2 p){return min(min(box(p-vec2(-0.28,-0.30),vec2(0.12,0.52),0.008),box(p-vec2(0.28,0),vec2(0.12,0.82),0.008)),box(p-vec2(0,0.08),vec2(0.40,0.12),0.008));}
float shape404(vec2 p){float zero=max(box(p,vec2(0.43,0.82),0.05),-box(p,vec2(0.19,0.55),0.03));return min(min(four(p+vec2(1.12,0)),zero),four(p-vec2(1.12,0)));}
`;
export const dashVertex = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uResolution;
uniform vec4 uLayout;
uniform float uTime;
uniform vec4 uInteraction;
uniform vec2 uDrag;
out vec2 vLocal;
flat out vec3 vDash;
${shapeGLSL}
${dashNoiseGLSL}
void main(){
  uint id=uint(gl_InstanceID),column=id%${DASH_COLUMNS}u,row=id/${DASH_COLUMNS}u;
  float a=dashRandom(id*4u),b=dashRandom(id*4u+1u),c=dashRandom(id*4u+2u),d=dashRandom(id*4u+3u);
  float t=uTime*2.65;
  float v=(float(row)+0.5)/float(${DASH_ROWS});
  float flow=t*0.012*(1.4+sin(v*18.7));
  float x=fract((float(column)+(a-0.5)*0.7)/float(${DASH_COLUMNS})+flow);
  vec2 size=uLayout.z*vec2(3.7,2.08);
  vec2 base=(vec2(x,v)-0.5)*size;
  // Average the analytic glyph over a small cell, like sampling the logo art.
  float tone=0.0;
  for(int i=0;i<5;i++){
    vec2 delta=vec2(float(i%3)-1.0,float(i/3)*2.0-1.0)*vec2(0.3/float(${DASH_COLUMNS}),0.3/float(${DASH_ROWS}))*size;
    tone+=1.0-smoothstep(-0.003,0.006,shape404((base+delta)/uLayout.z));
  }
  float luminance=clamp(tone*0.34,0.0,1.0);
  float wave=sin(x*9.42477796+v*18.7-t*0.8)*0.12/float(${DASH_ROWS});
  vec2 center=vec2(base.x,-base.y-wave*size.y);
  vec2 delta=center-uInteraction.xy;
  float reach=uInteraction.z;
  float touch=exp(-dot(delta,delta)/(reach*reach))*uInteraction.w;
  vec2 outward=delta/max(length(delta),1.0);
  vec2 pull=clamp(uDrag*0.04,vec2(-reach*0.3),vec2(reach*0.3));
  center+=(outward*reach*0.14+pull)*touch;
  float halfLength=0.5*size.x/float(${DASH_COLUMNS})*0.63*mix(0.6,1.2,c)*mix(0.55,1.15,luminance)*(1.0+touch*0.6);
  float halfWidth=max(0.5,0.6*uLayout.w);
  float twinkle=0.5+0.5*sin(t*(0.8+d*2.4)+b*6.2831853);
  float band=0.5+0.5*sin(v*7.539822+x*2.0+t*0.45);
  float edge=smoothstep(0.0,0.06,x)*(1.0-smoothstep(0.94,1.0,x));
  float vignette=1.0-0.2*smoothstep(0.25,1.2,length(center/size*2.0));
  float intensity=2.4*(pow(luminance,1.3)+0.015+touch*0.06)*mix(mix(0.2,0.6,luminance),1.0,twinkle)*mix(0.65,1.0,band)*edge*vignette*mix(0.6,1.0,a)*(d>0.9?2.0:1.0)*(1.0+touch*0.6);
  if(c>0.92)intensity=0.0;
  int vertex=gl_VertexID;
  vec2 corner=vec2((vertex==1||vertex==4||vertex==5)?1.0:-1.0,(vertex==2||vertex==3||vertex==5)?1.0:-1.0);
  vLocal=corner*vec2(halfLength+halfWidth+1.0,halfWidth+1.0);
  vec2 origin=vec2(uLayout.x,uResolution.y-uLayout.y);
  gl_Position=intensity>0.002?vec4((origin+center+vLocal)/uResolution*2.0-1.0,0,1):vec4(2,2,0,1);
  vDash=vec3(halfLength,halfWidth,intensity);
}`;
export const dashFragment = /* glsl */ `#version 300 es
precision highp float;
uniform vec3 uInk;
in vec2 vLocal;
flat in vec3 vDash;
out vec4 outputColor;
void main(){
  float along=max(abs(vLocal.x)-vDash.x,0.0);
  float coverage=clamp(vDash.y+0.5-length(vec2(along,vLocal.y)),0.0,1.0);
  // uInk is white for the additive code-rain; the alpha channel lets the same
  // dashes blend as ink over a light background in the "Lost context" scene.
  outputColor=vec4(uInk*vDash.z*coverage,vDash.z*coverage);
}`;
