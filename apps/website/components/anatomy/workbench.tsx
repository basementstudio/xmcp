"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import { concepts, conceptKeys, type Concept } from "./model";

export function Workbench({
  children,
  initialConcept,
  compact,
}: {
  children: ReactNode;
  initialConcept: Concept;
  compact: boolean;
}) {
  const id = useId();
  const [selected, setSelected] = useState<Concept>(initialConcept);
  const [phase, setPhase] = useState<"idle" | "running" | "complete">("idle");
  const concept = concepts[selected];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => {
      if (media.matches)
        setPhase((phase) => (phase === "running" ? "complete" : phase));
    };
    media.addEventListener("change", settle);
    return () => media.removeEventListener("change", settle);
  }, []);

  function select(key: Concept) {
    setSelected(key);
    setPhase("idle");
  }
  function run() {
    setPhase(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "complete"
        : "running"
    );
  }

  return (
    <section
      className={`mcp-workbench ${compact ? "workbench-compact" : ""}`}
      aria-label="Explore MCP core concepts"
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
            if (event.animationName.startsWith("wb-")) setPhase("complete");
          }}
        >
          <div className="workbench-figure-label">
            <span>Fig. 01 / MCP workbench</span>
            <span>{concept.method}</span>
          </div>
          {children}
          <div className="workbench-caption">
            <span className="status-dot" />
            <span>{concept.mechanism}</span>
          </div>
        </div>
        <div className="workbench-inspector">
          <p className="eyebrow">{concept.label}</p>
          <h3>{concept.verb}</h3>
          <p className="workbench-description">{concept.description}</p>
          <div className="workbench-code">
            <div>{concept.file}</div>
            <pre>
              <code>{concept.code}</code>
            </pre>
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
            <code>{phase === "complete" ? concept.result : concept.input}</code>
          </div>
        </div>
      </div>
    </section>
  );
}
