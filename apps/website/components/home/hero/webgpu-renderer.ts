// Reuse the WebGPU declarations already supplied by @types/three; no runtime import.
import type {} from "three/webgpu";
import {
  HERO_CONTROLS,
  type ParticleControls,
} from "@/components/particles/controls";
import { heroShader } from "./webgpu-shader";

const CAMERA_DISTANCE = 18;
const PROJECTION_SCALE = 1 / Math.tan((35 * Math.PI) / 360);
const SAMPLE_COUNT = 4;
const UNIFORM_BYTES = 64;

function loadImage(source: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = source;
  return image.decode().then(() => image);
}

/** A single particle draw, without loading a scene graph or React renderer. */
export function createHeroRenderer(
  canvas: HTMLCanvasElement,
  active: boolean,
  onReady: () => void,
  onError: () => void
) {
  let disposed = false;
  let initialized = false;
  let frame = 0;
  let startTime: number | undefined;
  let ready = false;
  let controls: ParticleControls = HERO_CONTROLS;
  let device: GPUDevice | undefined;
  let context: GPUCanvasContext | null = null;
  let pipeline: GPURenderPipeline;
  let bindGroup: GPUBindGroup;
  let vertices: GPUBuffer;
  let uniforms: GPUBuffer;
  let picture: GPUTexture;
  let trail: GPUTexture;
  let color: GPUTexture | undefined;
  let depth: GPUTexture | undefined;
  let sampler: GPUSampler;
  let format: GPUTextureFormat;
  let imageAspect = 850 / 742;
  let particleCount = 0;
  const textures = new Set<GPUTexture>();
  const buffers = new Set<GPUBuffer>();
  const values = new Float32Array(UNIFORM_BYTES / 4);
  const displacement = document.createElement("canvas");
  const paint = displacement.getContext("2d");
  const glow = new Image();
  glow.src = "/glow.png";
  const cursor = {
    x: 9999,
    y: 9999,
    targetX: 9999,
    targetY: 9999,
    smoothX: 9999,
    smoothY: 9999,
    previousX: 9999,
    previousY: 9999,
    paintedX: 9999,
    paintedY: 9999,
    velocityX: 0,
    velocityY: 0,
  };

  function destroyTexture(texture: GPUTexture | undefined) {
    if (!texture) return;
    texture.destroy();
    textures.delete(texture);
  }

  function texture(descriptor: GPUTextureDescriptor) {
    const result = device!.createTexture(descriptor);
    textures.add(result);
    return result;
  }

  function buffer(descriptor: GPUBufferDescriptor) {
    const result = device!.createBuffer(descriptor);
    buffers.add(result);
    return result;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    window.removeEventListener("pointermove", pointerMove);
    window.removeEventListener("pointerleave", pointerLeave);
    textures.forEach((texture) => texture.destroy());
    buffers.forEach((buffer) => buffer.destroy());
    context?.unconfigure();
    device?.destroy();
  }

  function fail() {
    if (disposed) return;
    dispose();
    onError();
  }

  function createParticles() {
    if (vertices) {
      vertices.destroy();
      buffers.delete(vertices);
    }
    const segments = controls.particleQuantity;
    particleCount = (segments + 1) ** 2;
    vertices = buffer({
      size: particleCount * 16,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    const data = new Float32Array(vertices.getMappedRange());
    for (let y = 0; y <= segments; y++) {
      for (let x = 0; x <= segments; x++) {
        const i = (y * (segments + 1) + x) * 4;
        data[i] = x / segments;
        data[i + 1] = 1 - y / segments;
        data[i + 2] = Math.random();
        data[i + 3] = Math.random() * Math.PI * 2;
      }
    }
    vertices.unmap();
    canvas.dataset.particleCount = String(particleCount);
  }

  function createTrail() {
    destroyTexture(trail);
    displacement.width = displacement.height = controls.canvasResolution;
    paint!.fillStyle = "#000000";
    paint!.fillRect(0, 0, displacement.width, displacement.height);
    trail = texture({
      size: [displacement.width, displacement.height],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device!.queue.copyExternalImageToTexture(
      { source: displacement, flipY: true },
      { texture: trail },
      [displacement.width, displacement.height]
    );
    bindGroup = device!.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniforms } },
        { binding: 1, resource: picture.createView() },
        { binding: 2, resource: trail.createView() },
        { binding: 3, resource: sampler },
      ],
    });
  }

  function pointerMove(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    // Analytic intersection with the same plane at z=0, covering 90% of view.
    if (Math.abs(x) <= 0.9 && Math.abs(y) <= 0.9) {
      cursor.targetX = (x / 0.9 + 1) * 0.5 * displacement.width;
      cursor.targetY = (1 - y / 0.9) * 0.5 * displacement.height;
    }
  }

  function pointerLeave() {
    cursor.x = cursor.y = cursor.targetX = cursor.targetY = 9999;
    cursor.smoothX = cursor.smoothY = cursor.paintedX = cursor.paintedY = 9999;
  }

  function updateTrail() {
    cursor.smoothX +=
      (cursor.targetX - cursor.smoothX) * controls.cursorSmoothing;
    cursor.smoothY +=
      (cursor.targetY - cursor.smoothY) * controls.cursorSmoothing;
    const oldX = cursor.x;
    const oldY = cursor.y;
    cursor.x += (cursor.smoothX - cursor.x) * controls.cursorLerpStrength;
    cursor.y += (cursor.smoothY - cursor.y) * controls.cursorLerpStrength;
    cursor.velocityX +=
      ((cursor.x - oldX) / displacement.width - cursor.velocityX) * 0.15;
    cursor.velocityY +=
      (-(cursor.y - oldY) / displacement.height - cursor.velocityY) * 0.15;
    const distance = Math.hypot(
      cursor.x - cursor.previousX,
      cursor.y - cursor.previousY
    );
    cursor.previousX = cursor.x;
    cursor.previousY = cursor.y;
    const alpha = Math.min(distance * controls.speedAlphaMultiplier, 1);
    const moved =
      Math.abs(cursor.x - cursor.paintedX) > 0.1 ||
      Math.abs(cursor.y - cursor.paintedY) > 0.1;
    if (!moved && !(alpha > 0.001 && glow.complete)) return;
    paint!.globalCompositeOperation = "source-over";
    paint!.globalAlpha = controls.fadeSpeed;
    paint!.fillStyle = "#000000";
    paint!.fillRect(0, 0, displacement.width, displacement.height);
    if (alpha > 0.001 && glow.complete && glow.naturalWidth > 0) {
      const size = displacement.width * controls.mouseAreaSize;
      paint!.globalCompositeOperation = "lighten";
      paint!.globalAlpha = alpha;
      paint!.drawImage(
        glow,
        cursor.x - size * 0.5,
        cursor.y - size * 0.5,
        size,
        size
      );
    }
    device!.queue.copyExternalImageToTexture(
      { source: displacement, flipY: true },
      { texture: trail },
      [displacement.width, displacement.height]
    );
    cursor.paintedX = cursor.x;
    cursor.paintedY = cursor.y;
  }

  function render(now: number) {
    frame = 0;
    if (disposed || !active || !initialized) return;
    try {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio));
        const width = Math.min(
          device!.limits.maxTextureDimension2D,
          Math.floor(rect.width * pixelRatio)
        );
        const height = Math.min(
          device!.limits.maxTextureDimension2D,
          Math.floor(rect.height * pixelRatio)
        );
        if (!color || canvas.width !== width || canvas.height !== height) {
          destroyTexture(color);
          destroyTexture(depth);
          canvas.width = width;
          canvas.height = height;
          color = texture({
            size: [width, height],
            sampleCount: SAMPLE_COUNT,
            format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
          });
          depth = texture({
            size: [width, height],
            sampleCount: SAMPLE_COUNT,
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
          });
        }
        startTime ??= now;
        updateTrail();
        const aspect = rect.width / rect.height;
        const planeHeight = ((2 * CAMERA_DISTANCE) / PROJECTION_SCALE) * 0.9;
        values.set([
          width,
          height,
          planeHeight * aspect,
          planeHeight,
          (now - startTime) / 1000,
          aspect,
          imageAspect,
          PROJECTION_SCALE,
          controls.displacementForce,
          controls.particleSize,
          controls.smoothstepMin,
          controls.smoothstepMax,
          controls.motionBlurStrength,
          cursor.velocityX,
          cursor.velocityY,
          0,
        ]);
        device!.queue.writeBuffer(uniforms, 0, values);
        const encoder = device!.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: color!.createView(),
              resolveTarget: context!.getCurrentTexture().createView(),
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
              loadOp: "clear",
              storeOp: "discard",
            },
          ],
          depthStencilAttachment: {
            view: depth!.createView(),
            depthClearValue: 1,
            depthLoadOp: "clear",
            depthStoreOp: "discard",
          },
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.setVertexBuffer(0, vertices);
        pass.draw(6, particleCount);
        pass.end();
        device!.queue.submit([encoder.finish()]);
        if (!ready) {
          ready = true;
          void device!.queue.onSubmittedWorkDone().then(() => {
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
    if (!navigator.gpu || !paint) {
      fail();
      return;
    }
    // Attach rejection handling immediately while adapter/device setup runs.
    const imagePromise = loadImage("/xmcp.webp");
    void imagePromise.catch(() => {});
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });
    if (disposed) return;
    if (!adapter) {
      fail();
      return;
    }
    device = await adapter.requestDevice();
    if (disposed) {
      device.destroy();
      return;
    }
    void device.lost.then(() => fail());
    device.addEventListener("uncapturederror", fail);
    context = canvas.getContext("webgpu");
    if (!context) {
      fail();
      return;
    }
    format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: "opaque" });
    device.pushErrorScope("validation");
    const shader = device.createShaderModule({ code: heroShader });
    const pipelinePromise = device.createRenderPipelineAsync({
      layout: "auto",
      vertex: {
        module: shader,
        entryPoint: "vertexMain",
        buffers: [
          {
            arrayStride: 16,
            stepMode: "instance",
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x4" }],
          },
        ],
      },
      fragment: {
        module: shader,
        entryPoint: "fragmentMain",
        targets: [
          {
            format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one",
                operation: "add",
              },
              alpha: {
                srcFactor: "src-alpha",
                dstFactor: "one",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: { topology: "triangle-list" },
      multisample: { count: SAMPLE_COUNT },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less-equal",
      },
    });
    const [compiled, image] = await Promise.all([
      pipelinePromise,
      imagePromise,
    ]);
    if (disposed) return;
    pipeline = compiled;
    imageAspect = image.naturalWidth / image.naturalHeight;
    picture = texture({
      size: [image.naturalWidth, image.naturalHeight],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: image, flipY: true },
      { texture: picture },
      [image.naturalWidth, image.naturalHeight]
    );
    sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });
    uniforms = buffer({
      size: UNIFORM_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    createParticles();
    createTrail();
    const validationError = await device.popErrorScope();
    if (disposed) return;
    if (validationError) {
      fail();
      return;
    }
    initialized = true;
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerleave", pointerLeave);
    if (active) frame = requestAnimationFrame(render);
  }

  void initialize().catch(fail);
  return {
    dispose,
    setActive(next: boolean) {
      active = next;
      if (!active) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!disposed && initialized && !frame)
        frame = requestAnimationFrame(render);
    },
    setControls(next: ParticleControls) {
      const previous = controls;
      controls = next;
      if (!initialized || disposed) return;
      try {
        if (previous.particleQuantity !== next.particleQuantity)
          createParticles();
        if (previous.canvasResolution !== next.canvasResolution) createTrail();
      } catch {
        fail();
      }
    },
  };
}
