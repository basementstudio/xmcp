import path from "path";
import fs from "fs-extra";

/**
 * Copy template files to the project directory, excluding unnecessary files
 * @param templateDir - Source template directory path
 * @param projectPath - Destination project directory path
 * @param paths - Array of paths to include (tools, prompts)
 */
export function copyTemplate(templateDir: string, projectPath: string, paths: string[] = ["tools", "prompts"]): void {
  fs.copySync(templateDir, projectPath, {
    filter: (src) => {
      const basename = path.basename(src);
      const relativePath = path.relative(templateDir, src);
      const srcDir = path.dirname(relativePath).split(path.sep)[0];
      
      // Check if this is a source directory that should be included based on user selection
      if (srcDir === "src") {
        const subDir = relativePath.split(path.sep)[1];
        if (subDir === "tools" && !paths.includes("tools")) return false;
        if (subDir === "prompts" && !paths.includes("prompts")) return false;
      }
      
      return (
        // node_modules could be skipped
        basename !== "node_modules" &&
        basename !== "package-lock.json" &&
        basename !== "yarn.lock" &&
        basename !== "pnpm-lock.yaml" &&
        basename !== "vercel.json"
      );
    },
  });
}
