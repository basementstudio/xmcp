import {
  DASH_ROWS,
  DASH_COLUMNS,
  dashVertex,
  dashFragment,
  LogoPointer,
} from "./matrix-pattern.js";

// "Lost context" reuses option 9's moving-dash 404: the same instanced horizontal
// dashes shaped by the shared SDF, centered in the panel and drawn as ink that
// follows the site theme. The pointer pushes the dashes just like the code rain.
export function mountContext(element) {
  const canvas = element.querySelector("canvas");
  const status = element.querySelector("#context-status");
  const errorLabel = element.querySelector(".ocean-error");
  const abort = new AbortController(),
    events = { signal: abort.signal };
  let gl,
    program,
    vao,
    observer,
    frame = 0,
    disposed = false,
    failed = false,
    elapsed = 0,
    last = performance.now(),
    pixelRatio = 1;
  let target = [0, 0],
    inside = false;
  const pointer = new LogoPointer();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shaders = [];

  function fail() {
    if (disposed || failed) return;
    failed = true;
    cancelAnimationFrame(frame);
    if (status) status.textContent = "Context unavailable";
    if (errorLabel) {
      errorLabel.hidden = false;
      errorLabel.textContent =
        "The interactive artwork is unavailable. You can still return home or read the docs.";
    }
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
  // Centered layout: fill the dedicated art box without touching the edges.
  function layout() {
    const w = canvas.width,
      h = canvas.height;
    const unit = Math.min(h * 0.42, w * 0.26);
    return { cx: w * 0.5, cy: h * 0.5, unit, width: unit * 3.7, height: unit * 2.08 };
  }
  function ink() {
    // Ink follows the theme: bright over the dark pages, dark over light ones.
    return document.documentElement.classList.contains("dark")
      ? [0.92, 0.92, 0.92]
      : [0.08, 0.08, 0.08];
  }

  try {
    gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "default",
    });
    if (!gl) throw new Error("WebGL2 is unavailable in this browser session.");
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, dashVertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, dashFragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program));
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.useProgram(program);
    const uniforms = Object.fromEntries(
      ["uResolution", "uLayout", "uTime", "uInteraction", "uDrag", "uInk"].map(
        (name) => [name, gl.getUniformLocation(program, name)]
      )
    );
    const limit = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    function resize() {
      const r = canvas.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio || 1, 2);
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
        fail(new Error("The graphics context was lost."));
      },
      events
    );
    if (status) status.textContent = "Context partially recovered";
    gl.enable(gl.BLEND);
    // The shared dash fragment outputs premultiplied color (uInk * coverage).
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    function draw(now) {
      if (disposed || failed) return;
      try {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!document.hidden) {
          if (!reduced) elapsed += dt;
          const box = layout();
          const px = (target[0] * 0.5 + 0.5) * canvas.width - box.cx,
            py = box.cy - (target[1] * 0.5 + 0.5) * canvas.height;
          const hover =
            !reduced &&
            inside &&
            Math.abs(px) < box.width * 0.6 &&
            Math.abs(py) < box.height * 0.6;
          pointer.update(px, py, hover, dt);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
          gl.uniform4f(uniforms.uLayout, box.cx, box.cy, box.unit, pixelRatio);
          gl.uniform1f(uniforms.uTime, elapsed);
          gl.uniform4f(
            uniforms.uInteraction,
            pointer.x,
            pointer.y,
            box.height * 0.35,
            pointer.presence
          );
          gl.uniform2f(uniforms.uDrag, pointer.vx, pointer.vy);
          gl.uniform3f(uniforms.uInk, ...ink());
          gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, DASH_ROWS * DASH_COLUMNS);
          if (status)
            status.textContent =
              pointer.presence > 0.35
                ? "Context streaming into place"
                : "Context partially recovered";
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
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  };
}
