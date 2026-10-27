import {
  matrixLayout,
  LogoPointer,
  DASH_ROWS,
  DASH_COLUMNS,
  dashVertex,
  dashFragment,
} from "./matrix-pattern.js";
// Small bitmap glyphs keep the rain crisp and self-contained: no font atlas,
// external textures, or runtime text rasterization.
const glyphs = [
  ["0110", "1001", "1001", "1001", "1001", "0110"],
  ["0010", "0110", "0010", "0010", "0010", "0111"],
  ["1110", "0001", "0010", "0100", "1000", "1111"],
  ["1001", "1001", "1111", "0001", "0001", "0001"],
  ["0000", "1001", "0110", "0110", "1001", "0000"],
  ["0000", "1111", "1011", "1001", "1001", "0000"],
  ["0000", "0111", "1000", "1000", "0111", "0000"],
  ["0000", "1110", "1001", "1110", "1000", "1000"],
  ["0001", "0001", "0010", "0100", "1000", "1000"],
  ["1000", "1000", "0100", "0010", "0001", "0001"],
  ["0001", "0010", "0100", "0100", "0010", "0001"],
  ["1000", "0100", "0010", "0010", "0100", "1000"],
  ["0011", "0010", "1100", "0010", "0010", "0011"],
  ["1100", "0100", "0011", "0100", "0100", "1100"],
  ["0111", "0100", "0100", "0100", "0100", "0111"],
  ["1110", "0010", "0010", "0010", "0010", "1110"],
  ["0000", "0010", "1111", "0010", "0000", "0000"],
  ["0000", "1111", "0000", "1111", "0000", "0000"],
  ["0000", "0010", "0000", "0000", "0010", "0000"],
  ["0000", "0010", "0000", "0010", "0100", "0000"],
  ["0000", "0000", "1111", "0000", "0000", "0000"],
  ["1111", "0001", "0010", "0010", "0100", "0100"],
  ["0110", "1001", "0111", "0001", "0010", "1100"],
  ["0110", "1001", "0110", "1001", "1001", "0110"],
];
const bits = glyphs.map((rows) =>
  [...rows.join("")].reduce(
    (value, bit, index) => value + (bit === "1" ? 2 ** index : 0),
    0
  )
);
export const matrixVertex = `#version 300 es
precision highp float;
void main(){float x=float((gl_VertexID<<1)&2),y=float(gl_VertexID&2);gl_Position=vec4(x*2.0-1.0,y*2.0-1.0,0,1);}`;
export const matrixFragment = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uResolution;
uniform float uTime;
uniform float uDensity;
out vec4 outputColor;
const uint FONT[${bits.length}]=uint[${bits.length}](${bits.map((n) => `${n}u`).join(",")});
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,vec2(0)))+min(max(q.x,q.y),0.0)-r;}
float four(vec2 p){return min(min(box(p-vec2(-0.28,-0.30),vec2(0.12,0.52),0.008),box(p-vec2(0.28,0),vec2(0.12,0.82),0.008)),box(p-vec2(0,0.08),vec2(0.40,0.12),0.008));}
float shape404(vec2 p){float zero=max(box(p,vec2(0.43,0.82),0.05),-box(p,vec2(0.19,0.55),0.03));return min(min(four(p+vec2(1.12,0)),zero),four(p-vec2(1.12,0)));}
float glyph(vec2 grid,float seed){
  ivec2 pixel=ivec2(floor(grid));
  if(pixel.x<0||pixel.x>3||pixel.y<0||pixel.y>5)return 0.0;
  uint pattern=FONT[int(floor(seed*float(${bits.length})))%${bits.length}];
  uint bit=(pattern>>uint(pixel.y*4+pixel.x))&1u;
  vec2 edge=abs(fract(grid)-0.5);
  float coverage=1.0-smoothstep(0.34,0.50,max(edge.x,edge.y));
  return float(bit)*coverage;
}
void main(){
  vec2 p=vec2(gl_FragCoord.x,uResolution.y-gl_FragCoord.y);
  vec2 uv=p/uResolution;
  bool mobile=uResolution.x/uResolution.y<0.85;
  vec2 center=uResolution*vec2(mobile?0.5:0.655,mobile?0.30:0.46);
  float unit=min(uResolution.y*0.205,uResolution.x*(mobile?0.205:0.13));
  float jitter=sin(p.y*0.047+uTime*0.7)*1.2+sin(p.y*0.011-uTime*0.6)*2.2;
  float d=shape404((p-center-vec2(jitter,0))/unit);
  float edgeGrain=(hash(floor(p/vec2(2.0,3.0)))-0.5)*0.018;
  float mask=1.0-smoothstep(-0.005,0.012,d+edgeGrain);

  vec2 cell=vec2(11.0,17.0)/uDensity;
  vec2 rainPoint=p;
  float column=floor(rainPoint.x/cell.x);
  float lane=hash(vec2(column,21.0));
  float speed=3.5+lane*8.0;
  float row=floor(p.y/cell.y);
  float count=uResolution.y/cell.y;
  float head=mod(lane*(count+24.0)+uTime*speed,count+24.0)-8.0;
  float trail=mod(head-row+count+24.0,count+24.0);
  float tail=exp(-trail/(4.5+lane*7.0));
  float leading=1.0-smoothstep(0.0,1.25,trail);
  float seed=hash(vec2(column*1.37,row+floor(uTime*(2.0+lane*5.0))));
  vec2 local=fract(rainPoint/cell)*vec2(5.0,8.0);
  float code=glyph(local,seed);
  float rain=code*(tail*0.30+leading*0.34)*(0.20+lane*0.8);

  // The 404 is drawn by the animated instanced-dash pass, not a static mask.
  float value=9.0/255.0+rain*(1.0-mask*0.5);
  float edges=smoothstep(0.0,0.07,uv.x)*(1.0-smoothstep(0.94,1.0,uv.x));
  edges*=smoothstep(0.0,0.10,uv.y)*(1.0-smoothstep(0.84,1.0,uv.y));
  value=mix(9.0/255.0,value,edges);
  outputColor=vec4(vec3(clamp(value,0.0,1.0)),1);
}`;

export function mountMatrix(element) {
  const canvas = element.querySelector("canvas"),
    status = element.querySelector("#matrix-status"),
    errorLabel = element.querySelector(".ocean-error");
  const abort = new AbortController(),
    events = { signal: abort.signal };
  let gl,
    program,
    patternProgram,
    vao,
    observer,
    frame = 0,
    disposed = false,
    failed = false,
    elapsed = 0,
    last = performance.now(),
    speed = 0.65,
    density = 1,
    paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let target = [0, 0],
    inside = false,
    pixelRatio = 1;
  const logoPointer = new LogoPointer();
  const shaders = [];
  function fail() {
    if (disposed || failed) return;
    failed = true;
    cancelAnimationFrame(frame);
    status.textContent = "SIGNAL INTERRUPTED";
    errorLabel.hidden = false;
    errorLabel.textContent =
      "The interactive artwork is unavailable. You can still return home or read the docs.";
  }
  function compile(type, source) {
    const shader = gl.createShader(type);
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const pauseButton = element.querySelector("#matrix-pause");
  function updatePause() {
    pauseButton.textContent = paused ? "RESUME RAIN ↻" : "PAUSE RAIN Ⅱ";
    pauseButton.setAttribute("aria-pressed", String(paused));
  }
  try {
    gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "default",
    });
    if (!gl) throw new Error("WebGL2 is unavailable in this browser session.");
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, matrixVertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, matrixFragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program));
    patternProgram = gl.createProgram();
    gl.attachShader(patternProgram, compile(gl.VERTEX_SHADER, dashVertex));
    gl.attachShader(patternProgram, compile(gl.FRAGMENT_SHADER, dashFragment));
    gl.linkProgram(patternProgram);
    if (!gl.getProgramParameter(patternProgram, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(patternProgram));
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.useProgram(program);
    const uniforms = Object.fromEntries(
      ["uResolution", "uTime", "uDensity"].map((name) => [
        name,
        gl.getUniformLocation(program, name),
      ])
    );
    const patternUniforms = Object.fromEntries(
      ["uResolution", "uLayout", "uTime", "uInteraction", "uDrag", "uInk"].map(
        (name) => [name, gl.getUniformLocation(patternProgram, name)]
      )
    );
    const limit = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    function resize() {
      const r = canvas.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio || 1, 1.5);
      pixelRatio = dpr;
      canvas.width = Math.max(1, Math.min(limit, Math.round(r.width * dpr)));
      canvas.height = Math.max(1, Math.min(limit, Math.round(r.height * dpr)));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    canvas.addEventListener(
      "pointermove",
      (event) => {
        const r = canvas.getBoundingClientRect();
        target = [
          ((event.clientX - r.left) / r.width) * 2 - 1,
          ((event.clientY - r.top) / r.height) * 2 - 1,
        ];
        inside = true;
      },
      events
    );
    canvas.addEventListener(
      "pointerleave",
      () => {
        inside = false;
      },
      events
    );
    canvas.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        fail(
          new Error(
            "The graphics context was lost. Reload to restore the signal."
          )
        );
      },
      events
    );
    element.querySelector("#matrix-speed").addEventListener(
      "input",
      (e) => {
        speed = Number(e.target.value);
      },
      events
    );
    element.querySelector("#matrix-density").addEventListener(
      "input",
      (e) => {
        density = Number(e.target.value);
      },
      events
    );
    pauseButton.addEventListener(
      "click",
      () => {
        paused = !paused;
        updatePause();
      },
      events
    );
    updatePause();
    status.textContent = "SIGNAL PRESENT / RESOURCE MISSING";
    function draw(now) {
      if (disposed || failed) return;
      try {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!document.hidden && element.dataset.paused !== "true") {
          if (!paused) elapsed += dt * speed;
          const layout = matrixLayout(canvas.width, canvas.height);
          const px = (target[0] * 0.5 + 0.5) * canvas.width - layout.cx,
            py = layout.cy - (target[1] * 0.5 + 0.5) * canvas.height;
          const hover =
            inside &&
            Math.abs(px) < layout.width * 0.6 &&
            Math.abs(py) < layout.height * 0.6;
          logoPointer.update(px, py, hover, dt);
          gl.disable(gl.BLEND);
          gl.useProgram(program);
          gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
          gl.uniform1f(uniforms.uTime, elapsed);
          gl.uniform1f(uniforms.uDensity, density);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.ONE, gl.ONE);
          gl.useProgram(patternProgram);
          gl.uniform2f(
            patternUniforms.uResolution,
            canvas.width,
            canvas.height
          );
          gl.uniform4f(
            patternUniforms.uLayout,
            layout.cx,
            layout.cy,
            layout.unit,
            pixelRatio
          );
          gl.uniform1f(patternUniforms.uTime, elapsed);
          gl.uniform4f(
            patternUniforms.uInteraction,
            logoPointer.x,
            logoPointer.y,
            layout.height * 0.35,
            logoPointer.presence
          );
          gl.uniform2f(patternUniforms.uDrag, logoPointer.vx, logoPointer.vy);
          gl.uniform3f(patternUniforms.uInk, 1, 1, 1);
          gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, DASH_ROWS * DASH_COLUMNS);
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
    if (gl) {
      for (const shader of shaders) gl.deleteShader(shader);
      if (vao) gl.deleteVertexArray(vao);
      if (program) gl.deleteProgram(program);
      if (patternProgram) gl.deleteProgram(patternProgram);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  };
}
