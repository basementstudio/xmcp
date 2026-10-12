// Geometry is computed on the server. Only finished SVG paths reach the client.
import * as k from "./iso-kit";

const plate = { x: -174, y: -62, w: 348, d: 154, r: 8 };
const P = k.fitProjection(
  [
    ...k.boxCorners(plate, -22, 0),
    ...k.boxCorners({ x: -147, y: -35, w: 77, d: 20, r: 0 }, 6, 123),
    ...k.boxCorners({ x: -43, y: -30, w: 78, d: 64, r: 0 }, 6, 95),
    ...k.boxCorners({ x: 67, y: -33, w: 74, d: 53, r: 0 }, 6, 77),
  ],
  820,
  470,
  {
    pad: 28,
    azimuth: 42,
    elevation: 28,
  }
);
const S = k.solidSvg;
const L = k.lineSvg;
const D = k.dotsSvg;
const at = (point: k.Point3) => k.iso(point, P);

function block(
  x: number,
  y: number,
  w: number,
  d: number,
  z: number,
  h: number,
  lit = false
) {
  return S(
    k.slabOf({ x, y, w, d, r: Math.min(2, w / 4, d / 4) }, z, h, P, 4, 0.6),
    { tone: "mid", lit }
  );
}
function fasteners(x: number, y: number, w: number, d: number, z: number) {
  return D(
    k
      .corners({ x, y, w, d, r: 0 }, Math.min(4, w / 3, d / 3))
      .map(([x, y]) => at([x, y, z])),
    { size: 1.1, tone: "hi" }
  );
}
function vent(x: number, y: number, z: number, count: number, length = 15) {
  // Closed slots have no floating line ends.
  return Array.from({ length: count }, (_, i) =>
    L(k.planOutline({ x: x + i * 5, y, w: 2, d: length, r: 1 }, z, P), {
      tone: "lo",
    })
  ).join("");
}
function label(x: number, y: number, z: number) {
  return (
    block(x, y, 28, 9, z, 0.6) +
    Array.from({ length: 3 }, (_, i) =>
      L(
        k.lineOnTop(
          [x + 4, y + 2 + i * 2],
          [x + 21, y + 2 + i * 2],
          z + 0.7,
          P
        ),
        { tone: "lo", free: true }
      )
    ).join("")
  );
}

function base() {
  return [
    `<path class="iso-halo" d="${k.haloOf(plate, -22, 14, P)}"/>`,
    ...k
      .corners(plate, 24)
      .sort(
        (a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P)
      )
      .flatMap(([x, y]) => [
        block(x - 7, y - 7, 14, 14, -22, 4),
        block(x - 5, y - 5, 10, 10, -18, 8),
      ]),
    S(k.slabOf(plate, -10, 10, P, 8, 1.3), { tone: "mid" }),
    L(k.planOutline(k.insetPlan(plate, 6), 0.1, P), { tone: "faint" }),
    fasteners(plate.x, plate.y, plate.w, plate.d, 0.1),
    // Recessed bus rail physically joins the three mounted instruments.
    block(-157, 66, 312, 9, 0, 3),
    ...[-119, -10, 99].map((x) => block(x, 50, 10, 16, 0, 3)),
    ...[-150, -122, -94, -66, -38, -10, 18, 46, 74, 102, 130].map(
      (x, index) =>
        `<g class="bus-contact" style="--contact-index:${index}">${block(x, 69, 9, 3, 3, 1)}</g>`
    ),
    label(121, 78, 0.1),
  ].join("");
}

