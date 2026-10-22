import { readFile, writeFile } from "node:fs/promises";

const id = process.argv[2];
if (!id || !/^\d+$/.test(id))
  throw new Error(
    "Pass the numeric ID from a Figma development plugin's generated manifest."
  );
const manifest = JSON.parse(
  await readFile(new URL("manifest.json", import.meta.url), "utf8")
);
await writeFile(
  new URL("manifest.local.json", import.meta.url),
  JSON.stringify({ ...manifest, id }, null, 2) + "\n"
);
