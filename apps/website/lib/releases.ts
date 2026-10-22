import { readFileSync } from "node:fs";
import path from "node:path";

export interface Release {
  version: string;
  publishedAt: string;
  body: string;
  url: string;
}

export function getReleases(): Release[] {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), ".generated/releases.json"), "utf8")
  );
}

export function releaseAnchor(version: string): string {
  return `v${version}`;
}

export function formatReleaseDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}
