import path from "path";
import { processFolder } from "./constants";
import fs from "fs-extra";

export function detectPackageManager(): {
  manager: string;
  lockFile: string;
  installCmd: string;
} {
  const pnpmLock = path.join(processFolder, "pnpm-lock.yaml");
  const npmLock = path.join(processFolder, "package-lock.json");
  const yarnLock = path.join(processFolder, "yarn.lock");
  const bunLock = path.join(processFolder, "bun.lockb");

  if (fs.existsSync(bunLock)) {
    return {
      manager: "bun",
      lockFile: "bun.lockb",
      installCmd: "bun install",
    };
  } else if (fs.existsSync(pnpmLock)) {
    return {
      manager: "pnpm",
      lockFile: "pnpm-lock.yaml",
      installCmd: "pnpm install",
    };
  } else if (fs.existsSync(npmLock)) {
    return {
      manager: "npm",
      lockFile: "package-lock.json",
      installCmd: "npm install",
    };
  } else if (fs.existsSync(yarnLock)) {
    return {
      manager: "yarn",
      lockFile: "yarn.lock",
      installCmd: "yarn install",
    };
  } else {
    return {
      manager: "npm",
      lockFile: "",
      installCmd: "npm install",
    };
  }
}
