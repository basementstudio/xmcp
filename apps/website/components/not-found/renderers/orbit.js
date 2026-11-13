import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// A real extruded "404" built from the shared 5x7 bitmap: solid dark cells that
// occlude, with bright edge lines over them. You drag to turn it; rotation is
// clamped and eases back so the number always stays readable. Untouched, it
// sways and bobs gently. On wide layouts it sits right of the copy.
const COLS = 5,
  ROWS = 7,
  GAP = 1,
  DEPTH = 1.5;
const patterns = [
  "10001100011000111111000010000100001",
  "11111100011000110001100011000111111",
  "10001100011000111111000010000100001",
];
const MAX_YAW = 0.7,
  MAX_PITCH = 0.45;

function buildGlyph() {
  const totalCols = patterns.length * COLS + (patterns.length - 1) * GAP;
  const ox = (totalCols - 1) / 2,
    oy = (ROWS - 1) / 2;
  const boxes = [];
  patterns.forEach((pattern, digit) => {
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++) {
        if (pattern[row * COLS + col] !== "1") continue;
        const box = new THREE.BoxGeometry(1, 1, DEPTH);
        box.translate(digit * (COLS + GAP) + col - ox, ROWS - 1 - row - oy, 0);
        boxes.push(box);
      }
  });
  const merged = mergeGeometries(boxes, false);
  boxes.forEach((box) => box.dispose());
  merged.computeBoundingSphere();
  return merged;
}

export function mountOrbit(element) {
  const canvas = element.querySelector("canvas");
  const status = element.querySelector("#orbit-status");
  const angle = element.querySelector("#orbit-angle");
  const errorLabel = element.querySelector(".ocean-error");
  const abort = new AbortController(),
    events = { signal: abort.signal };
  let renderer,
    scene,
    camera,
    group,
    glyph,
    fillMaterial,
    edgeMaterial,
    observer,
    radius = 9,
    offsetX = 0,
    frame = 0,
    disposed = false,
    failed = false;
  let dragging = false,
    pointerId = null,
    elapsed = 0,
    last = performance.now();
  // User rotation is an offset on top of the idle sway; both stay small.
  let userYaw = 0,
    userPitch = 0,
    velYaw = 0,
    velPitch = 0,
    lastX = 0,
    lastY = 0,
    idleSway = 0.32;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  function fail() {
    if (disposed || failed) return;
    failed = true;
    cancelAnimationFrame(frame);
    if (status) status.textContent = "RENDER ERROR";
    if (errorLabel) {
      errorLabel.hidden = false;
      errorLabel.textContent =
        "The interactive artwork is unavailable. You can still return home or read the docs.";
    }
  }
  function down(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    dragging = true;
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(pointerId);
    canvas.focus({ preventScroll: true });
    canvas.style.cursor = "grabbing";
  }
  function move(event) {
    if (!dragging) return;
    velYaw += (event.clientX - lastX) * 0.009;
    velPitch += (event.clientY - lastY) * 0.007;
    lastX = event.clientX;
    lastY = event.clientY;
  }
  function release() {
    if (!dragging) return;
    dragging = false;
    if (pointerId !== null && canvas.hasPointerCapture(pointerId))
      canvas.releasePointerCapture(pointerId);
    pointerId = null;
    canvas.style.cursor = "grab";
  }
  function reset() {
    release();
    userYaw = userPitch = velYaw = velPitch = 0;
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
    scene = new THREE.Scene();
    // Distance fog dims the far edges, reading the 404 as a solid 3D object.
    scene.fog = new THREE.Fog(0x090909, 22, 52);
    const merged = buildGlyph();
    radius = merged.boundingSphere.radius;
    fillMaterial = new THREE.MeshBasicMaterial({ color: 0x0d0d0d });
    edgeMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc });
    glyph = new THREE.Group();
    glyph.add(new THREE.Mesh(merged, fillMaterial));
    glyph.add(
      new THREE.LineSegments(new THREE.EdgesGeometry(merged, 1), edgeMaterial)
    );
    group = new THREE.Group();
    group.add(glyph);
    scene.add(group);

    function resize() {
      const r = canvas.getBoundingClientRect();
      const aspect = r.width / Math.max(r.height, 1);
      const portrait = aspect < 0.85;
      const fov = portrait ? 46 : 34;
      camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);
      const half = fov * (Math.PI / 360);
      const dist = (radius / Math.sin(half)) * (portrait ? 1.3 : 1.55);
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      // Push the glyph into the right of wide panels so it clears the copy.
      const halfWidth = dist * Math.tan(half) * aspect;
      offsetX = portrait ? 0 : Math.min(halfWidth * 0.34, halfWidth - radius * 1.05);
      offsetX = Math.max(0, offsetX);
      renderer.setSize(r.width, r.height, false);
    }
    observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", down, events);
    canvas.addEventListener("pointermove", move, events);
    canvas.addEventListener("pointerup", release, events);
    canvas.addEventListener("pointercancel", release, events);
    canvas.addEventListener("lostpointercapture", release, events);
    window.addEventListener("blur", release, events);
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        cancelAnimationFrame(frame);
        fail(new Error("The browser lost the graphics context."));
      },
      events
    );
    canvas.addEventListener(
      "keydown",
      (event) => {
        const nudge = {
          ArrowLeft: [0, -1],
          ArrowRight: [0, 1],
          ArrowUp: [-1, 0],
          ArrowDown: [1, 0],
        }[event.key];
        if (nudge) {
          event.preventDefault();
          velPitch += nudge[0] * 0.9;
          velYaw += nudge[1] * 0.9;
        }
        if (event.key.toLowerCase() === "r") reset();
      },
      events
    );
    element.querySelector("#orbit-reset").addEventListener("click", reset, events);
    element.querySelector("#orbit-spin").addEventListener(
      "input",
      (e) => {
        idleSway = Number(e.target.value);
      },
      events
    );
    if (status) status.textContent = "404 / OBJECT NOT FOUND";
    function draw(now) {
      if (disposed || failed) return;
      try {
        const dt = Math.min((now - last) / 1000, 0.04);
        last = now;
        if (!document.hidden && element.dataset.paused !== "true") {
          if (!reduced) elapsed += dt;
          const damp = Math.exp(-dt * 3);
          velYaw *= damp;
          velPitch *= damp;
          userYaw = clamp(userYaw + velYaw * dt, -MAX_YAW, MAX_YAW);
          userPitch = clamp(userPitch + velPitch * dt, -MAX_PITCH, MAX_PITCH);
          if (!dragging) {
            // Ease the user offset back so it settles to the readable idle pose.
            const ret = 1 - Math.exp(-dt * 0.8);
            userYaw -= userYaw * ret;
            userPitch -= userPitch * ret;
          }
          const baseYaw = reduced ? 0 : Math.sin(elapsed * 0.5) * idleSway;
          const basePitch = reduced ? -0.12 : -0.12 + Math.sin(elapsed * 0.37) * 0.07;
          group.rotation.set(basePitch + userPitch, baseYaw + userYaw, 0);
          group.position.set(offsetX, reduced ? 0 : Math.sin(elapsed * 0.8) * 0.4, 0);
          if (angle) {
            const deg = (((baseYaw + userYaw) * 180) / Math.PI).toFixed(0);
            angle.textContent = `${deg}°`;
          }
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
    if (pointerId !== null && canvas.hasPointerCapture(pointerId))
      canvas.releasePointerCapture(pointerId);
    glyph?.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
    });
    fillMaterial?.dispose();
    edgeMaterial?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
  };
}
