import ts from "typescript";
import fs from "node:fs";
import type { ParsedFile } from "../types";

const sourceFileCache = new Map<string, ParsedFile>();

export function parseFile(absolutePath: string): ParsedFile {
  const cached = sourceFileCache.get(absolutePath);
  if (cached) return cached;

  const source = fs.readFileSync(absolutePath, "utf8");
  const sourceFile = ts.createSourceFile(
    absolutePath,
    source,
    ts.ScriptTarget.Latest,
    /*setParentNodes*/ true,
    ts.ScriptKind.TS
  );

  const parsed: ParsedFile = { absolutePath, source, sourceFile };
  sourceFileCache.set(absolutePath, parsed);
  return parsed;
}

export function clearParseCache(): void {
  sourceFileCache.clear();
}

export function getLineColumn(
  sourceFile: ts.SourceFile,
  pos: number
): { line: number; column: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
  return { line: line + 1, column: character + 1 };
}
