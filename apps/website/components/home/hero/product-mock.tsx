"use client";

import Link from "next/link";
import { useState } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

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
  ["email", "Resend", "/docs/integrations/resend"],
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
const format = (n: number) => Math.round(n).toLocaleString("en-US");
const ago = (hour: number) =>
  hour === HOURS - 1 ? "This hour" : `${HOURS - 1 - hour}h ago`;

function Wordmark() {
  return (
    <svg
      width="63"
      height="24"
      viewBox="0 0 63 24"
      fill="currentColor"
      className="hero-mock-brand"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M52.5 18.1313V18.9556H58.5116V18.1313H56.794V14.2731H57.6526V15.1333H59.3703V15.9934H60.229V15.1333H61.9469V14.2731H62.8055V7.39184H61.9469V5.67147H61.0877V4.81129H59.3703V3.95117H57.6526V4.81129H55.9353V5.67147H55.0763V6.53165H52.5V7.39184H53.3587V18.1313H52.5ZM57.6526 14.2731V13.4129H56.794V5.67147H57.6526V6.53165H58.5116V7.39184H59.3703V14.2731H57.6526Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M46.3668 16.9969H47.3703V15.9934H48.3739V14.9899H50.3809V15.9934H49.3775V16.9969H48.3739V18.0005H47.3703V19.004H44.3598V18.0005H42.3526V16.9969H41.3493V9.97232H40.3457V8.96879H41.3493V7.96527H42.3526V6.96175H43.3562V5.95822H45.3634V4.9547H47.3703V3.95117H48.3739V4.9547H49.3775V5.95822H50.3809V6.96175H51.3845V7.96527H50.3809V10.9758H49.3775V9.97232H48.3739V8.96879H47.3703V7.96527H46.3668V6.96175H45.3634V15.9934H46.3668V16.9969ZM50.3809 14.9899V13.9864H51.3845V14.9899H50.3809Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M36.0598 3.95117V4.9547H35.0562V5.95822H34.0529V6.96175H32.0457V5.95822H31.0423V4.9547H30.0388V3.95117H29.0352V4.9547H28.0316V5.95822H27.0282V6.96175H25.021V5.95822H24.0175V4.9547H23.0141V3.95117H22.0105V4.9547H21.0069V5.95822H19V6.96175H21.0069V16.9969H20.0033V18.0005H22.0105V19.004H24.0175V18.0005H26.0246V16.9969H25.021V7.96527H27.0282V6.96175H28.0316V16.9969H27.0282V18.0005H29.0352V19.004H31.0423V18.0005H33.0493V16.9969H32.0457V7.96527H34.0529V6.96175H35.0562V16.9969H34.0529V18.0005H36.0598V19.004H38.067V18.0005H40.0739V16.9969H39.0703V7.96527H40.0739V6.96175H39.0703V5.95822H38.067V4.9547H37.0634V3.95117H36.0598Z"
      />
      <path d="M0 5H1.00213V6H0V5ZM1.00213 22V19H2.00426V18H3.0064V17H5.01066V16H6.01279V15H7.01492V17H9.01919V18H10.0213V19H11.0235V20H10.0213V21H9.01919V22H8.01706V21H7.01492V20H5.01066V21H4.00853V23H5.01066V24H3.0064V23H2.00426V22H1.00213ZM1.00213 5V3H2.00426V2H3.0064V1H7.01492V2H9.01919V3H10.0213V5H11.0235V6H12.0256V7H13.0277V8H12.0256V9H17.0362V10H16.0341V11H14.0298V13H15.032V14H16.0341V15H17.0362V17H18.0384V18H19.0405V19H17.0362V20H16.0341V21H15.032V20H14.0298V18H13.0277V16H12.0256V15H11.0235V13H9.01919V12H2.00426V11H3.0064V10H4.00853V9H8.01706V8H7.01492V6H6.01279V4H5.01066V3H4.00853V4H2.00426V5H1.00213ZM7.01492 15V14H8.01706V15H7.01492ZM8.01706 14V13H9.01919V14H8.01706ZM11.0235 19V18H12.0256V19H11.0235ZM11.0235 5V4H12.0256V5H11.0235ZM12.0256 4V3H13.0277V1H15.032V2H17.0362V1H19.0405V4H18.0384V5H16.0341V6H15.032V5H14.0298V7H13.0277V4H12.0256ZM19.0405 18V17H20.0426V18H19.0405ZM19.0405 1V0H20.0426V1H19.0405Z" />
    </svg>
  );
}

