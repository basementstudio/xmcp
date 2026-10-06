import fs from "node:fs";
import path from "node:path";

import type { Compiler } from "@rspack/core";

import { SchemaInferenceProject } from "../../schema-inference/project";

/** Generate a shared companion module before Rspack resolves the tool registries. */
export class SchemaInferencePlugin {
  constructor(
    private readonly directory: string,
    private readonly outputDirectory: string,
    private readonly toolPaths: () => Iterable<string>
  ) {}

  apply(compiler: Compiler) {
    const project = new SchemaInferenceProject(this.directory);
    let failure: Error | undefined;
    compiler.hooks.beforeCompile.tap("SchemaInferencePlugin", () => {
      failure = undefined;
      const output = path.join(this.outputDirectory, "inferred-tools.js");
      try {
        const code = project.generate(this.toolPaths());
        fs.mkdirSync(this.outputDirectory, { recursive: true });
        if (!fs.existsSync(output) || fs.readFileSync(output, "utf8") !== code)
          fs.writeFileSync(output, code);
      } catch (error) {
        failure = error instanceof Error ? error : new Error(String(error));
        // Never retain a previously valid schema after an inference failure.
        fs.mkdirSync(this.outputDirectory, { recursive: true });
        fs.writeFileSync(
          output,
          `throw new Error(${JSON.stringify(failure.message)});\nexport const withInferredSchema = () => {};\n`
        );
      }
    });
    compiler.hooks.thisCompilation.tap(
      "SchemaInferencePlugin",
      (compilation) => {
        for (const file of project.dependencies)
          compilation.fileDependencies.add(file);
        for (const file of project.missingDependencies)
          compilation.missingDependencies.add(file);
        if (failure) compilation.errors.push(failure);
      }
    );
    // Rspack watch must continue after an invalid edit; production must fail CI.
    compiler.hooks.done.tap("SchemaInferencePlugin", () => {
      if (failure && !compiler.watchMode) process.exitCode = 1;
    });
  }
}
