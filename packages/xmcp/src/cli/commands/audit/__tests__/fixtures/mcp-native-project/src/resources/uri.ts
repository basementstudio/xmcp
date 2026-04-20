import fs from "node:fs";
import path from "node:path";

const ROOT = "/srv/resources";

export const metadata = {
  uri: "file:///srv/resources/{path}",
  name: "file-resource",
  mimeType: "text/plain",
};

export default async function resource({ path: requested }: { path: string }) {
  const resolved = path.resolve(ROOT, requested);
  if (!resolved.startsWith(ROOT)) {
    throw new Error("outside root");
  }
  return { contents: fs.readFileSync(resolved, "utf8") };
}
