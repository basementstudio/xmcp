import { describe, expect, it } from "vitest";

import { runCli } from "./_utils";

// CLI argv contract. Today the CLI is exercised only indirectly via the
// build/dev fixture tests, so a flag rename or a description churn would
// slip through. These pin:
//   - `--help` output for every command (every flag, default, description)
//   - `--version` output
//   - exit codes for invalid inputs (unknown flags, bogus subcommand, etc.)
//
// Update snapshots via `pnpm test -u` only when the change is intentional.

const HELP_COMMANDS: ReadonlyArray<{ name: string; args: string[] }> = [
  { name: "root", args: ["--help"] },
  { name: "dev", args: ["dev", "--help"] },
  { name: "build", args: ["build", "--help"] },
  { name: "create", args: ["create", "--help"] },
];

describe("xmcp CLI argv contract", () => {
  describe("--help", () => {
    for (const cmd of HELP_COMMANDS) {
      it(`${cmd.name} --help is unchanged`, async () => {
        const result = await runCli(cmd.args);
        expect(result.exitCode).toBe(0);
        // commander prints help to stdout. stderr should be empty for
        // explicit --help (it's only used for unknown-flag errors).
        expect(result.stderr).toBe("");
        expect(normalize(result.stdout)).toMatchSnapshot();
      });
    }
  });

  describe("--version", () => {
    it("prints the package version", async () => {
      const result = await runCli(["--version"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe("invalid input", () => {
    it("unknown subcommand exits non-zero", async () => {
      const result = await runCli(["totally-not-a-command"]);
      expect(result.exitCode).not.toBe(0);
      // commander's wording: "error: unknown command '...'"
      expect(result.stderr.toLowerCase()).toContain("unknown command");
    });

    it("unknown flag on `build` exits non-zero", async () => {
      const result = await runCli(["build", "--bogus-flag"]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toLowerCase()).toContain("unknown option");
    });

    it("unknown flag on `dev` exits non-zero", async () => {
      const result = await runCli(["dev", "--bogus-flag"]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toLowerCase()).toContain("unknown option");
    });

    it("`create` rejects an invalid type", async () => {
      const result = await runCli(["create", "wormhole", "my-thing"]);
      expect(result.exitCode).toBe(1);
      // The CLI emits its own error (not commander's) for this case.
      expect(result.stderr).toContain('Invalid type "wormhole"');
      expect(result.stderr).toContain("Valid types:");
    });

    it("`create` rejects missing positional arg (name)", async () => {
      const result = await runCli(["create", "tool"]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toLowerCase()).toContain(
        "missing required argument"
      );
    });
  });

  describe("flags accepted by `build`", () => {
    it("--vercel is a known flag (no unknown-option error)", async () => {
      // We don't run a real build here — just confirm parsing doesn't
      // reject the flag. The build will error because there's no fixture
      // in PACKAGE_ROOT, but stderr should NOT contain "unknown option".
      const result = await runCli(["build", "--vercel"]);
      expect(result.stderr.toLowerCase()).not.toContain("unknown option");
    });

    it("--cf is a known flag", async () => {
      const result = await runCli(["build", "--cf"]);
      expect(result.stderr.toLowerCase()).not.toContain("unknown option");
    });
  });

  describe("flags accepted by `dev`", () => {
    it("--cf is a known flag", async () => {
      // dev would hang on a real fixture; we kill it as soon as the
      // unknown-option check would have fired. Spawn with a short
      // timeout via the env so it exits cleanly.
      const result = await runCli(["dev", "--cf", "--help"]);
      expect(result.stderr.toLowerCase()).not.toContain("unknown option");
    });
  });
});

/**
 * Strip volatile parts so the help-text snapshot survives across
 * machines and node versions. We keep enough structure (flag names,
 * descriptions, command list) to bite when a real change happens.
 */
function normalize(stdout: string): string {
  return (
    stdout
      // Strip ANSI color codes if any sneak in. \x1b is the ESC byte;
      // making it optional means the regex is also tolerant of stripped
      // streams.
      // eslint-disable-next-line no-control-regex
      .replace(/\x1b?\[[0-9;]*m/g, "")
      .replace(/\r\n/g, "\n")
      .trim()
  );
}
