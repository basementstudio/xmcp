"use client";

import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
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
  const attach = useCallback((slot: HTMLDivElement | null) => {
    if (slot) {
      if (!host.current) {
        host.current = document.createElement("div");
        setTarget(host.current);
      }
      slot.appendChild(host.current);
      setActive(true);
    } else {
      if (host.current) parking.current?.appendChild(host.current);
      setActive(false);
    }
  }, []);

  return (
    <HeroSlotContext.Provider value={attach}>
      {children}
      <div ref={parking} hidden aria-hidden="true" data-hero-parking="" />
      {/* The portal target stays identical across routes. Moving its host keeps
          the React scene, GPU context, textures and simulation alive. Only the
          homepage slot starts loading it; parked scenes never render frames. */}
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
