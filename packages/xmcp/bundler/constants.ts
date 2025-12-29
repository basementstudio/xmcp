import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const srcPath = path.join(__dirname, "..", "src");
export const outputPath = path.join(__dirname, "..", "dist");
export const runtimeOutputPath = path.join(__dirname, "..", "dist", "runtime");
export const iconsPath = path.join(__dirname, "..", "..", "icons", "src");
