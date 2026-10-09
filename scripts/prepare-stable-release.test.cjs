const assert = require("node:assert/strict");
const { mkdtemp, mkdir, writeFile, readdir, rm } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { prepareStableRelease } = require("./prepare-stable-release.cjs");

async function fixture(t, changesets, ignore = ["@xmcp-dev/cli"]) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "xmcp-stable-release-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const directory = path.join(cwd, ".changeset");
  await mkdir(directory);
  await writeFile(
    path.join(directory, "config.json"),
    JSON.stringify({ ignore })
  );
  for (const [name, releases] of Object.entries(changesets)) {
    const frontmatter = Object.entries(releases)
      .map(([pkg, type]) => `${JSON.stringify(pkg)}: ${type}`)
      .join("\n");
    await writeFile(
      path.join(directory, `${name}.md`),
      `---\n${frontmatter}\n---\n\nRelease notes.\n`
    );
  }
  return { cwd, directory };
}

test("ignored-only changesets do not block stable publishing", async (t) => {
  const { cwd, directory } = await fixture(t, {
    cli: { "@xmcp-dev/cli": "minor" },
  });
  await prepareStableRelease(cwd);
  assert.deepEqual(await readdir(directory), ["config.json"]);
});

test("preserves stable, mixed, and empty changesets", async (t) => {
  const { cwd, directory } = await fixture(t, {
    cli: { "@xmcp-dev/cli": "minor" },
    core: { xmcp: "minor" },
    mixed: { "@xmcp-dev/cli": "patch", xmcp: "patch" },
    empty: {},
  });
  await prepareStableRelease(cwd);
  assert.deepEqual((await readdir(directory)).sort(), [
    "config.json",
    "core.md",
    "empty.md",
    "mixed.md",
  ]);
});

test("keeps changesets when no packages are ignored", async (t) => {
  const { cwd, directory } = await fixture(t, { core: { xmcp: "patch" } }, []);
  await prepareStableRelease(cwd);
  assert.deepEqual((await readdir(directory)).sort(), [
    "config.json",
    "core.md",
  ]);
});
