"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  SCHEMATIC_SECONDS,
  SchematicTime,
  schematics,
  type SchematicKind,
} from "./schematics";

const FPS = 60;
const DURATION_IN_FRAMES = Math.round(SCHEMATIC_SECONDS * FPS);
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeToMotion = (onChange: () => void) => {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const prefersReducedMotion = () => window.matchMedia(MOTION_QUERY).matches;
const serverReducedMotion = () => true;

function AnimatedSchematic({
  kind,
  still,
}: {
  kind: SchematicKind;
  still: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Drawing = schematics[kind];
  return (
    <SchematicTime.Provider value={still ? null : frame / fps}>
      <Drawing />
    </SchematicTime.Provider>
  );
}

export function FeatureIllustration({ kind }: { kind: SchematicKind }) {
  const container = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    prefersReducedMotion,
    serverReducedMotion
  );

  useEffect(() => {
    let visible = false;
    const updatePlayback = () => {
      if (visible && !document.hidden && !reducedMotion) {
        player.current?.play();
      } else {
        player.current?.pause();
      }
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
    <div
      ref={container}
      className="feature-illustration"
      aria-hidden="true"
      inert
    >
      <Player
        ref={player}
        component={AnimatedSchematic}
        inputProps={{ kind, still: reducedMotion }}
        compositionWidth={120}
        compositionHeight={80}
        fps={FPS}
        durationInFrames={DURATION_IN_FRAMES}
        style={{ width: "100%" }}
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
