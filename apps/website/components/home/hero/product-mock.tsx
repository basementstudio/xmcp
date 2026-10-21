"use client";

import Link from "next/link";
import { useState } from "react";

// An illustrative xmcp dashboard for the homepage hero: tool calls per hour,
// per tool. The figures are generated sample data; nothing is fetched.
// Pointer-only interactions: it is decorative and hidden from assistive
// technology, so nothing in it is focusable.

const HOURS = 32;

const tools = [
  { name: "search_docs", share: 0.42, phase: 0, p95: 88 },
  { name: "get_weather", share: 0.27, phase: 1.9, p95: 42 },
  { name: "create_issue", share: 0.17, phase: 3.4, p95: 120 },
  { name: "list_invoices", share: 0.09, phase: 4.6, p95: 64 },
  { name: "summarize_pr", share: 0.05, phase: 5.8, p95: 310 },
];

const middleware = [
  ["auth", "Better Auth", "/docs/integrations/better-auth"],
  ["rate-limit", "Upstash", "/docs/integrations/upstash"],
  ["paywall", "Commet", "/docs/integrations/commet"],
  ["logging", "JSON", "/docs/configuration/observability"],
];

// Calls per hour across all tools, with a couple of bursts.
const traffic = Array.from({ length: HOURS }, (_, i) => {
  const wave = 1 + 0.45 * Math.sin(i * 0.55) + 0.3 * Math.sin(i * 1.7 + 1);
  const burst = i === 9 || i === 24 ? 1.1 : i === 28 ? 0.6 : 0;
  return 1500 * (wave + burst);
});

// Each tool gets its own rhythm, so filtering changes the chart's shape.
const calls = tools.map(({ share, phase }) =>
  traffic.map((total, i) =>
    Math.round(total * share * (1 + 0.55 * Math.sin(i * 0.8 + phase)))
  )
);

// Which client made the calls; each gets its own shade of grey.
const clients = ["Claude", "Cursor", "ChatGPT"];
const clientShares = Array.from({ length: HOURS }, (_, i) => {
  const claude = 0.48 + 0.12 * Math.sin(i * 0.4);
  const cursor = 0.32 + 0.1 * Math.sin(i * 0.7 + 2);
  return [claude, cursor, 1 - claude - cursor];
});

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const format = (n: number) => n.toLocaleString("en-US");
const ago = (hour: number) =>
  hour === HOURS - 1 ? "This hour" : `${HOURS - 1 - hour}h ago`;

export function ProductMock() {
  const [tool, setTool] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const series =
    tool === null
      ? traffic.map((_, i) => sum(calls.map((perTool) => perTool[i])))
      : calls[tool];
  const peak = Math.max(...series);
  const total = sum(series);
  const errors = Math.round(total * 0.006);
  const p95 = tool === null ? 96 : tools[tool].p95;

  return (
    <div className="hero-mock" aria-hidden="true">
      <div className="hero-mock-bar">
        <span className="hero-mock-brand">Xmcp</span>
        <span className="hero-mock-mono">localhost:3001/mcp</span>
      </div>
      <div className="hero-mock-panels">
        <div className="hero-mock-panel">
          <div className="hero-mock-server">
            <span className="hero-mock-avatar" />
            <span>
              <span className="hero-mock-strong">acme-docs</span>
              <span className="hero-mock-muted">HTTP · xmcp 1.8.0</span>
            </span>
          </div>
          <div className="hero-mock-tools" onPointerLeave={() => setTool(null)}>
            <span className="hero-mock-row hero-mock-muted">
              <span>Tool</span>
              <span>Calls</span>
              <span>p95</span>
            </span>
            {tools.map(({ name, p95 }, i) => (
              <span
                key={name}
                className="hero-mock-row hero-mock-run"
                data-active={tool === i || undefined}
                onPointerEnter={() => setTool(i)}
              >
                <span className="hero-mock-mono hero-mock-strong">{name}</span>
                <span className="hero-mock-mono hero-mock-muted">
                  {format(sum(calls[i]))}
                </span>
                <span className="hero-mock-mono">{p95} ms</span>
              </span>
            ))}
          </div>
          <div className="hero-mock-tools">
            <span className="hero-mock-row hero-mock-middleware hero-mock-muted">
              <span>Middleware</span>
              <span>Config</span>
              <span>Status</span>
            </span>
            {/* Pointer shortcuts to the docs; the same pages are reachable from
                the docs navigation, so they stay out of the tab order. */}
            {middleware.map(([name, config, href]) => (
              <Link
                key={name}
                href={href}
                tabIndex={-1}
                className="hero-mock-row hero-mock-middleware hero-mock-run"
              >
                <span className="hero-mock-mono hero-mock-strong">{name}</span>
                <span className="hero-mock-muted">{config}</span>
                <span className="hero-mock-status">on</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="hero-mock-panel hero-mock-chart">
          <div className="hero-mock-stats">
            <span>
              <span className="hero-mock-muted">
                {tool === null ? "Tool calls" : tools[tool].name}
              </span>
              <span className="hero-mock-figure">{format(total)}</span>
            </span>
            <span>
              <span className="hero-mock-muted">Errors</span>
              <span className="hero-mock-figure">{format(errors)}</span>
            </span>
            <span className="text-right">
              <span className="hero-mock-muted">p95 latency</span>
              <span className="hero-mock-figure">{p95} ms</span>
            </span>
          </div>
          <div
            className="hero-mock-plot"
            data-hovering={hovered !== null || undefined}
            onPointerLeave={() => setHovered(null)}
          >
            {series.map((value, i) => (
              <span
                key={i}
                className="hero-mock-column"
                data-active={hovered === i || undefined}
                onPointerEnter={() => setHovered(i)}
              >
                <span
                  className="hero-mock-fill"
                  style={{ height: `${Math.max(2, (value / peak) * 100)}%` }}
                >
                  {clientShares[i].map((share, c) => (
                    <span
                      key={c}
                      className={`hero-mock-client-${c}`}
                      style={{ flexGrow: share }}
                    />
                  ))}
                </span>
              </span>
            ))}
            {hovered !== null && (
              <span
                className="hero-mock-tip"
                style={{
                  left: `${((hovered + 0.5) / HOURS) * 100}%`,
                  // Keep the tip inside the chart near either edge.
                  translate: `${(-hovered / (HOURS - 1)) * 100}% 0`,
                }}
              >
                <span className="hero-mock-strong">{ago(hovered)}</span>
                <span>
                  Calls <b>{format(series[hovered])}</b>
                </span>
                {clients.map((client, c) => (
                  <span key={client}>
                    <i className={`hero-mock-swatch hero-mock-client-${c}`} />{" "}
                    {client}{" "}
                    <b>
                      {format(
                        Math.round(series[hovered] * clientShares[hovered][c])
                      )}
                    </b>
                  </span>
                ))}
                <span>
                  Errors <b>{format(Math.round(series[hovered] * 0.006))}</b>
                </span>
                <span>
                  p95 <b>{p95} ms</b>
                </span>
              </span>
            )}
          </div>
          <div className="hero-mock-axis hero-mock-muted">
            <span>{HOURS}h ago</span>
            <span className="hero-mock-legend">
              {clients.map((client, c) => (
                <span key={client}>
                  <i className={`hero-mock-swatch hero-mock-client-${c}`} />{" "}
                  {client}
                </span>
              ))}
            </span>
            <span>Now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
