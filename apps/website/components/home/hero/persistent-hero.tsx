"use client";

import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const HeroParticles = lazy(() => import("./hero-particles"));
const HeroSlotContext = createContext<
  ((slot: HTMLDivElement | null) => void) | null
>(null);
const LAYER_STYLE: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

export function PersistentHero({ children }: { children: ReactNode }) {
  const layer = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);
  const [active, setActive] = useState(false);

  // Only move the layer's screen position, never its DOM node. Reparenting a
  // canvas can invalidate the browser's presented GPU surface even when React
  // and the renderer remain mounted. The slot still reserves layout space.
  const position = useCallback(() => {
    const element = layer.current;
    if (!element) return;
    const bounds = slot.current?.getBoundingClientRect();
    if (!bounds?.width || !bounds.height) {
      element.style.visibility = "hidden";
      return;
    }
    element.style.width = `${bounds.width}px`;
    element.style.height = `${bounds.height}px`;
    element.style.transform = `translate3d(${bounds.left}px, ${bounds.top}px, 0)`;
    element.style.visibility = "visible";
  }, []);

  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      slot.current = element;
      if (element) setStarted(true);
      setActive(!!element);
      position();
    },
    [position]
  );

  useLayoutEffect(() => {
    position();
    if (!active || !slot.current) return;
    const observer = new ResizeObserver(position);
    observer.observe(slot.current);
    // Font loading and content above the slot can move it without resizing it.
    observer.observe(document.body);
    const listeners = new AbortController();
    window.addEventListener("resize", position, { signal: listeners.signal });
    window.addEventListener("scroll", position, {
      capture: true,
      passive: true,
      signal: listeners.signal,
    });
    return () => {
      observer.disconnect();
      listeners.abort();
    };
  }, [active, position]);

  return (
    <HeroSlotContext.Provider value={attach}>
      {children}
      {/* This element and all renderer ancestors stay in the root layout.
          Off-page scenes retain their size and resources, with rendering paused.
          Both particle renderers already listen for pointer movement on window. */}
      <div
        ref={layer}
        aria-hidden="true"
        inert
        data-persistent-hero=""
        data-hero-active={active}
        style={LAYER_STYLE}
      >
        {started && (
          <Suspense fallback={null}>
            <HeroParticles active={active} />
          </Suspense>
        )}
      </div>
    </HeroSlotContext.Provider>
  );
}

export function HeroSlot() {
  const attach = useContext(HeroSlotContext);
  return <div ref={attach} className="hero-scene-size" data-hero-slot="" />;
}
