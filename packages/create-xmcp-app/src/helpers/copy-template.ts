import path from "path";
import fs from "fs-extra";

interface ComponentOptions {
  tools?: boolean;
  prompts?: boolean;
}

/**
 * Copy template files to the project directory, excluding unnecessary files and respecting component selections
 * @param templateDir - Source template directory path
 * @param projectPath - Destination project directory path
 * @param componentOptions - Options for which components to include
 */
export function copyTemplate(
  templateDir: string, 
  projectPath: string, 
  componentOptions: ComponentOptions = { tools: true, prompts: true }
): void {
  const { tools = true, prompts = true } = componentOptions;
  
  fs.copySync(templateDir, projectPath, {
    filter: (src: string) => {
      const basename = path.basename(src);
      const relativePath = path.relative(templateDir, src);
      
      // Skip unwanted files
      if (
        basename === "node_modules" ||
        basename === "package-lock.json" ||
        basename === "yarn.lock" ||
        basename === "pnpm-lock.yaml" ||
        basename === "vercel.json"
      ) {
        return false;
      }
      
      // Skip tools directory if not selected
      if (!tools && (relativePath === "src/tools" || relativePath.startsWith("src/tools/"))) {
        return false;
      }
      
      // Skip prompts directory if not selected
      if (!prompts && (relativePath === "src/prompts" || relativePath.startsWith("src/prompts/"))) {
        return false;
      }
      
      return true;
    },
  });
}
