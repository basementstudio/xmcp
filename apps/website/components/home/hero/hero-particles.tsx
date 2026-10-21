"use client";

import { ParticleViewport } from "@/components/particles/viewport";
import { DUST_CONTROLS } from "@/components/particles/dust";
import DustScene from "@/components/particles/dust-scene";

// Soft folds behind the product mock, drawn as flowing dashes.
const PICTURE = "/hero-folds.webp";

export default function HeroParticles({ active }: { active: boolean }) {
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
