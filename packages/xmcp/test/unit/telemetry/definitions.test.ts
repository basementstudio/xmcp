import { describe, expect, test } from "vitest";

import {
  AdapterType,
  ErrorPhase,
  TelemetryEventName,
  TransportType,
} from "@/telemetry/events/definitions";

// Pin enum string values. These ship in telemetry payloads, so a rename
// (e.g. `BUILD_COMPLETED` value flipped from "build:completed" to
// "build_completed") would silently break aggregations downstream — no
// runtime error, no compile error, just a quiet schema drift.

describe("TelemetryEventName", () => {
  test("BUILD_COMPLETED is namespaced with `:`", () => {
    expect(TelemetryEventName.BUILD_COMPLETED).toBe("build:completed");
  });

  test("BUILD_FAILED is namespaced with `:`", () => {
    expect(TelemetryEventName.BUILD_FAILED).toBe("build:failed");
  });
});

describe("TransportType", () => {
  test("HTTP and STDIO match the runtime literals", () => {
    expect(TransportType.HTTP).toBe("http");
    expect(TransportType.STDIO).toBe("stdio");
  });
});

describe("ErrorPhase", () => {
  test("covers the four build pipeline stages", () => {
    expect(ErrorPhase.CONFIG).toBe("config");
    expect(ErrorPhase.COMPILE).toBe("compile");
    expect(ErrorPhase.WEBPACK).toBe("webpack");
    expect(ErrorPhase.TRANSPILE).toBe("transpile");
  });
});

describe("AdapterType", () => {
  test("includes the supported adapter values", () => {
    expect(AdapterType.NONE).toBe("none");
    expect(AdapterType.EXPRESS).toBe("express");
    expect(AdapterType.NEXTJS).toBe("nextjs");
  });
});
