import type { CSSProperties, ReactNode, SVGProps } from "react";
import { Icons } from "@/components/icons";

// Line drawings for the feature tiles, all in one vocabulary: 14px Lucide icons
// (the docs' icon set) stroked at 1px, faint solid lines for structure, dotted
// lines for data flow, and small dots that light when data arrives. Strokes use
// currentColor and the site's faint/muted tokens, so they follow the theme.
// Motion is CSS-only and shares one cycle (see `.feature-schematic` in
// design-system.css):
// - `pulse` paths carry a short segment from start to end of the path.
// - `lit` shapes fill when a pulse arrives and empty again before the next one.
// Both take `--delay`; a `lit` shape with the same delay as a pulse lights up
// as that pulse arrives. Negative delays start partway through the cycle.

type Vars = Record<`--${string}`, string | number>;
const vars = (values: Vars) => values as CSSProperties;

function Schematic({
  children,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      strokeWidth={1}
      aria-hidden="true"
      className="feature-schematic"
      {...props}
    >
      {children}
    </svg>
  );
}

function Pulse({ d, delay = 0 }: { d: string; delay?: number }) {
  return (
    <path
      d={d}
      pathLength={100}
      className="pulse"
      style={vars({ "--delay": `${delay}s` })}
    />
  );
}

/** Shape props that fill on arrival; `rest` keeps it filled without motion. */
const lit = (delay: number, rest = false) => ({
  className: "lit",
  style: vars({ "--delay": `${delay}s`, "--rest": rest ? 1 : 0 }),
});

/** The dot that lights where a pulse arrives. */
function Arrival({
  x,
  y,
  delay,
  rest,
}: {
  x: number;
  y: number;
  delay: number;
  rest?: boolean;
}) {
  return (
    <circle cx={x} cy={y} r={1.5} stroke="currentColor" {...lit(delay, rest)} />
  );
}

const ICON = 14;

// Lucide icon shapes on their 24px grid.
const glyphs = {
  folder: (
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  ),
  sheet: (
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" />
  ),
  fileCode: (
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M10 12.5 8 15l2 2.5m4-5 2 2.5-2 2.5" />
  ),
  server: (
    <>
      <rect x={2} y={2} width={20} height={8} rx={2} />
      <rect x={2} y={14} width={20} height={8} rx={2} />
      <path d="M6 6h.01M6 18h.01" />
    </>
  ),
  bot: (
    <>
      <rect x={4} y={8} width={16} height={12} rx={2} />
      <path d="M12 8V4H8M2 14h2M20 14h2M15 13v2M9 13v2" />
    </>
  ),
  lock: (
    <>
      <rect x={3} y={11} width={18} height={11} rx={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  card: (
    <>
      <rect x={2} y={5} width={20} height={14} rx={2} />
      <path d="M2 10h20" />
    </>
  ),
  chart: <path d="M5 21v-6M12 21V3M19 21V9" />,
  shield: (
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  ),
  gauge: <path d="m12 14 4-4M3.34 19a10 10 0 1 1 17.32 0" />,
  scroll: (
    <path d="M15 12h-5M15 8h-5M19 17V5a2 2 0 0 0-2-2H4M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
  ),
  globe: (
    <>
      <circle cx={12} cy={12} r={10} />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
    </>
  ),
  terminal: (
    <>
      <rect x={3} y={3} width={18} height={18} rx={2} />
      <path d="m7 11 2-2-2-2M11 13h4" />
    </>
  ),
  box: (
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM3.3 7l8.7 5 8.7-5M12 22V12" />
  ),
};

/** A Lucide glyph placed in schematic units, stroked at 1px like the lines. */
function Icon({
  glyph,
  x,
  y,
  size = ICON,
}: {
  glyph: keyof typeof glyphs;
  x: number;
  y: number;
  size?: number;
}) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={24 / size}
      strokeLinecap="round"
      strokeLinejoin="round"
      overflow="visible"
    >
      {glyphs[glyph]}
    </svg>
  );
}

const files = [34, 48, 62];

/** Files in a folder, each registered as a tool on the server. */
export function RoutingSchematic() {
  return (
    <Schematic>
      <Icon glyph="folder" x={10} y={9} />
      <path d="M17 24V62" className="faint" />
      {files.map((y, i) => (
        <g key={y}>
          <path d={`M17 ${y}h7`} className="faint" />
          <Icon glyph="sheet" x={24} y={y - 6} size={12} />
          <path d={`M40 ${y}h38`} className="dotted muted" />
          <Pulse d={`M40 ${y}h39`} delay={i * 0.3} />
          <Arrival x={80.5} y={y} delay={i * 0.3} rest={i === 0} />
          <path d={`M82 ${y}h6`} className="faint" />
        </g>
      ))}
      <path d="M88 34v28M88 48h5" className="faint" />
      <Pulse d="M82 34h6v14h5" delay={0.75} />
      <Pulse d="M82 62h6V48h5" delay={1.05} />
      <Icon glyph="server" x={94} y={41} />
    </Schematic>
  );
}

const services = [
  { y: 18, glyph: "lock" },
  { y: 40, glyph: "card" },
  { y: 62, glyph: "chart" },
] as const;

