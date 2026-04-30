import fs from "node:fs/promises";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import { buildAt, stageFixture } from "./_utils";

// Pin the format of build messages for malformed inputs. DX gates
// regress silently — a refactor that swallows file paths or strips a
// hint won't break any other test, but a user opening the failed build
// will see a worse message tomorrow than they did yesterday.
//
// These tests stage `basic-tools` into a tempdir, mutate one file, run
// `xmcp build`, and snapshot the (normalized) output. Update via
// `pnpm test -u` when the change is intentional.
//
// Note: not every malformed input fails the build today. Cases marked
// `behaviour: "exits-zero"` are pinned as "this currently slips through"
// — useful as a regression detector if xmcp adds validation later.

interface ErrorCase {
  name: string;
  /** Mutate the staged fixture to provoke the message. */
  setup(dir: string): Promise<void>;
  /** Whether xmcp build is expected to exit non-zero today. */
  behaviour: "fails" | "exits-zero";
}

const CASES: ErrorCase[] = [
  {
    name: "tool file with no default export",
    behaviour: "exits-zero",
    async setup(dir) {
      const tool = path.join(dir, "src", "tools", "echo.ts");
      await fs.writeFile(
        tool,
        `import { z } from "zod";
import { type ToolMetadata } from "xmcp";

export const schema = { message: z.string() };
export const metadata: ToolMetadata = {
  name: "echo",
  description: "missing default export — handler not implemented",
};
// no default export
`,
        "utf8"
      );
    },
  },
  {
    name: "tool schema is not a Zod object",
    behaviour: "exits-zero",
    async setup(dir) {
      const tool = path.join(dir, "src", "tools", "echo.ts");
      await fs.writeFile(
        tool,
        `import { type ToolMetadata } from "xmcp";

// Schema is a plain string instead of a Record<string, ZodType>.
export const schema = "this is not a schema" as never;
export const metadata: ToolMetadata = {
  name: "echo",
  description: "broken schema export",
};

export default function echo() {
  return "noop";
}
`,
        "utf8"
      );
    },
  },
  {
    name: "tools directory does not exist",
    behaviour: "fails",
    async setup(dir) {
      // Wipe the entire tools tree but leave xmcp.config.ts pointing at
      // it. Build must surface a "path does not exist" message.
      await fs.rm(path.join(dir, "src", "tools"), {
        recursive: true,
        force: true,
      });
    },
  },
  {
    name: "tools path resolves to a file, not a directory",
    // Today: xmcp doesn't validate path-is-directory and the build silently
    // succeeds. Pinned as "exits-zero" so we notice if validation lands.
    behaviour: "exits-zero",
    async setup(dir) {
      await fs.rm(path.join(dir, "src", "tools"), {
        recursive: true,
        force: true,
      });
      // Create a file at the path the loader expects to be a directory.
      await fs.writeFile(
        path.join(dir, "src", "tools"),
        "// not a directory",
        "utf8"
      );
    },
  },
];

const stagedDirs: string[] = [];

afterAll(async () => {
  for (const dir of stagedDirs) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

describe("xmcp build messages for malformed inputs", () => {
  for (const errorCase of CASES) {
    it(`${errorCase.name} (${errorCase.behaviour})`, async () => {
      const dir = await stageFixture("basic-tools");
      stagedDirs.push(dir);
      await errorCase.setup(dir);

      const result = await buildAt(dir);

      // Validate the documented behaviour matches reality. If a previously
      // exits-zero case starts failing (or vice versa), the test surfaces
      // it before the message snapshot diff distracts from it.
      const exitedZero = result.exitCode === 0;
      const expected = errorCase.behaviour === "exits-zero";
      expect(
        exitedZero,
        `${errorCase.name}: behaviour="${errorCase.behaviour}" but exitCode=${result.exitCode}\nstdout:\n${result.stdoutChunks.join("")}\nstderr:\n${result.stderrChunks.join("")}`
      ).toBe(expected);

      const combined =
        result.stdoutChunks.join("") + result.stderrChunks.join("");
      expect(normalize(combined, dir)).toMatchSnapshot();
    });
  }
});

/**
 * Strip everything that varies between machines / runs so the snapshot
 * survives across CI, local dev, and time. We keep enough structure to
 * still bite when a real format change happens (file basenames, message
 * wording, "for tools does not exist" framing).
 */
function normalize(output: string, stagingDir: string): string {
  // /private prefix on macOS — strip BEFORE the staging-dir replacement
  // so /private/var/folders/.../staged → /var/folders/.../staged →
  // <staging>.
  const realStagingDir = stagingDir.replace(/^\/private\//, "/");
  return (
    output
      // Strip ANSI color codes.
      // eslint-disable-next-line no-control-regex
      .replace(/?\[[0-9;]*m/g, "")
      .replace(/\/private(\/var\/folders\/)/g, "$1")
      .replace(new RegExp(escapeRegExp(stagingDir), "g"), "<staging>")
      .replace(new RegExp(escapeRegExp(realStagingDir), "g"), "<staging>")
      // Strip wall-clock build durations ("Compiled in 123ms").
      .replace(/in \d+(?:\.\d+)?ms/g, "in <ms>ms")
      // Strip absolute paths anywhere else (e.g. node_modules, tmp).
      .replace(/\/[^\s'"`]+\/node_modules\//g, "<nm>/")
      .replace(/\/var\/folders\/[^\s'"`]+/g, "<tmp>")
      .replace(/\/tmp\/[^\s'"`]+/g, "<tmp>")
      .replace(/\r\n/g, "\n")
      .trim()
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
