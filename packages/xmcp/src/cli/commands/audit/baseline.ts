import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Finding } from "./types";

const SCHEMA_VERSION = "1";
const LINE_NUMBERS_IN_MESSAGE = /:\d+\b/g;

export interface BaselineEntry {
  ruleId: string;
  file: string;
  fingerprint: string;
}

export interface BaselineFile {
  schemaVersion: string;
  toolVersion: string;
  generatedAt: string;
  entries: BaselineEntry[];
}

export const DEFAULT_BASELINE_PATH = ".xmcp-audit-baseline.json";

export function fingerprintFinding(
  finding: Finding,
  projectRoot: string
): string {
  const normalizedFile = toPosix(path.relative(projectRoot, finding.file));
  const normalizedMessage = finding.message.replace(
    LINE_NUMBERS_IN_MESSAGE,
    ""
  );
  const input = `${finding.ruleId}|${normalizedFile}|${normalizedMessage}`;
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 16);
}

export function loadBaseline(filePath: string): BaselineFile | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!raw || typeof raw !== "object") return null;
    if (!Array.isArray(raw.entries)) return null;
    return raw as BaselineFile;
  } catch {
    return null;
  }
}

export function writeBaseline(
  filePath: string,
  findings: Finding[],
  projectRoot: string,
  toolVersion: string
): void {
  const entries: BaselineEntry[] = findings.map((f) => ({
    ruleId: f.ruleId,
    file: toPosix(path.relative(projectRoot, f.file)),
    fingerprint: fingerprintFinding(f, projectRoot),
  }));
  const payload: BaselineFile = {
    schemaVersion: SCHEMA_VERSION,
    toolVersion,
    generatedAt: new Date().toISOString(),
    entries,
  };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n");
}

export function partitionByBaseline(
  findings: Finding[],
  baseline: BaselineFile,
  projectRoot: string
): { fresh: Finding[]; baselined: Finding[] } {
  const known = new Set(baseline.entries.map((e) => e.fingerprint));
  const fresh: Finding[] = [];
  const baselined: Finding[] = [];
  for (const f of findings) {
    if (known.has(fingerprintFinding(f, projectRoot))) {
      baselined.push(f);
    } else {
      fresh.push(f);
    }
  }
  return { fresh, baselined };
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}
