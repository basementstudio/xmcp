"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ErrorBoundary } from "react-error-boundary";

export type ParticleSceneProps = {
  active: boolean;
  onReady: () => void;
  onError: () => void;
};

// Start the footer's download before it is visible, without a timer.
const FOOTER_PRELOAD_MARGIN = "100% 0px";

export function ParticleViewport({
  className,
  texture,
  width,
  height,
  deferred = false,
  showLoadingArtwork = true,
  children,
}: {
  className: string;
  texture: string;
  width: number;
  height: number;
  deferred?: boolean;
  showLoadingArtwork?: boolean;
  children: (props: ParticleSceneProps) => ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [nearby, setNearby] = useState(!deferred);
  const [visible, setVisible] = useState(!deferred);
  const [pageVisible, setPageVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fallbackSource, setFallbackSource] = useState(texture);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      setEnabled(!motion.matches);
      setReducedMotion(motion.matches);
      setReady(false);
    };
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);

    const element = container.current!;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting)
    );
    observer.observe(element);
    const preloadObserver = deferred
      ? new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setNearby(true);
              preloadObserver?.disconnect();
            }
          },
          { rootMargin: FOOTER_PRELOAD_MARGIN }
        )
      : null;
    preloadObserver?.observe(element);

    return () => {
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
      preloadObserver?.disconnect();
    };
  }, [deferred]);

  return (
    <div ref={container} className={`relative ${className}`} aria-hidden="true">
      {(showLoadingArtwork || reducedMotion || failed) && (
        <Image
          src={fallbackSource}
          width={width}
          height={height}
          alt=""
          unoptimized
          crossOrigin="anonymous"
          loading={deferred ? "lazy" : "eager"}
          // Keep the original asset as an independent fallback if the new texture fails.
          onError={() => setFallbackSource(texture.replace(/\.webp$/, ".png"))}
          className={`absolute inset-0 m-auto h-[90%] w-[90%] object-contain ${ready && !failed ? "invisible" : ""}`}
        />
      )}
      {enabled && nearby && !failed && (
        <div
          className={`absolute inset-0 ${showLoadingArtwork && !ready ? "opacity-0" : ""}`}
        >
          <ErrorBoundary fallback={null} onError={onError}>
            {children({ active: visible && pageVisible, onReady, onError })}
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}
