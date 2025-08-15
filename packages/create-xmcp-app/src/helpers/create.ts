import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { copyTemplate } from "./copy-template.js";
import { renameFiles } from "./rename.js";
import { updatePackageJson } from "./update-package.js";
import { install } from "./install.js";
import { generateConfig } from "./generate-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProjectOptions {
  projectPath: string;
  projectName: string;
  packageManager: string;
  transports: string[];
  packageVersion: string;
  skipInstall?: boolean;
}

/**
 * Create necessary project directories
 * @param projectPath - Project directory path
 */
function createProjectDirectories(projectPath: string): void {
  fs.ensureDirSync(path.join(projectPath, ".xmcp"));
}

/**
 * Create a new xmcp project by orchestrating all the setup steps
 * @param options - Configuration options for project creation
 */
export function createProject(options: ProjectOptions): void {
  const {
    projectPath,
    projectName,
    packageManager,
    transports,
    packageVersion,
    skipInstall,
  } = options;

  // Ensure the project directory exists
  fs.ensureDirSync(projectPath);

  // Get the template directory path
  const templateDir = path.join(__dirname, "../../templates", "typescript");

  // Copy template files to project directory
  copyTemplate(templateDir, projectPath);

  // Rename special files (e.g., _gitignore to .gitignore)
  renameFiles(projectPath);

  // Generate xmcp.config.ts based on selected transports
  generateConfig(projectPath, transports);

  // Update package.json with project configuration
  updatePackageJson(projectPath, projectName, transports);

  // Create necessary project directories
  createProjectDirectories(projectPath);

  // Install project dependencies
  if (!skipInstall) {
    install(projectPath, packageManager, packageVersion);
  }
}
