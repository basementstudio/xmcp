import * as THREE from "three";
import { RippleField, colliderGLSL } from "./submerged-field.js";
import { WaterTrail } from "./submerged-input.js";
import { waterPatternGLSL } from "./water-pattern.js";

function oceanCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(39, aspect, 0.1, 100);
  camera.position.set(0, 7.5, 11.5);
  if (aspect < 0.85) camera.position.set(0, 11, 12.5);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  return camera;
}

export const submergedVertex = /* glsl */ `
precision highp float;
precision highp int;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform sampler2D uField;
uniform vec2 uFieldSize;
uniform vec2 uDomain;
uniform float uTime;
uniform float uReveal;
in vec3 position;
in vec3 normal;
out vec3 vWorld;
out vec3 vLocal;
out vec3 vNormal;
out float vShore;
${colliderGLSL}
float fieldAt(vec2 p){
  vec2 uv=p/uDomain+0.5;
  if(any(lessThan(uv,vec2(0)))||any(greaterThan(uv,vec2(1))))return 0.0;
  vec2 grid=uv*(uFieldSize-1.0);
  ivec2 lo=ivec2(floor(grid));ivec2 hi=min(lo+1,ivec2(uFieldSize)-1);
  vec2 f=fract(grid);
  float a=texelFetch(uField,lo,0).r,b=texelFetch(uField,ivec2(hi.x,lo.y),0).r;
  float c=texelFetch(uField,ivec2(lo.x,hi.y),0).r,d=texelFetch(uField,hi,0).r;
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
float heightAt(vec2 p){
  // The same three long waves used in option 7, with simulated wakes added.
  float ambient=0.7*(sin(p.x*0.65+p.y*0.43-uTime*1.1)*0.19+sin(p.x*-0.38+p.y*0.95-uTime*0.8)*0.11+sin(p.x*1.5+p.y*0.65-uTime*1.75)*0.045);
  float distance=glyphDistance(p);
  float solid=1.0-smoothstep(-0.08,0.12,distance);
  float shore=exp(-abs(distance)*8.0);
  // The collider is never drawn: its pressure displaces only the water.
  float surface=mix(ambient+fieldAt(p)*3.0,ambient*0.28+0.12+uReveal*0.22,solid);
  return surface+shore*(0.035+uReveal*0.10);
}
void main(){
  vec4 world=modelMatrix*vec4(position,1.0);
  float h=heightAt(world.xz),e=0.10;
  float dx=(heightAt(world.xz+vec2(e,0))-heightAt(world.xz-vec2(e,0)))/(2.0*e);
  float dz=(heightAt(world.xz+vec2(0,e))-heightAt(world.xz-vec2(0,e)))/(2.0*e);
  world.y=h;
  vWorld=world.xyz;vLocal=position;vNormal=normalize(vec3(-dx,1.0,-dz));
  vShore=exp(-abs(glyphDistance(world.xz))*8.0);
  gl_Position=projectionMatrix*viewMatrix*world;
}`;

export const submergedFragment = /* glsl */ `
precision highp float;
precision highp int;
uniform vec3 uEye;
uniform vec2 uResolution;
uniform float uDensity;
uniform float uReveal;
uniform float uPatternTime;
in vec3 vWorld;
in vec3 vLocal;
in vec3 vNormal;
in float vShore;
out vec4 outputColor;
${waterPatternGLSL}
float stroke(float coordinate){
  float distance=abs(fract(coordinate+0.5)-0.5),width=max(fwidth(coordinate),0.001);
  return(1.0-smoothstep(width*0.32,width*1.15,distance))*(1.0-smoothstep(0.35,0.9,width));
}
void main(){
  vec2 uv=gl_FragCoord.xy/uResolution;
  float sides=smoothstep(0.0,0.15,uv.x)*(1.0-smoothstep(0.85,1.0,uv.x));
  float top=1.0-smoothstep(0.62,0.96,uv.y);
  float bottom=smoothstep(0.0,0.08,uv.y);
  float fog=1.0-smoothstep(18.0,45.0,length(uEye-vWorld));
  float lines=stroke(vWorld.z*uDensity);
  vec2 dash=waterDash(vWorld.xz,uDensity,uPatternTime);
  // Discrete dots in the former vertical columns, never continuous lines.
  float dots=stroke(vWorld.x*uDensity*0.25)*stroke(vWorld.z*uDensity*1.5);
  float light=0.58+0.42*max(dot(normalize(vNormal),normalize(vec3(-0.3,1,0.5))),0.0);
  // Brighten the lines that hug the glyph so the 404 reads clearly in the water.
  float value=0.032+lines*dash.x*(0.64+vShore*(0.55+uReveal*0.45))*light*dash.y+dots*0.09;
  value=mix(9.0/255.0,value,sides*top*bottom*fog);
  outputColor=vec4(vec3(value),1);
}`;

