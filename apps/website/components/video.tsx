"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  aspectRatio?: string;
}

export function Video({
  src,
  aspectRatio = "16/9",
  onPlay,
  onPause,
  onEnded,
  controls,
  ...props
}: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncState = () => {
      setIsPlaying(!video.paused && !video.ended);
    };

    syncState();
    video.addEventListener("play", syncState);
    video.addEventListener("pause", syncState);
    video.addEventListener("ended", syncState);

    return () => {
      video.removeEventListener("play", syncState);
      video.removeEventListener("pause", syncState);
      video.removeEventListener("ended", syncState);
    };
  }, []);

  const handlePlayClick = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      await video.play();
    } catch (error) {
      console.error("Unable to start video playback:", error);
    }
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-sm border border-brand-neutral-500"
      style={{ aspectRatio }}
    >
      {!isPlaying && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-black/35 transition-opacity duration-200"
        />
      )}
      {!isPlaying && (
        <button
          type="button"
          aria-label="Play video"
          onClick={handlePlayClick}
          className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2 h-14 w-20 rounded-md border border-white/10 bg-brand-neutral-400/85 transition-colors hover:bg-brand-neutral-300/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neutral-50/70"
        >
          <span className="sr-only">Play video</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="mx-auto size-10 fill-brand-white/95"
          >
            <path d="M8 6v12l10-6z" />
          </svg>
        </button>
      )}
      <video
        ref={videoRef}
        src={src}
        className={`absolute inset-0 h-full w-full object-cover transition-[filter] duration-200 ${
          isPlaying ? "filter-none" : "saturate-[0.7] brightness-[0.85]"
        }`}
        onPlay={(event) => {
          setIsPlaying(true);
          setHasStarted(true);
          onPlay?.(event);
        }}
        onPause={(event) => {
          setIsPlaying(false);
          onPause?.(event);
        }}
        onEnded={(event) => {
          setIsPlaying(false);
          onEnded?.(event);
        }}
        controls={Boolean(controls && hasStarted)}
        {...props}
      />
    </div>
  );
}
