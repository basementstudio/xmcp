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

const rows = [34, 48, 62];

/** Files in a folder, each registered as a tool on the server. */
export function RoutingSchematic() {
  return (
    <Schematic>
      <path d="M14 13.5h6l2 2h8v9H14z" stroke="currentColor" />
      <path d="M20 24.5V62" className="faint" />
      {rows.map((y, i) => (
        <g key={y}>
          <path d={`M20 ${y}h8`} className="faint" />
          <path
            d={`M29.5 ${y - 5}h5l3 3v7h-8z`}
            stroke="currentColor"
            strokeLinejoin="round"
          />
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

const http = "M16 40C38 40 42 17 66 17H97";
const stdio = "M16 40C38 40 42 63 66 63H97";

/** One server reaching clients over HTTP and STDIO. */
export function TransportSchematic() {
  return (
    <Schematic>
      {[-14, -7, 7, 14].map((offset, i) => {
        const d = `M16 40C34 40 38 ${40 + offset} 56 ${40 + offset}`;
        return (
          <g key={offset}>
            <path d={d} className="faint" />
            <Pulse d={d} delay={-1.2 + i * 0.3} />
          </g>
        );
      })}
      <circle cx={13.5} cy={40} r={2.5} stroke="currentColor" />
      <path d={http} stroke="currentColor" />
      <Pulse d={http} />
      <path d={stdio} className="dotted muted" />
      <Pulse d={stdio} delay={1.2} />
      <rect
        x={98.5}
        y={12.5}
        width={9}
        height={9}
        stroke="currentColor"
        {...lit(0, true)}
      />
      <rect
        x={98.5}
        y={58.5}
        width={9}
        height={9}
        stroke="currentColor"
        {...lit(1.2)}
      />
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
