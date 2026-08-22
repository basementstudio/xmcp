"use client";

import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ErrorBoundary } from "react-error-boundary";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import FeatureParticles from "./feature-particles";

interface CardEntry {
  el: HTMLElement;
  asset: string;
}

// One shared WebGL canvas for all six feature cards, each rendered as a
// scissored viewport over its card. Per-card canvases would put the page at
// 8 live contexts (hero + prefooter + 6), past iOS Safari's eviction ceiling.
export const FeaturesCanvas = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [cards, setCards] = useState<CardEntry[]>([]);
  const [isUnmounting, setIsUnmounting] = useState(false);

  // Mount once when the section approaches the viewport, and only when the
  // environment supports the effect; otherwise the static images remain.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2") && !probe.getContext("webgl")) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // The cards are server-rendered siblings in the same grid; they mark their
  // media box with a data attribute holding the image src.
  useEffect(() => {
    if (!mounted) return;
    const grid = wrapperRef.current?.parentElement;
    if (!grid) return;
    const els = Array.from(
      grid.querySelectorAll<HTMLElement>("[data-feature-particles]")
    );
    setCards(
      els.map((el) => ({
        el,
        asset: el.dataset.featureParticles as string,
      }))
    );
  }, [mounted]);

  useEffect(() => {
    const handleUnmount = () => setIsUnmounting(true);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsUnmounting(true);
      } else {
        setIsUnmounting(false);
      }
    };
    window.addEventListener("beforeunload", handleUnmount);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleUnmount);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    >
      {mounted && (
        <ErrorBoundary fallback={null}>
          <Canvas
            gl={{
              antialias: true,
              // Transparent: the grid-covering canvas must not paint over
              // card borders and text; each card view clears its own rect
              alpha: true,
            }}
            dpr={[1, 2]}
            style={{
              pointerEvents: "none",
              opacity: isUnmounting ? 0 : 1,
            }}
          >
            {cards.map((card, index) => (
              <CardView
                key={card.asset}
                el={card.el}
                asset={card.asset}
                index={index + 1}
              />
            ))}
          </Canvas>
        </ErrorBoundary>
      )}
    </div>
  );
};

const rectToSize = (rect: DOMRect) => ({
  width: rect.width,
  height: rect.height,
  top: rect.top,
  left: rect.left,
});

// Portals one card's particle scene into the shared canvas. The injected
// `size` makes useThree().size report the card box, so the particle plane
// math works as if the card had its own canvas.
const CardView = ({
  el,
  asset,
  index,
}: {
  el: HTMLElement;
  asset: string;
  index: number;
}) => {
  const [scene] = useState(() => new THREE.Scene());
  const rootSize = useThree((state) => state.size);
  const [size, setSize] = useState(() =>
    rectToSize(el.getBoundingClientRect())
  );

  useLayoutEffect(() => {
    setSize(rectToSize(el.getBoundingClientRect()));
  }, [el, rootSize]);

  return createPortal(
    <>
      <CardSceneRenderer el={el} index={index} />
      <FeatureParticles textureSrc={asset} pointerTarget={el} />
    </>,
    scene,
    { size }
  );
};

// Renders this card's scene into a scissored viewport each frame. Both rects
// are measured fresh here on purpose: the canvas scrolls together with the
// grid, so their offset is scroll-invariant — unlike fiber's cached canvas
// bounds, which trail scrolling by a debounce and make the views slide.
const CardSceneRenderer = ({
  el,
  index,
}: {
  el: HTMLElement;
  index: number;
}) => {
  useFrame((state) => {
    const { gl, scene, camera } = state;
    const canvasRect = gl.domElement.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    const isOffscreen =
      rect.bottom < canvasRect.top ||
      rect.top > canvasRect.bottom ||
      rect.right < canvasRect.left ||
      rect.left > canvasRect.right;
    if (isOffscreen || rect.width === 0 || rect.height === 0) return;

    const left = rect.left - canvasRect.left;
    const bottom = canvasRect.bottom - rect.bottom;

    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = rect.width / rect.height;
      if (camera.aspect !== aspect) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
    }

    const autoClear = gl.autoClear;
    gl.autoClear = false;
    gl.setViewport(left, bottom, rect.width, rect.height);
    gl.setScissor(left, bottom, rect.width, rect.height);
    gl.setScissorTest(true);
    gl.render(scene, camera);
    gl.setScissorTest(false);
    gl.autoClear = autoClear;
  }, index);

  return null;
};
