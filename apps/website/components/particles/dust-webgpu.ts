// Reuse the WebGPU declarations already supplied by @types/three; no runtime import.
import type {} from "three/webgpu";
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
import { dustWGSL } from "./dust-shader";

type SharedGPU = {
  device: GPUDevice;
  format: GPUTextureFormat;
  pipeline: GPURenderPipeline;
  sampler: GPUSampler;
};

// The hero, feature cards and footer all draw the same shader. One device and
// pipeline serve every canvas; each canvas only owns its picture and uniforms.
let shared: Promise<SharedGPU> | null = null;

function getSharedGPU() {
  shared ??= (async () => {
    if (!navigator.gpu) throw new Error("WebGPU is unavailable");
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });
    if (!adapter) throw new Error("No WebGPU adapter");
    const device = await adapter.requestDevice();
    void device.lost.then(() => {
      shared = null;
    });
    const format = navigator.gpu.getPreferredCanvasFormat();
    device.pushErrorScope("validation");
    const shader = device.createShaderModule({ code: dustWGSL });
    const pipeline = await device.createRenderPipelineAsync({
      layout: "auto",
      vertex: { module: shader, entryPoint: "vertexMain" },
      fragment: {
        module: shader,
        entryPoint: "fragmentMain",
        targets: [
          {
            format,
            // Overlapping dashes add up, so bright areas of the picture glow.
            blend: {
              color: { srcFactor: "one", dstFactor: "one", operation: "add" },
              alpha: { srcFactor: "one", dstFactor: "one", operation: "add" },
            },
          },
        ],
      },
      primitive: { topology: "triangle-list" },
    });
    const sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });
    if (await device.popErrorScope()) throw new Error("Invalid dust shader");
    return { device, format, pipeline, sampler };
  })();
  shared.catch(() => {
    shared = null;
  });
  return shared;
}

/** A single instanced draw, without loading a scene graph or React renderer. */
export const createWebGPURenderer: CreateDustRenderer = (
  canvas,
  { picture: source, active, onReady, onError }
) => {
  let disposed = false;
  let gpu: SharedGPU | undefined;
  let ready = false;
  let frame = 0;
  let startTime: number | undefined;
  let previousTime: number | undefined;
  let controls: DustControls = DUST_CONTROLS;
  let context: GPUCanvasContext | null = null;
  let bindGroup: GPUBindGroup;
  let uniforms: GPUBuffer | undefined;
  let picture: GPUTexture | undefined;
  let pictureAspect = 1;
  const values = new Float32Array(DUST_UNIFORM_BYTES / 4);
  const pointer = createPointer();

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    pointer.dispose();
    gpu?.device.removeEventListener("uncapturederror", fail);
    uniforms?.destroy();
    picture?.destroy();
    context?.unconfigure();
  }

  function fail() {
    if (disposed) return;
    dispose();
    onError();
  }

  function render(now: number) {
    frame = 0;
    if (disposed || !active || !gpu) return;
    try {
      const { device, pipeline } = gpu;
      const size = resizeCanvas(canvas, device.limits.maxTextureDimension2D);
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
        device.queue.writeBuffer(uniforms!, 0, values);
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context!.getCurrentTexture().createView(),
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6, dustInstanceCount(controls));
        pass.end();
        device.queue.submit([encoder.finish()]);
        if (!ready) {
          ready = true;
          void device.queue.onSubmittedWorkDone().then(() => {
            if (!disposed) {
              canvas.dataset.ready = "true";
              onReady();
            }
          }, fail);
        }
      }
      frame = requestAnimationFrame(render);
    } catch {
      fail();
    }
  }

  async function initialize() {
    // Attach rejection handling immediately while device setup runs.
    const imagePromise = loadPicture(source);
    void imagePromise.catch(() => {});
    const [resources, image] = await Promise.all([
      getSharedGPU(),
      imagePromise,
    ]);
    if (disposed) return;
    const { device, format, pipeline, sampler } = resources;
    device.addEventListener("uncapturederror", fail);
    void device.lost.then(fail);
    context = canvas.getContext("webgpu");
    if (!context) {
      fail();
      return;
    }
    context.configure({ device, format, alphaMode: "opaque" });
    pictureAspect = image.naturalWidth / image.naturalHeight;
    picture = device.createTexture({
      size: [image.naturalWidth, image.naturalHeight],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: image },
      { texture: picture },
      [image.naturalWidth, image.naturalHeight]
    );
    uniforms = device.createBuffer({
      size: DUST_UNIFORM_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniforms } },
        { binding: 1, resource: picture.createView() },
        { binding: 2, resource: sampler },
      ],
    });
    gpu = resources;
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
      } else if (!disposed && gpu && !frame) {
        // Re-present the retained scene before the reattached canvas is painted.
        // Subsequent frames still use the normal requestAnimationFrame loop.
        render(performance.now());
      }
    },
    setControls(next) {
      controls = next;
    },
  };
};