export const DASHBOARD_FPS = 60;
// Four seconds per view leaves time to read each tool before the next change.
const VIEW_FRAMES = 4 * DASHBOARD_FPS;
const TRANSITION_FRAMES = Math.round(0.75 * DASHBOARD_FPS);
const TOUR = [null, 0, 1, 2, 3, 4, null] as const;
export const DASHBOARD_FRAMES = TOUR.length * VIEW_FRAMES;
const ease = Easing.bezier(0.4, 0, 0.2, 1);

type DashboardView = { series: number[]; p95: number };
const allTools: DashboardView = {
  series: traffic.map((_, i) => sum(calls.map((perTool) => perTool[i]))),
  p95: 96,
};
const viewFor = (tool: number | null): DashboardView =>
  tool === null ? allTools : { series: calls[tool], p95: tools[tool].p95 };
const progressAt = (frame: number) =>
  interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const blend = (
  from: DashboardView,
  to: DashboardView,
  progress: number
): DashboardView => ({
  series: to.series.map(
    (value, i) => from.series[i] + (value - from.series[i]) * progress
  ),
  p95: from.p95 + (to.p95 - from.p95) * progress,
});

type Interaction = {
  tool: number | null;
  resume: boolean;
  from: DashboardView;
  frame: number;
  settled: boolean;
};

export function DashboardScene({ still }: { still: boolean }) {
  const frame = useCurrentFrame();
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [inspection, setInspection] = useState<{
    hour: number;
    view: DashboardView;
    tool: number | null;
  } | null>(null);
  const stage = still ? 0 : Math.floor(frame / VIEW_FRAMES);
  const tourTool = TOUR[stage];
  // The last and first stages both show all tools, making the loop seamless.
  const tourView = blend(
    viewFor(TOUR[Math.max(0, stage - 1)]),
    viewFor(tourTool),
    still ? 1 : progressAt(frame % VIEW_FRAMES)
  );
  const selected =
    interaction && !interaction.resume ? interaction.tool : tourTool;
  const target =
    interaction && !interaction.resume ? viewFor(interaction.tool) : tourView;
  const elapsed = interaction
    ? (frame - interaction.frame + DASHBOARD_FRAMES) % DASHBOARD_FRAMES
    : 0;
  const animated = interaction
    ? blend(
        interaction.from,
        target,
        still || interaction.settled ? 1 : progressAt(elapsed)
      )
    : tourView;

  // Retire completed transitions so an old hover cannot replay at the loop boundary.
  // Adjusting this local state during render also handles reduced motion immediately.
  if (
    interaction &&
    !interaction.settled &&
    (still || elapsed >= TRANSITION_FRAMES)
  ) {
    setInteraction(
      interaction.resume ? null : { ...interaction, settled: true }
    );
  }

  // Hold the values while a tooltip is being read, even as the tour clock advances.
  const view = inspection?.view ?? animated;
  const tool = inspection ? inspection.tool : selected;
  const hovered = inspection?.hour ?? null;
  const { series, p95 } = view;
  const peak = Math.max(...series);
  const total = sum(series);
  const errors = Math.round(total * 0.006);
  const select = (next: number | null, resume = false) => {
    setInspection(null);
    setInteraction({ tool: next, resume, from: view, frame, settled: false });
  };

  return (
    <div className="hero-mock" aria-hidden="true">
      <div className="hero-mock-bar">
        <Wordmark />
        <span className="hero-mock-mono">localhost:3001/mcp</span>
      </div>
      <div className="hero-mock-panels">
        <div className="hero-mock-panel">
          <div className="hero-mock-server">
            <span className="hero-mock-avatar" />
            <span>
              <span className="hero-mock-strong">my-server</span>
              <span className="hero-mock-muted">HTTP · xmcp 1.8.0</span>
            </span>
          </div>
          <div
            className="hero-mock-tools"
            onPointerLeave={() => select(null, true)}
          >
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
                onPointerEnter={() => select(i)}
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
              <span className="hero-mock-figure">{format(p95)} ms</span>
            </span>
          </div>
          <div
            className="hero-mock-plot"
            data-hovering={hovered !== null || undefined}
            onPointerLeave={() => select(null, true)}
          >
            {series.map((value, i) => (
              <span
                key={i}
                className="hero-mock-column"
                data-active={hovered === i || undefined}
                onPointerEnter={() => setInspection({ hour: i, view, tool })}
              >
                <span
                  className="hero-mock-fill"
                  style={{ height: `${Math.max(2, (value / peak) * 100)}%` }}
                >
                  {clientShares[i].map((share, c) => (
                    <span
                      key={c}
                      className={`hero-mock-client-${c}`}
                      // CSS serializes flex factors with limited precision.
                      style={{ flexGrow: Number(share.toFixed(6)) }}
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
                  p95 <b>{format(p95)} ms</b>
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
