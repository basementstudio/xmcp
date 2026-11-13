"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  DASHBOARD_FPS,
  DASHBOARD_FRAMES,
  DashboardScene,
} from "./product-mock";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeToMotion = (onChange: () => void) => {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const prefersReducedMotion = () => window.matchMedia(MOTION_QUERY).matches;
const serverReducedMotion = () => true;

export function ProductMock() {
  const container = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  // Match the available CSS pixels instead of scaling desktop text on mobile.
  const [size, setSize] = useState({ width: 616, height: 454 });
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    prefersReducedMotion,
    serverReducedMotion
  );

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (width && height) setSize({ width, height });
    });
    observer.observe(container.current!);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let visible = false;
    const updatePlayback = () => {
      if (visible && !document.hidden && !reducedMotion) player.current?.play();
      else player.current?.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    });
    observer.observe(container.current!);
    document.addEventListener("visibilitychange", updatePlayback);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updatePlayback);
    };
  }, [reducedMotion]);

  return (
    <div ref={container} className="hero-dashboard-player" aria-hidden="true">
      <Player
        ref={player}
        component={DashboardScene}
        inputProps={{ still: reducedMotion }}
        compositionWidth={size.width}
        compositionHeight={size.height}
        fps={DASHBOARD_FPS}
        durationInFrames={DASHBOARD_FRAMES}
        style={{ width: "100%", height: "100%" }}
        loop
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        numberOfSharedAudioTags={0}
      />
    </div>
  );
}
