"use client";

import { ParticleViewport } from "@/components/particles/viewport";
import { DUST_CONTROLS } from "@/components/particles/dust";
import DustScene from "@/components/particles/dust-scene";

// Soft folds behind the product mock, drawn as flowing dashes.
const PICTURE = "/hero-folds.webp";

export default function HeroParticles({
  active,
  onReady,
}: {
  active: boolean;
  onReady: () => void;
}) {
  return (
    <>
      {/* Both renderers and the fallback artwork are monochrome. Inverting the
          finished scene preserves their identical additive glow in light mode,
          and changes theme without rebuilding GPU resources. */}
      <div className="hero-particles">
        <ParticleViewport
          className="hero-scene-size"
          texture={PICTURE}
          width={900}
          height={625}
          // The static folds look unlike the live dashes, so swapping one for
          // the other read as a flicker on reload; the scene fades in instead.
          showLoadingArtwork={false}
          fadeIn
          onReady={onReady}
        >
          {(props) => (
            <DustScene
              {...props}
              active={active && props.active}
              picture={PICTURE}
              name="hero"
              defaults={DUST_CONTROLS}
            />
          )}
        </ParticleViewport>
      </div>
    </>
  );
}
