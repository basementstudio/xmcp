import path from "node:path";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";

// Full-surface snapshot of every exported symbol from the four public
// entries declared in package.json#exports. The type tests in test/types/
// pin specific fields; this test pins the surface — every addition,
// removal, or signature change shows up as a snapshot diff. Update via
// `pnpm test -u` only when the change is intentional.

const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");

// Mirrors packages/xmcp/package.json#exports. Keep in sync if a new entry
// is added.
const PUBLIC_ENTRIES: ReadonlyArray<{ entry: string; file: string }> = [
  { entry: ".", file: "src/index.ts" },
  { entry: "./cloudflare", file: "src/cloudflare.ts" },
  { entry: "./host-bridge", file: "src/host-bridge.ts" },
  { entry: "./headers", file: "src/runtime/headers.ts" },
];

interface ExportRecord {
  name: string;
  kind: "type" | "value";
  signature: string;
}

function loadProgram(): ts.Program {
  const tsconfigPath = path.join(PACKAGE_ROOT, "xmcp.tsconfig.json");
  const parsed = ts.parseConfigFileTextToJson(
    tsconfigPath,
    ts.sys.readFile(tsconfigPath)!
  );
  const cmd = ts.parseJsonConfigFileContent(
    parsed.config,
    ts.sys,
    PACKAGE_ROOT,
    { noEmit: true }
  );
  return ts.createProgram({
    rootNames: cmd.fileNames,
    options: { ...cmd.options, noEmit: true },
  });
}

function collectExports(
  program: ts.Program,
  entryFile: string
): ExportRecord[] {
  const sourceFile = program.getSourceFile(entryFile);
  if (!sourceFile) {
    throw new Error(`Source file not in program: ${entryFile}`);
  }
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    throw new Error(`No module symbol for ${entryFile}`);
  }

  const printer = ts.createPrinter({ removeComments: true });
  const records: ExportRecord[] = [];
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    // Re-exports (`export type { Foo } from "..."`) come through as alias
    // symbols. Resolve to the underlying declaration so flag tests are
    // meaningful.
    const symbol =
      (exported.flags & ts.SymbolFlags.Alias) !== 0
        ? checker.getAliasedSymbol(exported)
        : exported;
    const flags = symbol.getFlags();
    const isType = (flags & ts.SymbolFlags.Value) === 0;
    const decl = symbol.declarations?.[0];
    if (!decl) continue;

    let signature: string;
    if (
      ts.isInterfaceDeclaration(decl) ||
      ts.isTypeAliasDeclaration(decl) ||
      ts.isEnumDeclaration(decl)
    ) {
      // For declared types, snapshot the actual declaration body — that
      // pins the shape, not just the name. printNode resolves to the
      // source representation we ship in dist/*.d.ts.
      signature = printer.printNode(
        ts.EmitHint.Unspecified,
        decl,
        decl.getSourceFile()
      );
    } else {
      const type = isType
        ? checker.getDeclaredTypeOfSymbol(symbol)
        : checker.getTypeOfSymbolAtLocation(symbol, decl);
      signature = checker.typeToString(
        type,
        decl,
        ts.TypeFormatFlags.NoTruncation |
          ts.TypeFormatFlags.WriteArrayAsGenericType
      );
    }
    signature = signature
      // Normalize absolute import paths so the snapshot is location-
      // independent across machines / CI / local dev.
      .replace(/import\("[^"]+"\)\./g, "")
      .replace(/\s+/g, " ")
      .trim();
    records.push({
      name: exported.getName(),
      kind: isType ? "type" : "value",
      signature,
    });
  }
  records.sort((a, b) => a.name.localeCompare(b.name));
  return records;
}

function formatEntry(entry: string, records: ExportRecord[]): string {
  const lines = [`# ${entry}`, ""];
  for (const r of records) {
    lines.push(`${r.kind} ${r.name}: ${r.signature}`);
  }
  return lines.join("\n");
}

describe("public API surface", () => {
  const program = loadProgram();

  for (const { entry, file } of PUBLIC_ENTRIES) {
    it(`${entry} surface is unchanged`, () => {
      const absFile = path.join(PACKAGE_ROOT, file);
      const records = collectExports(program, absFile);
      // Sanity: every entry must have at least one export. A regression
      // that empties an entry would otherwise pass the snapshot check by
      // matching an empty file.
      expect(
        records.length,
        `entry ${entry} (${file}) has no exports`
      ).toBeGreaterThan(0);
      expect(formatEntry(entry, records)).toMatchSnapshot();
    });
  }
});
