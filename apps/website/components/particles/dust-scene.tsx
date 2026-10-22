"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ParticleSceneProps } from "./viewport";
import type { CreateDustRenderer, DustControls, DustRenderer } from "./dust";
import { createWebGLRenderer } from "./dust-webgl";
import { createWebGPURenderer } from "./dust-webgpu";

const DustDebugControls = lazy(() => import("./dust-debug-controls"));

type DustSceneProps = ParticleSceneProps & {
  picture: string;
  /** Debug panel group; scenes with the same name share their controls. */
  name: string;
  defaults: DustControls;
};

function DustCanvas({
  renderer: create,
  kind,
  picture,
  name,
  defaults,
  active,
  onReady,
  onError,
}: DustSceneProps & { renderer: CreateDustRenderer; kind: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<DustRenderer | null>(null);
  const [controls, setControls] = useState(defaults);
  const debug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debug");

  useLayoutEffect(() => {
    const instance = create(canvas.current!, {
      picture,
      active: false,
      onReady,
      onError,
    });
    renderer.current = instance;
    return () => {
      instance.dispose();
      renderer.current = null;
    };
  }, [create, picture, onReady, onError]);

  // Apply controls before the first frame can render with the hero defaults.
  useLayoutEffect(() => {
    renderer.current?.setControls(controls);
  }, [controls]);
  useLayoutEffect(() => {
    renderer.current?.setActive(active);
  }, [active]);

  return (
    <>
      <canvas
        ref={canvas}
        data-renderer={kind}
        className="absolute inset-0 h-full w-full"
      />
      {debug && (
        <Suspense fallback={null}>
          <DustDebugControls
            name={name}
            defaults={defaults}
            onChange={setControls}
          />
        </Suspense>
      )}
    </>
  );
}

/** Draws a picture as flowing dashes, preferring WebGPU over WebGL2. */
export default function DustScene(props: DustSceneProps) {
  const [fallback, setFallback] = useState(false);
  const useFallback = useCallback(() => setFallback(true), []);
  // Each renderer needs a fresh canvas: one element cannot hold both contexts.
  return fallback ? (
    <DustCanvas
      key="webgl"
      kind="webgl"
      renderer={createWebGLRenderer}
      {...props}
    />
  ) : (
    <DustCanvas
      key="webgpu"
      kind="webgpu"
      renderer={createWebGPURenderer}
      {...props}
      onError={useFallback}
    />
  );
}
