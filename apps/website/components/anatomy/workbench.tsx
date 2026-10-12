"use client";

import {
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import { concepts, conceptKeys, type Concept } from "./model";

export function Workbench({
  art,
  style,
  initialConcept,
  compact,
}: {
  art: Record<Concept | "base", ReactNode>;
  style: CSSProperties;
  initialConcept: Concept;
  compact: boolean;
}) {
  const id = useId();
  const [selected, setSelected] = useState<Concept>(initialConcept);
  const [phase, setPhase] = useState<"idle" | "running" | "complete">("idle");
  const [progress, setProgress] = useState(0);
  const [name, setName] = useState("Ada");
  const [code, setCode] = useState("const sum = (a, b) => a + b;");
  const concept = concepts[selected];
  const result =
    selected === "tools"
      ? `Hello, ${name}!`
      : selected === "prompts"
        ? `Review this code for clarity: ${code}`
        : concept.result;
  const input =
    selected === "tools"
      ? JSON.stringify({ name })
      : selected === "prompts"
        ? JSON.stringify({ code })
        : concept.input;
  // Match the keyframe's physical stroke: advance, dwell, return to the mount.
  const stroke =
    progress < 40 ? progress / 40 : progress <= 65 ? 1 : (100 - progress) / 35;
  const position =
    progress === 100
      ? "Complete"
      : progress === 0
        ? "Ready"
        : progress < 40
          ? "Advancing"
          : progress <= 65
            ? "Engaged"
            : "Returning";

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => {
      if (media.matches && phase === "running") {
        setPhase("complete");
        setProgress(100);
      }
    };
    media.addEventListener("change", settle);
    return () => media.removeEventListener("change", settle);
  }, [phase]);

  function select(key: Concept) {
    setSelected(key);
    setPhase("idle");
    setProgress(0);
  }
  function run() {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setProgress(reduced ? 100 : 0);
    setPhase(reduced ? "complete" : "running");
  }
  function resetInput() {
    setProgress(0);
    setPhase("idle");
  }

  return (
    <section
      className={`mcp-workbench ${compact ? "workbench-compact" : ""}`}
      aria-label="Explore MCP core concepts"
      style={{ ...style, "--wb-stroke": stroke } as CSSProperties}
    >
      <div className="workbench-tabs" role="tablist" aria-label="MCP concepts">
        {conceptKeys.map((key, index) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${id}-${key}`}
            aria-selected={key === selected}
            aria-controls={`${id}-panel`}
            tabIndex={key === selected ? 0 : -1}
            onClick={() => select(key)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight")
                next = (index + 1) % conceptKeys.length;
              else if (event.key === "ArrowLeft")
                next = (index + conceptKeys.length - 1) % conceptKeys.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = conceptKeys.length - 1;
              else return;
              event.preventDefault();
              select(conceptKeys[next]);
              document.getElementById(`${id}-${conceptKeys[next]}`)?.focus();
            }}
          >
            <span className="concept-indicator" aria-hidden="true" />
            {concepts[key].label}
          </button>
        ))}
        <span className="workbench-tab-note">
          Three primitives. One protocol.
        </span>
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-${selected}`}
        className="workbench-panel"
        tabIndex={0}
      >
        <div
          className={`workbench-stage iso-plate ${phase === "running" ? "is-running" : ""}`}
          data-concept={selected}
          onAnimationEnd={(event) => {
            if (
              ["wb-press", "wb-drawer", "wb-paper"].includes(
                event.animationName
              )
            ) {
              setPhase("complete");
              setProgress(100);
            }
          }}
        >
          <div className="workbench-figure-label">
            <span>Fig. 01 / MCP workbench</span>
            <span>{concept.method}</span>
          </div>
          <svg
            viewBox="0 0 820 470"
            className="workbench-art"
            role="group"
            aria-label="Interactive MCP machinery"
          >
            <g aria-hidden="true">{art.base}</g>
            {conceptKeys.map((key) => (
              <g
                key={key}
                data-instrument={key}
                role="button"
                tabIndex={0}
                aria-label={`Explore ${concepts[key].label}`}
                aria-pressed={key === selected}
                onClick={() => select(key)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    select(key);
                  }
                }}
              >
                <title>{`${concepts[key].label} — click to explore`}</title>
                {art[key]}
              </g>
            ))}
          </svg>
          <div className="workbench-transport">
            <div>
              <label htmlFor={`${id}-motion`}>Scrub the mechanism</label>
              <span>
                {phase === "running" ? "Running" : `${position} / ${progress}%`}
              </span>
            </div>
            <input
              id={`${id}-motion`}
              type="range"
              min="0"
              max="100"
              value={progress}
              disabled={phase === "running"}
              aria-valuetext={`${position}, ${progress} percent`}
              onChange={(event) => {
                const next = Number(event.target.value);
                setProgress(next);
                setPhase(next === 100 ? "complete" : "idle");
              }}
            />
          </div>
          <div className="workbench-caption">
            <span className="status-dot" />
            <span>{concept.mechanism}</span>
          </div>
        </div>
        <div className="workbench-inspector">
          <p className="eyebrow">{concept.label}</p>
          <h3>{concept.verb}</h3>
          <p className="workbench-description">{concept.description}</p>
          <details className="workbench-code">
            <summary>{concept.file}</summary>
            <pre>
              <code>{concept.code}</code>
            </pre>
          </details>
          <div className="workbench-input">
            <label htmlFor={`${id}-input`}>
              {selected === "tools"
                ? "Name"
                : selected === "prompts"
                  ? "Code to review"
                  : "Resource URI"}
            </label>
            <input
              id={`${id}-input`}
              type="text"
              spellCheck={false}
              maxLength={180}
              readOnly={selected === "resources"}
              disabled={phase === "running"}
              value={
                selected === "tools"
                  ? name
                  : selected === "prompts"
                    ? code
                    : concept.input
              }
              onChange={(event) => {
                if (selected === "tools") setName(event.target.value);
                else if (selected === "prompts") setCode(event.target.value);
                resetInput();
              }}
            />
          </div>
          <div className="workbench-actions">
            <button
              type="button"
              className="workbench-run"
              disabled={phase === "running"}
              onClick={run}
            >
              {phase === "complete" ? (
                <RotateCcw size={13} />
              ) : (
                <Play size={13} />
              )}{" "}
              {phase === "running" ? "Running…" : concept.action}
            </button>
            <Link href={`/docs/core-concepts/${selected}`}>
              Read the docs <ArrowRight size={13} />
            </Link>
          </div>
          <div
            className="workbench-result"
            aria-live="polite"
            aria-atomic="true"
          >
            <span>
              {phase === "complete" ? "RESULT" : "LOCAL DEMO / INPUT"}
            </span>
            <code>{phase === "complete" ? result : input}</code>
          </div>
        </div>
      </div>
    </section>
  );
}
