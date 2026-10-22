const { readFile, unlink } = require("node:fs/promises");
const { createRequire } = require("node:module");
const path = require("node:path");

// Reuse the parser shipped with our installed Changesets CLI.
const changesetsRequire = createRequire(
  require.resolve("@changesets/cli/package.json")
);
const readChangesets = changesetsRequire("@changesets/read").default;

async function prepareStableRelease(cwd) {
  const config = JSON.parse(
    await readFile(path.join(cwd, ".changeset/config.json"), "utf8")
  );
  const ignored = new Set(config.ignore ?? []);
  const changesets = await readChangesets(cwd);

  for (const changeset of changesets) {
    if (
      changeset.releases.length > 0 &&
      changeset.releases.every((release) => ignored.has(release.name))
    ) {
      // changesets/action counts ignored packages when deciding whether to
      // publish. Hide only their changesets in this disposable CI checkout;
      // keep them in git for their separate release workflow.
      await unlink(path.join(cwd, ".changeset", `${changeset.id}.md`));
    }
  }
}

module.exports = { prepareStableRelease };

if (require.main === module) {
  prepareStableRelease(process.cwd()).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
