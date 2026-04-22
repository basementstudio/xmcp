// Chosen so the full live status line — bar + counters + rule id + elapsed —
// fits comfortably inside an 80-column terminal with room for padding.
export const PROGRESS_BAR_WIDTH = 24;

const FILLED = "▓";
const EMPTY = "░";

export function renderBar(
  done: number,
  total: number,
  width: number = PROGRESS_BAR_WIDTH
): string {
  if (width <= 0) return "";
  if (total <= 0) return EMPTY.repeat(width);
  const clamped = Math.max(0, Math.min(done, total));
  const filledCells = Math.round((clamped / total) * width);
  return FILLED.repeat(filledCells) + EMPTY.repeat(width - filledCells);
}
