import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, "..");

mkdirSync(join(packageRoot, "dist"), { recursive: true });
for (const file of ["styles.css", "shadcn.css"]) {
  copyFileSync(join(packageRoot, "src", file), join(packageRoot, "dist", file));
}
