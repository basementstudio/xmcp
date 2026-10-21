import type { CSSProperties, ReactNode, SVGProps } from "react";

// Line drawings for the feature tiles. Strokes use currentColor and the site's
// faint/muted tokens, so they follow the theme. Motion is CSS-only and shares
// one cycle (see `.feature-schematic` in design-system.css):
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

// Lucide icons, the set the docs sidebar uses: folder and file-text (sheet).
const FOLDER =
  "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z";
const SHEET = [
  "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
  "M14 2v4a2 2 0 0 0 2 2h4",
  "M10 9H8",
  "M16 13H8",
  "M16 17H8",
];

/** A 24px Lucide icon placed in schematic units, stroked at 1px like the lines. */
function Icon({
  x,
  y,
  size,
  children,
}: {
  x: number;
  y: number;
  size: number;
  children: ReactNode;
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
      {children}
    </svg>
  );
}

const rows = [34, 48, 62];

/** Files in a folder, each registered as a tool on the server. */
export function RoutingSchematic() {
  return (
    <Schematic>
      <Icon x={12} y={8} size={14}>
        <path d={FOLDER} />
      </Icon>
      <path d="M19 22V62" className="faint" />
      {rows.map((y, i) => (
        <g key={y}>
          <path d={`M19 ${y}h9`} className="faint" />
          <Icon x={28} y={y - 6} size={12}>
            {SHEET.map((d) => (
              <path key={d} d={d} />
            ))}
          </Icon>
          <path d={`M42 ${y}h40`} className="dotted muted" />
          <Pulse d={`M42 ${y}h41`} delay={i * 0.3} />
          <rect
            x={84.5}
            y={y - 3.5}
            width={7}
            height={7}
            stroke="currentColor"
            {...lit(i * 0.3, i === 0)}
          />
          <path d={`M92 ${y}h7`} className="faint" />
        </g>
      ))}
      <path d="M99 34v28M99 48h6" className="faint" />
      <Pulse d="M92 34h7v14h6" delay={0.75} />
      <Pulse d="M92 62h7V48h6" delay={1.05} />
      <circle cx={107.5} cy={48} r={2.5} stroke="currentColor" {...lit(1.1)} />
    </Schematic>
  );
}

const services = [18, 40, 62];

/** A server fanning out to plugged-in services. */
export function IntegrationsSchematic() {
  return (
    <Schematic>
      <circle cx={13.5} cy={40} r={2.5} stroke="currentColor" />
      <path d="M16 40h34" className="dotted muted" />
      <Pulse d="M16 40h34" />
      <rect
        x={50.5}
        y={32.5}
        width={15}
        height={15}
        stroke="currentColor"
        {...lit(0)}
      />
      <path d="M66 40h12M78 18v44" className="faint" />
      {services.map((y, i) => (
        <g key={y}>
          <path d={`M78 ${y}h20`} className="faint" />
          <Pulse d={`M66 40h12V${y}h20`} delay={0.75 + i * 0.12} />
          <circle cx={87.5} cy={y} r={1.5} stroke="currentColor" />
          <rect
            x={98.5}
            y={y - 4.5}
            width={9}
            height={9}
            stroke="currentColor"
            {...lit(0.75 + i * 0.12, i !== 1)}
          />
        </g>
      ))}
    </Schematic>
  );
}

// The request pulse crosses 14→106 in the first 36% of the cycle; each gate
// lights when the pulse reaches it (see the timing note above).
const gates = [33, 54, 75];
const arrival = (x: number) => ((x + 3 - 14) / 92) * 0.864 - 0.77;

