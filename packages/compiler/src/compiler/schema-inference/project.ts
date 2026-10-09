import path from "node:path";

import ts from "typescript";

import { type InferredTool, inferTool } from "./infer";

/** One reusable TypeScript program per compiler, separate from runtime bundles. */
export class SchemaInferenceProject {
  private program?: ts.Program;
  private optionsKey?: string;
  private resolutionFiles = new Map<string, string>();
  private sources = new Map<string, { text: string; source: ts.SourceFile }>();
  readonly dependencies = new Set<string>();
  readonly missingDependencies = new Set<string>();

  constructor(private readonly directory: string) {}

  generate(toolPaths: Iterable<string>): string {
    // TypeScript can reuse failed module resolutions from the previous program.
    // Discard those resolutions when an import appears, disappears, or moves via
    // package metadata; otherwise an unchanged importer can retain stale types.
    const resolutionChanged =
      [...this.missingDependencies].some((file) => ts.sys.fileExists(file)) ||
      [...this.dependencies].some((file) => !ts.sys.fileExists(file)) ||
      [...this.resolutionFiles].some(
        ([file, text]) => ts.sys.readFile(file) !== text
      );
    if (resolutionChanged) {
      this.program = undefined;
      this.sources.clear();
      this.missingDependencies.clear();
      this.resolutionFiles.clear();
    }
    this.dependencies.clear();
    const readFile = (file: string) => {
      const text = ts.sys.readFile(file);
      (text === undefined ? this.missingDependencies : this.dependencies).add(
        file
      );
      if (text !== undefined && path.basename(file) === "package.json")
        this.resolutionFiles.set(file, text);
      return text;
    };
    const fileExists = (file: string) => {
      const exists = ts.sys.fileExists(file);
      if (!exists) this.missingDependencies.add(file);
      return exists;
    };
    const configPath = ts.findConfigFile(this.directory, fileExists);
    let options: ts.CompilerOptions = { strict: true };
    if (configPath) {
      const config = ts.readConfigFile(configPath, readFile);
      if (config.error)
        throw new Error(
          ts.flattenDiagnosticMessageText(config.error.messageText, "\n")
        );
      const parsed = ts.parseJsonConfigFileContent(
        config.config,
        { ...ts.sys, readFile, fileExists },
        path.dirname(configPath)
      );
      const errors = parsed.errors.filter((error) => error.code !== 18003);
      if (errors.length)
        throw new Error(
          errors
            .map((error) =>
              ts.flattenDiagnosticMessageText(error.messageText, "\n")
            )
            .join("\n")
        );
      options = parsed.options;
    }
    const optionsKey = JSON.stringify(options);
    if (optionsKey !== this.optionsKey) {
      this.sources.clear();
      this.program = undefined;
      this.optionsKey = optionsKey;
    }
    const paths = Array.from(toolPaths).sort();
    const host = ts.createCompilerHost({ ...options, noEmit: true });
    host.readFile = readFile;
    host.fileExists = fileExists;
    host.getSourceFile = (file, languageVersion) => {
      const text = readFile(file);
      if (text === undefined) return undefined;
      const cached = this.sources.get(file);
      if (cached?.text === text) return cached.source;
      const source = ts.createSourceFile(file, text, languageVersion, true);
      this.sources.set(file, { text, source });
      return source;
    };
    this.program = ts.createProgram({
      rootNames: paths.map((file) => path.resolve(this.directory, file)),
      options: { ...options, noEmit: true },
      host,
      oldProgram: this.program,
    });
    // Include type-only dependencies even when Rspack's transpiler erases imports.
    for (const source of this.program.getSourceFiles())
      this.dependencies.add(source.fileName);
    for (const file of this.resolutionFiles.keys()) this.dependencies.add(file);
    const diagnostics = this.program.getSyntacticDiagnostics();
    if (diagnostics.length)
      throw new Error(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCurrentDirectory: () => this.directory,
          getCanonicalFileName: (file) => file,
          getNewLine: () => "\n",
        })
      );
    const checker = this.program.getTypeChecker();
    const tools = new Map<string, InferredTool>();
    for (const file of paths) {
      const source = this.program.getSourceFile(
        path.resolve(this.directory, file)
      );
      if (!source)
        throw new Error(`Cannot read tool ${file} for schema inference.`);
      const inferred = inferTool(source, checker);
      if (
        inferred.schema &&
        inferred.schema !== "{}" &&
        !(options.strictNullChecks ?? options.strict)
      ) {
        throw new Error(
          `${file}: Schema inference requires strictNullChecks in tsconfig.json to preserve nullable inputs.`
        );
      }
      tools.set(file.replace(/\\/g, "/"), inferred);
    }
    for (const file of this.sources.keys()) {
      if (!this.dependencies.has(file)) this.sources.delete(file);
    }
    const entries = Array.from(
      tools,
      ([file, tool]) =>
        `[${JSON.stringify(file)}]: {${
          tool.schema ? `schema: ${tool.schema},` : ""
        }${tool.description ? `description: ${JSON.stringify(tool.description)}` : ""}}`
    );
    return `import { z } from "zod";
const inferred = {${entries.join(",\n")}};
export function withInferredSchema(tool, path) {
  const entry = inferred[path];
  if (!entry) return tool;
  return {
    ...tool,
    ...(!("schema" in tool) && entry.schema ? { schema: entry.schema } : {}),
    ...(entry.description ? { metadata: { ...tool.metadata, description: tool.metadata?.description ?? entry.description } } : {}),
  };
}
`;
  }
}