function toolPress() {
  const x = -154;
  return [
    block(x, -40, 90, 94, 0, 6),
    fasteners(x, -40, 90, 94, 6),
    block(x + 7, -29, 8, 58, 6, 5),
    block(x + 75, -29, 8, 58, 6, 5),
    block(x + 10, -32, 11, 13, 6, 89),
    block(x + 70, -32, 11, 13, 6, 89),
    ...[0, 1, 2, 3, 4, 5].map((i) => block(x + 12, -29, 7, 2, 20 + i * 11, 1)),
    block(x + 26, -17, 38, 41, 11, 5),
    `<g class="tool-input">${block(x + 32, -9, 26, 25, 16, 3, true)}</g>`,
    // The sliding square ram stays inside its fixed sleeve for the whole stroke.
    // Paint the sleeve and bridge last so they occlude the rod's inserted end.
    `<g class="tool-ram">${block(x + 42, -27, 6, 6, 57, 43)}${block(x + 25, -24, 40, 37, 48, 9)}${fasteners(x + 25, -24, 40, 37, 57)}${block(x + 33, -17, 24, 24, 41, 7, true)}</g>`,
    block(x + 39, -29, 12, 10, 70, 25),
    block(x + 7, -35, 77, 20, 95, 11),
    fasteners(x + 7, -35, 77, 20, 106),
    block(x + 29, -33, 33, 16, 106, 17),
    vent(x + 33, -31, 123, 5, 12),
    block(x + 8, 34, 28, 12, 6, 4),
    label(x + 45, 34, 6),
    ...[0, 1, 2].map((i) => block(x + 12 + i * 8, 38, 4, 4, 10, 2, i === 0)),
  ].join("");
}

function resourceCabinet() {
  const x = -48;
  return [
    block(x, -40, 88, 94, 0, 6),
    fasteners(x, -40, 88, 94, 6),
    block(x + 8, -30, 72, 5, 6, 84),
    block(x + 5, -30, 5, 64, 6, 84),
    // Open side exposes the cards; the front post occludes drawers below.
    block(x + 78, -30, 5, 6, 6, 84),
    ...[0, 1, 2].map((i) => {
      const z = 8 + i * 26;
      const drawer = [
        block(x + 11, -23, 65, 52, z, 4),
        ...[0, 1, 2, 3, 4].map((j) =>
          block(x + 16, -17 + j * 8, 54, 3, z + 4, 15)
        ),
        block(x + 10, 29, 67, 4, z, 22),
        block(x + 31, 33, 26, 4, z + 8, 5),
        fasteners(x + 10, 29, 67, 4, z + 22),
      ].join("");
      return `<g class="resource-drawer resource-drawer-${i}">${drawer}</g>`;
    }),
    block(x + 78, 28, 5, 6, 6, 84),
    block(x + 5, -30, 78, 64, 90, 5),
    vent(x + 12, -24, 95, 12),
    label(x + 45, 38, 6),
  ].join("");
}

function promptPrinter() {
  const x = 59;
  return [
    block(x, -40, 90, 94, 0, 6),
    fasteners(x, -40, 90, 94, 6),
    block(x + 8, -33, 74, 53, 6, 32),
    block(x + 8, -33, 74, 5, 38, 39),
    block(x + 8, -28, 5, 48, 38, 30),
    block(x + 77, -28, 5, 48, 38, 30),
    block(x + 13, -28, 64, 7, 61, 7),
    ...[0, 1, 2, 3, 4].map((i) => block(x + 20, -19 + i * 6, 50, 3, 39, 13)),
    block(x + 8, -33, 74, 53, 68, 5),
    vent(x + 20, -29, 73, 10),
    label(x + 43, 39, 6),
    block(x + 13, 38, 14, 10, 6, 3, true),
    block(x + 13, 20, 64, 25, 21, 3),
    `<g class="prompt-paper">${block(x + 19, 20, 52, 29, 24, 1, true)}${Array.from({ length: 5 }, (_, i) => L(k.lineOnTop([x + 25, 24 + i * 4], [x + 61 - (i % 2) * 10, 24 + i * 4], 25.1, P), { tone: "mid", free: true })).join("")}</g>`,
    block(x + 8, 15, 74, 5, 38, 24),
    block(x + 23, 20, 44, 2, 39, 2),
  ].join("");
}

export const workbenchArt = {
  base: base(),
  tools: toolPress(),
  resources: resourceCabinet(),
  prompts: promptPrinter(),
};

// Project movement from world units so the parts remain on their physical axes.
const origin = at([0, 0, 0]);
const pressEnd = at([0, 0, -22]);
const drawerEnd = at([0, 26, 0]);
const paperEnd = at([0, 19, 0]);
export const workbenchMotion = {
  "--wb-press-offset": `${pressEnd[1] - origin[1]}px`,
  "--wb-drawer-x": `${drawerEnd[0] - origin[0]}px`,
  "--wb-drawer-y": `${drawerEnd[1] - origin[1]}px`,
  "--wb-paper-x": `${paperEnd[0] - origin[0]}px`,
  "--wb-paper-y": `${paperEnd[1] - origin[1]}px`,
};