/** A request passing through a stack of middleware gates. */
export function MiddlewareSchematic() {
  return (
    <Schematic>
      <circle cx={11.5} cy={40} r={2.5} stroke="currentColor" />
      <circle
        cx={108.5}
        cy={40}
        r={2.5}
        stroke="currentColor"
        {...lit(arrival(103))}
      />
      <path d="M14 40H106" className="dotted muted" />
      <Pulse d="M14 40H106" />
      {gates.map((x, i) => (
        <g key={x}>
          <rect
            x={x + 0.5}
            y={24.5}
            width={5}
            height={31}
            stroke="currentColor"
            className="lit ground"
            style={vars({
              "--delay": `${arrival(x)}s`,
              "--rest": i === 0 ? 1 : 0,
            })}
          />
          <path d={`M${x + 3} 18v3`} className="faint" />
          <path d={`M${x + 3} 59v3`} className="faint" />
        </g>
      ))}
      <path d="M22 62h76" className="faint dotted" />
    </Schematic>
  );
}

// [y, resting value, drift, phase]
const settings = [
  [20, 70, -18, -0.3],
  [33, 44, 30, -1.1],
  [46, 88, -26, -0.6],
  [59, 58, 22, -1.7],
];

/** Settings tracks, each drifting between two values. */
export function ConfigurationSchematic() {
  return (
    <Schematic>
      {settings.map(([y, value, shift, delay], i) => (
        <g
          key={y}
          style={vars({
            "--shift": shift,
            "--length": value - 24,
            "--delay": `${delay}s`,
          })}
        >
          <path d={`M10 ${y}h8`} className="muted" />
          <path d={`M24 ${y}H100`} className="faint dotted" />
          <path
            d={`M24 ${y}H100`}
            pathLength={76}
            stroke="currentColor"
            className="track"
          />
          <rect
            x={value - 3.5}
            y={y - 3.5}
            width={7}
            height={7}
            stroke="currentColor"
            className={i === 2 ? "knob fill" : "knob ground"}
          />
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
      <Icon x={8} y={33} size={14}>
        <rect x={2} y={2} width={20} height={8} rx={2} />
        <rect x={2} y={14} width={20} height={8} rx={2} />
        <path d="M6 6h.01M6 18h.01" />
      </Icon>
      <path d={http} stroke="currentColor" />
      <Pulse d={http} />
      <path d={stdio} className="dotted muted" />
      <Pulse d={stdio} delay={1.2} />
      <circle cx={87.5} cy={20} r={1.5} stroke="currentColor" {...lit(0)} />
      <circle cx={87.5} cy={60} r={1.5} stroke="currentColor" {...lit(1.2)} />
      <Icon x={93} y={13} size={14}>
        <circle cx={12} cy={12} r={10} />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
      </Icon>
      <Icon x={93} y={53} size={14}>
        <rect x={3} y={3} width={18} height={18} rx={2} />
        <path d="m7 11 2-2-2-2M11 13h4" />
      </Icon>
    </Schematic>
  );
}

const code = [
  [30, 22],
  [36, 16],
  [42, 20],
  [48, 12],
];

/** An existing app window that xmcp docks into. */
export function AdapterSchematic() {
  return (
    <Schematic>
      <rect x={18.5} y={12.5} width={72} height={55} stroke="currentColor" />
      <path d="M19 21h71" className="faint" />
      {[23, 27, 31].map((x) => (
        <circle key={x} cx={x} cy={16.75} r={1} className="muted" />
      ))}
      {code.map(([y, length], i) => (
        <path
          key={y}
          d={`M26 ${y}h${length}`}
          pathLength={1}
          className="faint type"
          style={vars({ "--delay": `${i * 0.18}s` })}
        />
      ))}
      <rect x={58.5} y={36.5} width={21} height={21} className="faint dotted" />
      <g className="plug">
        <rect
          x={61.5}
          y={39.5}
          width={15}
          height={15}
          stroke="currentColor"
          className="fill"
        />
        <path d="M77 47h24" className="dotted muted" />
        <circle cx={103.5} cy={47} r={2.5} stroke="currentColor" />
      </g>
      <Pulse d="M101 47H78" delay={1} />
    </Schematic>
  );
}
