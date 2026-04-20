import ts from "typescript";
import { getConfigObject, getConfigProperty } from "./ast/config-parser";
import { getPropertyName, getStringLiteralValue } from "./ast/visit";
import {
  SEVERITY_ORDER,
  type AuditConfig,
  type AuditIgnoreEntry,
  type AuditSeverityOverride,
  type ParsedFile,
  type Severity,
} from "./types";

export function emptyAuditConfig(): AuditConfig {
  return { ignore: [], severity: {}, failOn: null };
}

interface JsonAuditShape {
  ignore?: unknown;
  severity?: unknown;
  failOn?: unknown;
}

export function loadAuditConfig(
  xmcpConfigFile: ParsedFile | null,
  jsonConfig: { audit?: JsonAuditShape } | null
): AuditConfig {
  const fromTs = xmcpConfigFile ? parseTsAuditBlock(xmcpConfigFile) : null;
  if (fromTs) return fromTs;
  const fromJson = jsonConfig?.audit
    ? parseJsonAuditBlock(jsonConfig.audit)
    : null;
  return fromJson ?? emptyAuditConfig();
}

function parseTsAuditBlock(configFile: ParsedFile): AuditConfig | null {
  const info = getConfigObject(configFile);
  if (!info) return null;
  const auditProp = getConfigProperty(info, "audit");
  if (!auditProp) return null;
  if (!ts.isObjectLiteralExpression(auditProp.initializer)) return null;

  const out: AuditConfig = emptyAuditConfig();
  for (const prop of auditProp.initializer.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = getPropertyName(prop);
    if (key === "ignore") {
      out.ignore = parseIgnoreArray(prop.initializer);
    } else if (key === "severity") {
      out.severity = parseSeverityMap(prop.initializer);
    } else if (key === "failOn") {
      const value = getStringLiteralValue(prop.initializer);
      if (value && isSeverity(value)) out.failOn = value;
    }
  }
  return out;
}

function parseIgnoreArray(node: ts.Node): AuditIgnoreEntry[] {
  if (!ts.isArrayLiteralExpression(node)) return [];
  const entries: AuditIgnoreEntry[] = [];
  for (const element of node.elements) {
    const str = getStringLiteralValue(element);
    if (str) {
      entries.push(str);
      continue;
    }
    if (!ts.isObjectLiteralExpression(element)) continue;
    let rule: string | null = null;
    const paths: string[] = [];
    for (const prop of element.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = getPropertyName(prop);
      if (key === "rule") {
        rule = getStringLiteralValue(prop.initializer);
      } else if (
        key === "paths" &&
        ts.isArrayLiteralExpression(prop.initializer)
      ) {
        for (const p of prop.initializer.elements) {
          const s = getStringLiteralValue(p);
          if (s) paths.push(s);
        }
      }
    }
    if (rule && paths.length > 0) entries.push({ rule, paths });
  }
  return entries;
}

function parseSeverityMap(
  node: ts.Node
): Record<string, AuditSeverityOverride> {
  if (!ts.isObjectLiteralExpression(node)) return {};
  const map: Record<string, AuditSeverityOverride> = {};
  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = getPropertyName(prop);
    if (!key) continue;
    const value = getStringLiteralValue(prop.initializer);
    if (value && isSeverityOverride(value)) {
      map[key] = value;
    }
  }
  return map;
}

function parseJsonAuditBlock(raw: JsonAuditShape): AuditConfig {
  const out = emptyAuditConfig();
  if (Array.isArray(raw.ignore)) {
    for (const entry of raw.ignore) {
      if (typeof entry === "string") {
        out.ignore.push(entry);
        continue;
      }
      if (
        entry &&
        typeof entry === "object" &&
        typeof (entry as { rule?: unknown }).rule === "string" &&
        Array.isArray((entry as { paths?: unknown }).paths)
      ) {
        const paths = (entry as { paths: unknown[] }).paths.filter(
          (p): p is string => typeof p === "string"
        );
        if (paths.length > 0) {
          out.ignore.push({ rule: (entry as { rule: string }).rule, paths });
        }
      }
    }
  }
  if (raw.severity && typeof raw.severity === "object") {
    for (const [ruleId, value] of Object.entries(raw.severity)) {
      if (typeof value === "string" && isSeverityOverride(value)) {
        out.severity[ruleId] = value;
      }
    }
  }
  if (typeof raw.failOn === "string" && isSeverity(raw.failOn)) {
    out.failOn = raw.failOn;
  }
  return out;
}

function isSeverity(value: string): value is Severity {
  return value in SEVERITY_ORDER;
}

function isSeverityOverride(value: string): value is AuditSeverityOverride {
  return value === "off" || isSeverity(value);
}

export function matchesGlob(pattern: string, relativePath: string): boolean {
  const regex = globToRegExp(pattern);
  return regex.test(relativePath);
}

function globToRegExp(pattern: string): RegExp {
  let out = "^";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "*" && pattern[i + 1] === "*") {
      const after = pattern[i + 2];
      if (after === "/") {
        out += "(?:.*/)?";
        i += 2;
      } else {
        out += ".*";
        i += 1;
      }
    } else if (ch === "*") {
      out += "[^/]*";
    } else if (ch === "?") {
      out += "[^/]";
    } else if (/[.+^${}()|[\]\\]/.test(ch)) {
      out += "\\" + ch;
    } else {
      out += ch;
    }
  }
  out += "$";
  return new RegExp(out);
}
