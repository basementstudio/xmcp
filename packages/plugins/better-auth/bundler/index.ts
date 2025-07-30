import { buildMain } from "./build-main";
import { buildUI } from "./build-ui";

async function main() {
  try {
    // Build the main package
    await buildMain();

    // Build the UI with Vite
    await buildUI();

    console.log("✅ Build completed successfully");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

main();
