"use client";

import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const HeroParticles = lazy(() => import("./hero-particles"));
const HeroSlotContext = createContext<
  ((slot: HTMLDivElement | null) => void) | null
>(null);

export function PersistentHero({ children }: { children: ReactNode }) {
  const parking = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  // Keep the last nonzero size when the homepage is hidden by the router.
  // display:none parking loses layout and can discard the presented GPU frame.
  useEffect(() => {
    if (!target) return;
    const rememberSize = () => {
      const bounds = target.getBoundingClientRect();
      if (!parking.current || !bounds.width || !bounds.height) return;
      parking.current.style.width = `${bounds.width}px`;
      parking.current.style.height = `${bounds.height}px`;
    };
    rememberSize();
    const observer = new ResizeObserver(rememberSize);
    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);

  const attach = useCallback((slot: HTMLDivElement | null) => {
    if (slot) {
      if (!host.current) {
        host.current = document.createElement("div");
        setTarget(host.current);
      }
      slot.appendChild(host.current);
      setActive(true);
    } else {
      if (host.current && parking.current) {
        const bounds = host.current.getBoundingClientRect();
        if (bounds.width && bounds.height) {
          parking.current.style.width = `${bounds.width}px`;
          parking.current.style.height = `${bounds.height}px`;
        }
        parking.current.appendChild(host.current);
      }
      setActive(false);
    }
  }, []);

  return (
    <HeroSlotContext.Provider value={attach}>
      {children}
      <div
        ref={parking}
        aria-hidden="true"
        inert
        data-hero-parking=""
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      />
      {/* The portal target stays identical across routes. Moving its host keeps
          the React scene, GPU context, textures and simulation alive. Only the
          homepage slot starts loading it; dimension-preserving parking retains
          the renderer size while the scene stops rendering frames. */}
      {target &&
        createPortal(
          <Suspense fallback={null}>
            <HeroParticles active={active} />
          </Suspense>,
          target
        )}
    </HeroSlotContext.Provider>
  );
}

export function HeroSlot() {
  const attach = useContext(HeroSlotContext);
  return <div ref={attach} className="hero-scene-size" />;
}
