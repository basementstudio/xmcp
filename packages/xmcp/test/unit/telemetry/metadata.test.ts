import { expect, test } from "vitest";

import { getAnonymousMeta } from "@/telemetry/metadata";

test("getAnonymousMeta returns the documented shape", () => {
  const meta = getAnonymousMeta();

  expect(typeof meta.platform).toBe("string");
  expect(typeof meta.systemRelease).toBe("string");
  expect(typeof meta.arch).toBe("string");
  expect(typeof meta.cpuCores).toBe("number");
  // cpuModel/cpuSpeed can be null on systems without `os.cpus()` data.
  expect(meta.cpuModel === null || typeof meta.cpuModel === "string").toBe(
    true
  );
  expect(meta.cpuSpeed === null || typeof meta.cpuSpeed === "number").toBe(
    true
  );
  expect(typeof meta.memoryTotal).toBe("number");
  expect(typeof meta.isDocker).toBe("boolean");
  expect(typeof meta.isWsl).toBe("boolean");
  expect(typeof meta.isCI).toBe("boolean");
  expect(meta.ciName === null || typeof meta.ciName === "string").toBe(true);
});

test("memoryTotal is reported in MB (not bytes)", () => {
  // Reasonable upper bound: 1TB. If the value is in bytes it's > 1TB
  // for any modern machine, so this asserts the unit conversion ran.
  const meta = getAnonymousMeta();
  expect(meta.memoryTotal).toBeLessThan(1_000_000);
});

test("repeated calls return the cached object (no re-probe)", () => {
  const a = getAnonymousMeta();
  const b = getAnonymousMeta();
  expect(b).toBe(a);
});