export function makeSubmergedMaterial(field, camera) {
  const texture = new THREE.DataTexture(
    field.current,
    field.nx,
    field.nz,
    THREE.RedFormat,
    THREE.FloatType
  );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: submergedVertex,
    fragmentShader: submergedFragment,
    side: THREE.DoubleSide,
    uniforms: {
      uField: { value: texture },
      uFieldSize: { value: new THREE.Vector2(field.nx, field.nz) },
      uDomain: { value: new THREE.Vector2(field.width, field.depth) },
      uTime: { value: 0 },
      uPatternTime: { value: 0 },
      uEye: { value: camera.position.clone() },
      uDensity: { value: 4 },
      uReveal: { value: 0.34 },
      uCollider: { value: new THREE.Vector3(0, -1.8, 1.2) },
      uResolution: { value: new THREE.Vector2(1, 1) },
    },
  });
  return { material, texture };
}

export function mountSubmerged(element) {
  const canvas = element.querySelector("canvas"),
    status = element.querySelector("#submerged-status"),
    errorLabel = element.querySelector(".ocean-error");
  const motion = element.querySelector("#submerged-motion");
  const abort = new AbortController(),
    events = { signal: abort.signal };
  let renderer,
    scene,
    camera,
    water,
    material,
    texture,
    observer,
    frame = 0,
    disposed = false,
    failed = false;
  let field = new RippleField(),
    elapsed = 0,
    last = performance.now(),
    accumulator = 0,
    power = 0.75,
    activeUntil = 0,
    reveal = 0.34;
  const mouse = new THREE.Vector2(),
    point = new THREE.Vector3(),
    raycaster = new THREE.Raycaster(),
    plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const trail = new WaterTrail();
  let demoPending = true;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function fail() {
    if (disposed || failed) return;
    failed = true;
    cancelAnimationFrame(frame);
    status.textContent = "RENDER ERROR";
    errorLabel.hidden = false;
    errorLabel.textContent =
      "The interactive artwork is unavailable. You can still return home or read the docs.";
  }
  function inject(x, z, amount = 1, radius = 0.62) {
    field.disturb(x, z, power * 0.2 * amount, radius);
    texture.image.data = field.current;
    texture.needsUpdate = true;
    activeUntil = elapsed + 3;
    motion.textContent = "DISTURBED";
  }
  function pointer(event, force = false) {
    if (!camera || !texture) return;
    const r = canvas.getBoundingClientRect();
    mouse.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      (-(event.clientY - r.top) / r.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    if (!raycaster.ray.intersectPlane(plane, point)) return;
    if (Math.abs(point.x) > 10.8 || Math.abs(point.z) > 7.8) return;
    if (force) inject(point.x, point.z, 1.65, 0.72);
    trail.target(point.x, point.z);
  }
  function sendRipple() {
    const portrait = camera.aspect < 0.85;
    inject(-2.2, portrait ? -2.7 : -1.8, 1.7);
  }
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "default",
    });
    renderer.setClearColor(0x090909, 1);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.debug.onShaderError = (gl, program, vs, fs) =>
      fail(
        new Error(
          gl.getShaderInfoLog(vs) ||
            gl.getShaderInfoLog(fs) ||
            gl.getProgramInfoLog(program)
        )
      );
    scene = new THREE.Scene();
    camera = oceanCamera(1);
    ({ material, texture } = makeSubmergedMaterial(field, camera));
    const geometry = new THREE.PlaneGeometry(40, 36, 320, 288);
    geometry.rotateX(-Math.PI / 2);
    water = new THREE.Mesh(geometry, material);
    scene.add(water);
    function resize() {
      const r = canvas.getBoundingClientRect(),
        oldPortrait = camera.aspect < 0.85;
      camera = oceanCamera(r.width / Math.max(r.height, 1));
      renderer.setSize(r.width, r.height, false);
      material.uniforms.uEye.value.copy(camera.position);
      renderer.getDrawingBufferSize(material.uniforms.uResolution.value);
      const portrait = camera.aspect < 0.85;
      if (oldPortrait !== portrait || demoPending) {
        field.setCollider(
          0,
          portrait ? -2.5 : -1.8,
          portrait ? 0.78 : 1.2
        );
        material.uniforms.uCollider.value.set(
          0,
          portrait ? -2.5 : -1.8,
          portrait ? 0.78 : 1.2
        );
        trail.leave();
        texture.image.data = field.current;
        texture.needsUpdate = true;
      }
    }
    observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    canvas.style.cursor = "crosshair";
    canvas.addEventListener("pointermove", (e) => pointer(e), events);
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        canvas.focus({ preventScroll: true });
        pointer(e, true);
      },
      events
    );
    canvas.addEventListener("pointerleave", () => trail.leave(), events);
    canvas.addEventListener(
      "keydown",
      (e) => {
        if (e.code === "Space" || e.key === "Enter") {
          e.preventDefault();
          sendRipple();
        }
        if (e.key.toLowerCase() === "r") {
          field.clear();
          texture.needsUpdate = true;
        }
      },
      events
    );
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        fail(
          new Error(
            "The graphics context was lost. Reload to restore the water."
          )
        );
      },
      events
    );
    element.querySelector("#submerged-power").addEventListener(
      "input",
      (e) => {
        power = Number(e.target.value);
      },
      events
    );
    element.querySelector("#submerged-lines").addEventListener(
      "input",
      (e) => {
        material.uniforms.uDensity.value = Number(e.target.value);
      },
      events
    );
    element
      .querySelector("#submerged-send")
      .addEventListener("click", sendRipple, events);
    element.querySelector("#submerged-clear").addEventListener(
      "click",
      () => {
        field.clear();
        texture.image.data = field.current;
        texture.needsUpdate = true;
        motion.textContent = "STILL";
      },
      events
    );
    status.textContent = "404 / SOMEWHERE BELOW";
    function draw(now) {
      if (disposed || failed) return;
      try {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!document.hidden && element.dataset.paused !== "true") {
          elapsed += dt;
          accumulator += dt;
          trail.advance(dt, (x, z) => inject(x, z, 0.27, 0.5));
          reveal +=
            ((elapsed < activeUntil ? 1 : 0.34) - reveal) *
            (1 - Math.exp(-dt * 3));
          material.uniforms.uReveal.value = reduced ? 0.45 : reveal;
          if (demoPending && elapsed > 0.45) {
            demoPending = false;
            if (!reduced) sendRipple();
          }
          let steps = 0;
          while (accumulator >= 1 / 60 && steps < 3) {
            field.step();
            accumulator -= 1 / 60;
            steps++;
          }
          texture.image.data = field.current;
          texture.needsUpdate = true;
          material.uniforms.uTime.value = reduced ? 0 : elapsed;
          material.uniforms.uPatternTime.value = reduced ? 0 : elapsed;
          if (elapsed > activeUntil) motion.textContent = "SETTLING";
          renderer.render(scene, camera);
        }
        frame = requestAnimationFrame(draw);
      } catch (error) {
        fail(error);
      }
    }
    frame = requestAnimationFrame(draw);
  } catch (error) {
    fail(error);
  }
  return () => {
    disposed = true;
    abort.abort();
    cancelAnimationFrame(frame);
    observer?.disconnect();
    water?.geometry.dispose();
    material?.dispose();
    texture?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
  };
}
