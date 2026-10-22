export const DUST_CONTROLS = {
  rows: 49,
  segments: 320,
  twist: 18.7,
  speed: 2.65,
  size: 1.7,
  density: 1,
  dash: 1.05,
  brightness: 1,
  vignette: 0.5,
  mouseRadius: 0.2,
  mouseForce: 1,
};
export type DustControls = typeof DUST_CONTROLS;

// Smaller canvases keep the hero's dash spacing in CSS pixels.
export const CARD_DUST_CONTROLS: DustControls = {
  ...DUST_CONTROLS,
  rows: 32,
  segments: 200,
  mouseRadius: 0.26,
};
export const FOOTER_DUST_CONTROLS: DustControls = {
  ...DUST_CONTROLS,
  rows: 34,
  segments: 110,
  size: 1,
  vignette: 0.2,
  mouseRadius: 0.35,
};

// Cover artwork needs finer rows than isolated logos to retain small lettering.
export const BLOG_DUST_CONTROLS: DustControls = {
  ...CARD_DUST_CONTROLS,
  rows: 100,
  segments: 280,
  size: 0.6,
  brightness: 0.7,
  vignette: 0.2,
  mouseForce: 0.4,
};

export const DUST_UNIFORM_BYTES = 96;

export type DustRendererOptions = {
  picture: string;
  active: boolean;
  onReady: () => void;
  onError: () => void;
};

export type DustRenderer = {
  dispose: () => void;
  setActive: (active: boolean) => void;
  setControls: (controls: DustControls) => void;
};

export type CreateDustRenderer = (
  canvas: HTMLCanvasElement,
  options: DustRendererOptions
) => DustRenderer;

export function dustInstanceCount(controls: DustControls) {
  return Math.round(controls.rows) * Math.round(controls.segments);
}

/** Match the canvas backing store to its CSS size, capped at 2x density. */
export function resizeCanvas(canvas: HTMLCanvasElement, maxSize: number) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio));
  const width = Math.min(maxSize, Math.floor(rect.width * pixelRatio));
  const height = Math.min(maxSize, Math.floor(rect.height * pixelRatio));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  return { rect, pixelRatio };
}

export function loadPicture(source: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = source;
  return image.decode().then(() => image);
}

/**
 * Follows the pointer relative to one canvas. Positions are re-read against
 * the canvas each frame, so scrolling under a still pointer stays accurate.
 * Rates are per second, so the easing does not depend on the frame rate.
 */
export function createPointer() {
  let clientX = 0;
  let clientY = 0;
  let seen = false;
  let within = false;
  let x = 0;
  let y = 0;
  let velocityX = 0;
  let velocityY = 0;
  let influence = 0;
  const listeners = new AbortController();
  const options = { passive: true, signal: listeners.signal };
  window.addEventListener(
    "pointermove",
    (event) => {
      clientX = event.clientX;
      clientY = event.clientY;
      within = true;
    },
    options
  );
  document.documentElement.addEventListener(
    "pointerleave",
    () => (within = false),
    options
  );

  return {
    /** Ease toward the pointer and return values in physical, y-up pixels. */
    update(rect: DOMRect, pixelRatio: number, seconds: number) {
      const targetX = clientX - rect.left - rect.width / 2;
      const targetY = rect.height / 2 - (clientY - rect.top);
      const inside =
        within &&
        Math.abs(targetX) < rect.width * 0.6 &&
        Math.abs(targetY) < rect.height * 0.6;
      if (!seen && inside) {
        seen = true;
        x = targetX;
        y = targetY;
      }
      const step = Math.min(seconds, 0.1);
      // Gentle easing keeps the effect soft rather than tracking every movement.
      const follow = 1 - Math.exp(-step * 7);
      const previousX = x;
      const previousY = y;
      x += (targetX - x) * follow;
      y += (targetY - y) * follow;
      const smoothing = 1 - Math.exp(-step * 5);
      const rate = step > 0 ? 1 / step : 0;
      velocityX += ((x - previousX) * rate - velocityX) * smoothing;
      velocityY += ((y - previousY) * rate - velocityY) * smoothing;
      const target = inside ? 1 : 0;
      influence +=
        (target - influence) * (1 - Math.exp(-step * (inside ? 4 : 1.5)));
      return [
        x * pixelRatio,
        y * pixelRatio,
        velocityX * pixelRatio,
        velocityY * pixelRatio,
        influence,
      ] as const;
    },
    dispose: () => listeners.abort(),
  };
}

/** Pack one frame in the uniform layout shared by both dust shaders. */
export function writeDustUniforms(
  values: Float32Array,
  controls: DustControls,
  canvas: HTMLCanvasElement,
  seconds: number,
  pixelRatio: number,
  pictureAspect: number,
  pointer: ReturnType<ReturnType<typeof createPointer>["update"]>
) {
  const [pointerX, pointerY, velocityX, velocityY, influence] = pointer;
  values.set([
    canvas.width,
    canvas.height,
    seconds,
    canvas.width / canvas.height,
    Math.round(controls.rows),
    Math.round(controls.segments),
    controls.twist,
    pictureAspect,
    controls.size,
    controls.density,
    controls.dash,
    controls.brightness,
    controls.vignette,
    controls.speed,
    pixelRatio,
    0,
    pointerX,
    pointerY,
    controls.mouseRadius,
    influence * controls.mouseForce,
    velocityX,
    velocityY,
    0,
    0,
  ]);
}
