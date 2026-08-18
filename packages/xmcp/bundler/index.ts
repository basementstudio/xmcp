import { buildMain } from "./build-main";
import { buildRuntime } from "./build-runtime";
import fs from "fs-extra";
import { outputPath } from "./constants";

fs.emptyDirSync(outputPath);
buildRuntime(() => {
  buildMain();
});
