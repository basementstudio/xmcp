"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const concepts = [
  {
    id: "04",
    name: "Lost context",
    title: "A little out of context.",
    description:
      "We have the tools. We have the prompts. We just don’t have this page.",
    action: "Restore context",
    instruction: "Move across the 404 to pull the lines into focus.",
  },
  {
    id: "07",
    name: "Out of orbit",
    title: "Off its axis.",
    description:
      "This page spun out of orbit. Give it a turn, then get back to solid ground.",
    action: "Return home",
    instruction: "Drag to turn the 404; it eases back. Arrow keys nudge it, R recenters.",
  },
  {
    id: "08",
    name: "Submerged",
    title: "Nothing. Almost.",
    description: "The page is gone. Something still disturbs the surface.",
    action: "Back to shore",
    instruction:
      "Move across the water. Click or press Enter to send a ripple; R to clear.",
  },
  {
    id: "09",
    name: "Code rain",
    title: "Lost in the stream.",
    description: "Plenty of signal. Nothing at this address.",
    action: "Exit to home",
    instruction: "Move over the 404 to bend the signal.",
  },
] as const;

type Concept = (typeof concepts)[number];

function Range({
  id,
  label,
  min,
  max,
  value,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
}) {
  return (
    <label className="error-range" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step="0.01"
        defaultValue={value}
      />
    </label>
  );
}

function Scene({ concept }: { concept: Concept }) {
  const root = useRef<HTMLElement>(null);
  const [loadError, setLoadError] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    // Load only the selected renderer; its cleanup releases listeners and GPU resources.
    async function mount() {
      const render =
        concept.id === "04"
          ? (await import("./renderers/context.js")).mountContext
          : concept.id === "07"
            ? (await import("./renderers/orbit.js")).mountOrbit
            : concept.id === "08"
              ? (await import("./renderers/submerged.js")).mountSubmerged
              : (await import("./renderers/matrix.js")).mountMatrix;
      if (!cancelled && root.current) dispose = render(root.current);
    }
    mount().catch(() => {
      if (!cancelled) setLoadError(true);
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [concept.id]);

  const context = concept.id === "04";
  const prefix =
    concept.id === "07"
      ? "orbit"
      : concept.id === "08"
        ? "submerged"
        : "matrix";

  return (
    <section
      ref={root}
      id="error-scene"
      role="tabpanel"
      aria-labelledby={`concept-${concept.id}`}
      data-paused={paused}
      className={`error-scene error-scene-${concept.id}`}
    >
      <div className="error-art">
        <canvas
          tabIndex={context ? undefined : 0}
          aria-label={
            context
              ? "404 formed from ASCII characters"
              : `${concept.name}: ${concept.instruction}`
          }
        />
      </div>
      <div className="error-scene-top">
        <span>404 / PAGE NOT FOUND</span>
        <span
          id={context ? "context-status" : `${prefix}-status`}
          className="error-render-status"
        >
          {context ? "Context partially recovered" : "Preparing scene"}
        </span>
      </div>
      <div className="error-copy">
        <p className="error-eyebrow">Resource not found</p>
        <h1 id="not-found-title" className="display">
          {concept.title}
        </h1>
        <p className="listing-description">{concept.description}</p>
        <div className="error-actions">
          <Button variant="primary" asChild>
            <Link href="/">
              {concept.action}
              <span aria-hidden="true">↗</span>
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/docs">Read the docs</Link>
          </Button>
        </div>
      </div>
      <p className="ocean-error" role="status" hidden={!loadError}>
        The interactive artwork couldn’t load. You can still return home or read
        the docs.
      </p>
      <div className="error-scene-bottom">
        <p className="error-instruction">{concept.instruction}</p>
        {!context && (
          <details className="error-controls">
            <summary>
              Scene controls <span aria-hidden="true">+</span>
            </summary>
            <div className="error-controls-panel">
              {concept.id !== "09" && (
                <button
                  type="button"
                  aria-pressed={paused}
                  onClick={() => setPaused(!paused)}
                >
                  {paused ? "Resume animation" : "Pause animation"}
                </button>
              )}
              {concept.id === "07" && (
                <>
                  <Range
                    id="orbit-spin"
                    label="Idle sway"
                    min={0}
                    max={0.6}
                    value={0.32}
                  />
                  <p className="error-readout">
                    View <span id="orbit-angle">0°</span>
                  </p>
                  <button id="orbit-reset" type="button">
                    Reset view ↺
                  </button>
                </>
              )}
              {concept.id === "08" && (
                <>
                  <Range
                    id="submerged-power"
                    label="Ripple strength"
                    min={0.3}
                    max={1.5}
                    value={0.75}
                  />
                  <Range
                    id="submerged-lines"
                    label="Line density"
                    min={2}
                    max={7}
                    value={4}
                  />
                  <p className="error-readout">
                    Water · <span id="submerged-motion">Still</span>
                  </p>
                  <button id="submerged-send" type="button">
                    Send a ripple ↗
                  </button>
                  <button id="submerged-clear" type="button">
                    Calm the water
                  </button>
                </>
              )}
              {concept.id === "09" && (
                <>
                  <Range
                    id="matrix-speed"
                    label="Rain speed"
                    min={0.2}
                    max={1.8}
                    value={0.65}
                  />
                  <Range
                    id="matrix-density"
                    label="Code density"
                    min={0.65}
                    max={1.45}
                    value={1}
                  />
                  <button id="matrix-pause" type="button" aria-pressed="false">
                    Pause rain
                  </button>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}

export function NotFoundExplorations() {
  const [selected, setSelected] = useState<Concept>(concepts[0]);

  useEffect(() => {
    function readHash() {
      const concept = concepts.find(
        ({ id }) => `#${id}` === window.location.hash
      );
      if (concept) setSelected(concept);
    }
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  function select(concept: Concept) {
    setSelected(concept);
    window.history.replaceState(null, "", `#${concept.id}`);
  }

  return (
    <main id="main-content" className="site-not-found error-explorations">
      <Scene key={selected.id} concept={selected} />
      <div className="error-selector">
        <p>
          404 explorations <span> / {selected.id}</span>
        </p>
        <div
          role="tablist"
          aria-label="404 explorations"
          className="error-tabs"
        >
          {concepts.map((concept, index) => (
            <button
              key={concept.id}
              id={`concept-${concept.id}`}
              type="button"
              role="tab"
              aria-selected={selected.id === concept.id}
              aria-controls="error-scene"
              tabIndex={selected.id === concept.id ? 0 : -1}
              onClick={() => select(concept)}
              onKeyDown={(event) => {
                let next: number | undefined;
                if (event.key === "ArrowRight")
                  next = (index + 1) % concepts.length;
                if (event.key === "ArrowLeft")
                  next = (index + concepts.length - 1) % concepts.length;
                if (event.key === "Home") next = 0;
                if (event.key === "End") next = concepts.length - 1;
                if (next !== undefined) {
                  event.preventDefault();
                  select(concepts[next]);
                  document
                    .getElementById(`concept-${concepts[next].id}`)
                    ?.focus();
                }
              }}
            >
              <span>{concept.id}</span>
              {concept.name}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
