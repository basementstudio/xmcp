import {
  DUST_CONTROLS,
  DUST_UNIFORM_BYTES,
  createPointer,
  dustInstanceCount,
  loadPicture,
  resizeCanvas,
  writeDustUniforms,
  type CreateDustRenderer,
  type DustControls,
} from "./dust";
import { dustFragmentGLSL, dustVertexGLSL } from "./dust-shader";

const UNIFORMS = ["frame", "shape", "look", "extra", "pointer", "drag"];

/** WebGL2 port of the WebGPU renderer for browsers without WebGPU. */
export const createWebGLRenderer: CreateDustRenderer = (
  canvas,
  { picture: source, active, onReady, onError }
) => {
  let disposed = false;
  let initialized = false;
  let ready = false;
  let pictureAspect = 1;
  let picture: WebGLTexture | null = null;
  let frame = 0;
  let startTime: number | undefined;
  let previousTime: number | undefined;
  let controls: DustControls = DUST_CONTROLS;
  const values = new Float32Array(DUST_UNIFORM_BYTES / 4);
  const pointer = createPointer();
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  const program = gl?.createProgram() ?? null;
  if (gl && program) {
    for (const [type, code] of [
      [gl.VERTEX_SHADER, dustVertexGLSL],
      [gl.FRAGMENT_SHADER, dustFragmentGLSL],
    ] as const) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, code);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
  }
  const linked =
    !!gl && !!program && gl.getProgramParameter(program, gl.LINK_STATUS);
  const locations = linked
    ? UNIFORMS.map((name) => gl!.getUniformLocation(program!, name))
    : [];

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    pointer.dispose();
    canvas.removeEventListener("webglcontextlost", fail);
    if (gl && program) gl.deleteProgram(program);
    if (gl && picture) gl.deleteTexture(picture);
  }

  function fail() {
    if (disposed) return;
    dispose();
    onError();
  }

  function render(now: number) {
    frame = 0;
    if (disposed || !active || !initialized || !gl) return;
    const size = resizeCanvas(canvas, gl.getParameter(gl.MAX_TEXTURE_SIZE));
    if (size) {
      startTime ??= now;
      const elapsed = (now - (previousTime ?? now)) / 1000;
      previousTime = now;
      writeDustUniforms(
        values,
        controls,
        canvas,
        (now - startTime) / 1000,
        size.pixelRatio,
        pictureAspect,
        pointer.update(size.rect, size.pixelRatio, elapsed)
      );
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, picture);
      locations.forEach((location, i) =>
        gl.uniform4fv(location, values, i * 4, 4)
      );
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, dustInstanceCount(controls));
      if (!ready) {
        ready = true;
        canvas.dataset.ready = "true";
        onReady();
      }
    }
    frame = requestAnimationFrame(render);
  }

  async function initialize() {
    if (!linked) {
      fail();
      return;
    }
    const context = gl!;
    canvas.addEventListener("webglcontextlost", fail);
    const image = await loadPicture(source);
    if (disposed) return;
    pictureAspect = image.naturalWidth / image.naturalHeight;
    picture = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, picture);
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      context.RGBA,
      context.RGBA,
      context.UNSIGNED_BYTE,
      image
    );
    for (const [name, value] of [
      [context.TEXTURE_MIN_FILTER, context.LINEAR],
      [context.TEXTURE_MAG_FILTER, context.LINEAR],
      [context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE],
      [context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE],
    ])
      context.texParameteri(context.TEXTURE_2D, name, value);
    context.useProgram(program);
    context.uniform1i(context.getUniformLocation(program!, "picture"), 0);
    context.enable(context.BLEND);
    // Overlapping dashes add up, so bright areas of the picture glow.
    context.blendFunc(context.ONE, context.ONE);
    initialized = true;
    if (active) frame = requestAnimationFrame(render);
  }

  void initialize().catch(fail);
  return {
    dispose,
    setActive(next) {
      active = next;
      if (!active) {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = undefined;
      } else if (!disposed && initialized && !frame) {
        render(performance.now());
      }
    },
    setControls(next) {
      controls = next;
    },
  };
};
