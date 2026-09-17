import assert from "node:assert/strict";
import { test } from "node:test";
import { BASE_CAPABILITIES, getTargetCapabilities } from "../target.js";
import type { FixtureKind } from "../fixture.js";
import type { ProtocolMode } from "../client-options.js";

test("preserves default capabilities for every transport and protocol mode", () => {
  for (const kind of [
    "http",
    "stdio",
    "express",
    "fastify",
    "nestjs",
    "nextjs",
  ] satisfies FixtureKind[]) {
    for (const mode of ["auto", "legacy"] satisfies ProtocolMode[]) {
      const { capabilities, unsupportedReasons } = getTargetCapabilities(
        { kind },
        mode
      );
      const expected = new Set<string>(BASE_CAPABILITIES);
      if (kind !== "stdio") expected.add("stateless-http");
      if (kind !== "stdio" && mode === "legacy") {
        expected.delete("input-required");
        assert.match(
          unsupportedReasons?.["input-required"] ?? "",
          /Stateless legacy HTTP/
        );
      }
      assert.deepEqual(capabilities, expected, `${kind}/${mode}`);
    }
  }
});

test("uses explicit fixture capabilities, including an empty list", () => {
  for (const kind of ["http", "stdio"] satisfies FixtureKind[]) {
    assert.deepEqual(
      getTargetCapabilities({ kind, capabilities: ["tools"] }, "auto")
        .capabilities,
      new Set(["tools"])
    );
    assert.deepEqual(
      getTargetCapabilities({ kind, capabilities: [] }, "auto").capabilities,
      new Set()
    );
  }
});

test("fixture declarations cannot enable capabilities unsupported by the transport", () => {
  const capabilities = ["tools", "input-required", "stateless-http"] as const;
  assert.deepEqual(
    getTargetCapabilities({ kind: "stdio", capabilities }, "auto").capabilities,
    new Set(["tools", "input-required"])
  );
  const legacy = getTargetCapabilities(
    { kind: "express", capabilities },
    "legacy"
  );
  assert.deepEqual(legacy.capabilities, new Set(["tools", "stateless-http"]));
  assert.equal(
    legacy.unsupportedReasons?.["input-required"],
    "Stateless legacy HTTP cannot receive server-to-client input requests"
  );
  assert.deepEqual(capabilities, ["tools", "input-required", "stateless-http"]);
});
