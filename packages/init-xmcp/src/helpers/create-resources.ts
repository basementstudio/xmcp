import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

/**
 * Create resources directory and resource files
 * @param projectRoot - Project root directory
 * @param resourcesPath - Path for resources directory (relative to project root)
 */
export function createResources(
  projectRoot: string,
  resourcesPath: string
): void {
  // normalize the path to handle any path separators correctly
  const normalizedResourcesPath = path.normalize(resourcesPath);
  const resourcesDirPath = path.join(projectRoot, normalizedResourcesPath);

  try {
    // create resources directory and all parent directories
    fs.ensureDirSync(resourcesDirPath);

    // create (config) subdirectory
    const configDirPath = path.join(resourcesDirPath, "(config)");
    fs.ensureDirSync(configDirPath);

    const staticResourceFilePath = path.join(configDirPath, "app.ts");
    fs.writeFileSync(staticResourceFilePath, staticResourceTemplate);

    // create (users)/[userId] subdirectory structure
    const usersDirPath = path.join(resourcesDirPath, "(users)", "[userId]");
    fs.ensureDirSync(usersDirPath);

    const dynamicResourceFilePath = path.join(usersDirPath, "profile.ts");
    fs.writeFileSync(dynamicResourceFilePath, dynamicResourceTemplate);

    console.log(
      chalk.green(
        `Created static resource: ${normalizedResourcesPath}/(config)/app.ts`
      )
    );
    console.log(
      chalk.green(
        `Created dynamic resource: ${normalizedResourcesPath}/(users)/[userId]/profile.ts`
      )
    );
  } catch (error) {
    console.error(chalk.red(`Failed to create resources: ${error}`));
    throw error;
  }
}

const staticResourceTemplate = `import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "app-config",
  title: "Application Config",
  description: "Application configuration data",
};

export default function handler() {
  return "App configuration here";
}
`;

const dynamicResourceTemplate = `import { z } from "zod";
import { type ResourceMetadata, type InferSchema } from "xmcp";

export const schema = {
  userId: z.string().describe("The ID of the user"),
};

export const metadata: ResourceMetadata = {
  name: "user-profile",
  title: "User Profile",
  description: "User profile information",
};

export default function handler({ userId }: InferSchema<typeof schema>) {
  return \`Profile data for user \${userId}\`;
}
`;