/** A client reaching a server that fans out to auth, payments and analytics. */
export function IntegrationsSchematic() {
  return (
    <Schematic>
      <Icon glyph="bot" x={6} y={33} />
      <path d="M22 40h17" className="dotted muted" />
      <Pulse d="M22 40h17" />
      <Icon glyph="server" x={40} y={33} />
      <path d="M56 40h10M66 18v44" className="faint" />
      {services.map(({ y, glyph }, i) => (
        <g key={y}>
          <path d={`M66 ${y}h20`} className="faint" />
          <Pulse d={`M56 40h10V${y}h21`} delay={0.75 + i * 0.12} />
          <Arrival x={88.5} y={y} delay={0.75 + i * 0.12} rest={i !== 1} />
          <Icon glyph={glyph} x={94} y={y - 7} />
        </g>
      ))}
    </Schematic>
  );
}

// The request pulse crosses 22→93 in the first 36% of the cycle; each gate's
// dot lights when the pulse reaches it (see the timing note above).
const gates = [
  { x: 36, glyph: "shield" },
  { x: 57, glyph: "gauge" },
  { x: 78, glyph: "scroll" },
] as const;
const arrival = (x: number) => ((x - 22) / 71) * 0.864 - 0.77;

/** A request passing through auth, rate-limit and logging on its way in. */
export function MiddlewareSchematic() {
  return (
    <Schematic>
      <Icon glyph="bot" x={6} y={33} />
      {/* The flow is drawn between the gates, so no line runs behind them. */}
      {[22, ...gates.map(({ x }) => x + 9)].map((from, i) => (
        <path
          key={from}
          d={`M${from} 40H${gates[i] ? gates[i].x - 9 : 93}`}
          className="dotted muted"
        />
      ))}
      <Pulse d="M22 40H93" />
      {gates.map(({ x, glyph }, i) => (
        <g key={x}>
          <Icon glyph={glyph} x={x - 7} y={33} />
          <path d={`M${x} 49v5`} className="faint" />
          <Arrival x={x} y={56.5} delay={arrival(x)} rest={i === 0} />
        </g>
      ))}
      <Icon glyph="server" x={94} y={33} />
    </Schematic>
  );
}

// [y, resting value, drift, phase]
const settings = [
  [20, 70, -18, -0.3],
  [33, 50, 30, -1.1],
  [46, 92, -26, -0.6],
  [59, 62, 22, -1.7],
];

/** One config file driving settings, each drifting between two values. */
export function ConfigurationSchematic() {
  return (
    <Schematic>
      <Icon glyph="fileCode" x={4} y={33} />
      <path d="M20 40h6M26 20v39" className="faint" />
      {settings.map(([y, value, shift, delay]) => (
        <g
          key={y}
          style={vars({
            "--shift": shift,
            "--length": value - 32,
            "--delay": `${delay}s`,
          })}
        >
          <path d={`M26 ${y}h6`} className="faint" />
          <path d={`M32 ${y}H108`} className="faint dotted" />
          <path
            d={`M32 ${y}H108`}
            pathLength={76}
            stroke="currentColor"
            className="track"
          />
          <circle cx={value} cy={y} r={2.5} className="knob fill" />
        </g>
      ))}
    </Schematic>
  );
}

const http = "M24 40C42 40 44 20 64 20H86";
const stdio = "M24 40C42 40 44 60 64 60H86";

/** One server reaching clients over HTTP (the web) and STDIO (a local shell). */
export function TransportSchematic() {
  return (
    <Schematic>
      <Icon glyph="server" x={8} y={33} />
      <path d={http} className="faint" />
      <Pulse d={http} />
      <path d={stdio} className="dotted muted" />
      <Pulse d={stdio} delay={1.2} />
      <Arrival x={87.5} y={20} delay={0} />
      <Arrival x={87.5} y={60} delay={1.2} />
      <Icon glyph="globe" x={93} y={13} />
      <Icon glyph="terminal" x={93} y={53} />
    </Schematic>
  );
}

// Both framework routes merge and enter the app window, where xmcp docks.
const nextApp = "M25 20H30Q38 20 38 28V34Q38 40 46 40H62";
const expressApp = "M25 60H30Q38 60 38 52V46Q38 40 46 40H62";
const code = [
  [32, 20],
  [38, 14],
  [44, 18],
  [50, 10],
];

/** The docs' Next.js and Express marks plugging xmcp into an existing app. */
export function AdapterSchematic() {
  return (
    <Schematic>
      <Icons.nextjs x={8} y={12.5} />
      <Icons.express x={8} y={52.5} />
      <path d={nextApp} className="faint" />
      <path d={expressApp} className="dotted muted" />
      <Pulse d={nextApp} />
      <Pulse d={expressApp} delay={1.2} />
      <rect
        x={60.5}
        y={14.5}
        width={52}
        height={51}
        rx={3}
        stroke="currentColor"
      />
      <path d="M61 22h51" className="faint" />
      {[65, 69, 73].map((x) => (
        <circle key={x} cx={x} cy={18.25} r={1} className="muted" />
      ))}
      <Arrival x={64.5} y={40} delay={0} />
      <Icon glyph="box" x={68} y={33} />
      {code.map(([y, length], i) => (
        <path
          key={y}
          d={`M87 ${y}h${length}`}
          pathLength={1}
          className="faint type"
          style={vars({ "--delay": `${i * 0.18}s` })}
        />
      ))}
    </Schematic>
  );
}
