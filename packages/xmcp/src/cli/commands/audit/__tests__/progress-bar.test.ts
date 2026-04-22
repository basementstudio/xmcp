import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PROGRESS_BAR_WIDTH, renderBar } from "../reporters/progress-bar";

describe("renderBar", () => {
  it("returns an empty bar when no work is done", () => {
    const bar = renderBar(0, 10);
    assert.equal(bar.length, PROGRESS_BAR_WIDTH);
    assert.ok(bar.includes("░"));
    assert.ok(!bar.includes("▓"));
  });

  it("returns a full bar when work is complete", () => {
    const bar = renderBar(10, 10);
    assert.equal(bar.length, PROGRESS_BAR_WIDTH);
    assert.ok(!bar.includes("░"));
    assert.ok(bar.includes("▓"));
  });

  it("is proportional at the halfway point", () => {
    const bar = renderBar(50, 100);
    const filled = [...bar].filter((c) => c === "▓").length;
    const empty = [...bar].filter((c) => c === "░").length;
    assert.equal(filled + empty, PROGRESS_BAR_WIDTH);
    // Allow off-by-one from rounding.
    assert.ok(Math.abs(filled - empty) <= 1);
  });

  it("clamps overfilled bars to full", () => {
    const bar = renderBar(99, 10);
    assert.equal([...bar].filter((c) => c === "▓").length, PROGRESS_BAR_WIDTH);
  });

  it("returns all empty when total is 0", () => {
    const bar = renderBar(0, 0);
    assert.equal(bar.length, PROGRESS_BAR_WIDTH);
    assert.ok(!bar.includes("▓"));
  });

  it("honors a custom width", () => {
    const bar = renderBar(5, 10, 8);
    assert.equal(bar.length, 8);
    assert.equal([...bar].filter((c) => c === "▓").length, 4);
  });

  it("returns empty string for width <= 0", () => {
    assert.equal(renderBar(5, 10, 0), "");
    assert.equal(renderBar(5, 10, -1), "");
  });
});
