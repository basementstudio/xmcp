import { afterEach, beforeEach, expect, test } from "vitest";

import { isTelemetryDebugEnabled } from "@/telemetry/debug";

const ENV_KEY = "XMCP_DEBUG_TELEMETRY";

let originalValue: string | undefined;

beforeEach(() => {
  originalValue = process.env[ENV_KEY];
  delete process.env[ENV_KEY];
});

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = originalValue;
  }
});

test("returns false when env is unset", () => {
  expect(isTelemetryDebugEnabled()).toBe(false);
});

test("returns true for `true` (lowercase)", () => {
  process.env[ENV_KEY] = "true";
  expect(isTelemetryDebugEnabled()).toBe(true);
});

test("returns true for `TRUE` (uppercase) — case-insensitive", () => {
  process.env[ENV_KEY] = "TRUE";
  expect(isTelemetryDebugEnabled()).toBe(true);
});

test("returns false for `1`, `yes`, or other truthy-but-non-`true` values", () => {
  for (const v of ["1", "yes", "on", "y"]) {
    process.env[ENV_KEY] = v;
    expect(
      isTelemetryDebugEnabled(),
      `value=${v} should not enable debug`
    ).toBe(false);
  }
});

test("returns false for empty string", () => {
  process.env[ENV_KEY] = "";
  expect(isTelemetryDebugEnabled()).toBe(false);
});
