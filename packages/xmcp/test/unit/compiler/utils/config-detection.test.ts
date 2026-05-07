import { test, expect } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  realpathSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  hasPostCSSConfig,
  findGlobalsCss,
} from "@/compiler/utils/config-detection";

function withTempCwd(run: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "xmcp-test-"));
  const originalCwd = process.cwd();
  try {
    process.chdir(dir);
    run(dir);
  } finally {
    process.chdir(originalCwd);
    rmSync(dir, { recursive: true, force: true });
  }
}

function withRealTempCwd(run: (dir: string) => void): void {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "xmcp-test-")));
  const originalCwd = process.cwd();
  try {
    process.chdir(dir);
    run(dir);
  } finally {
    process.chdir(originalCwd);
    rmSync(dir, { recursive: true, force: true });
  }
}

test("hasPostCSSConfig - returns false when no config files exist", () => {
  withTempCwd(() => {
    expect(hasPostCSSConfig()).toBe(false);
  });
});

test("hasPostCSSConfig - returns true when postcss.config.js exists", () => {
  withTempCwd((dir) => {
    writeFileSync(join(dir, "postcss.config.js"), "module.exports = {}");
    expect(hasPostCSSConfig()).toBe(true);
  });
});

test("hasPostCSSConfig - returns true when postcss.config.mjs exists", () => {
  withTempCwd((dir) => {
    writeFileSync(join(dir, "postcss.config.mjs"), "export default {}");
    expect(hasPostCSSConfig()).toBe(true);
  });
});

test("hasPostCSSConfig - returns true when postcss.config.cjs exists", () => {
  withTempCwd((dir) => {
    writeFileSync(join(dir, "postcss.config.cjs"), "module.exports = {}");
    expect(hasPostCSSConfig()).toBe(true);
  });
});

test("hasPostCSSConfig - returns true when .postcssrc exists", () => {
  withTempCwd((dir) => {
    writeFileSync(join(dir, ".postcssrc"), "{}");
    expect(hasPostCSSConfig()).toBe(true);
  });
});

test("hasPostCSSConfig - returns true when .postcssrc.json exists", () => {
  withTempCwd((dir) => {
    writeFileSync(join(dir, ".postcssrc.json"), "{}");
    expect(hasPostCSSConfig()).toBe(true);
  });
});

test("hasPostCSSConfig - returns true when .postcssrc.js exists", () => {
  withTempCwd((dir) => {
    writeFileSync(join(dir, ".postcssrc.js"), "module.exports = {}");
    expect(hasPostCSSConfig()).toBe(true);
  });
});

test("hasPostCSSConfig - returns true when multiple config files exist", () => {
  withTempCwd((dir) => {
    writeFileSync(join(dir, "postcss.config.js"), "module.exports = {}");
    writeFileSync(join(dir, ".postcssrc.json"), "{}");
    expect(hasPostCSSConfig()).toBe(true);
  });
});

test("hasPostCSSConfig - returns false with non-postcss config files", () => {
  withTempCwd((dir) => {
    writeFileSync(join(dir, "package.json"), "{}");
    writeFileSync(join(dir, "tsconfig.json"), "{}");
    writeFileSync(join(dir, "tailwind.config.js"), "{}");
    expect(hasPostCSSConfig()).toBe(false);
  });
});

test("hasPostCSSConfig - returns false with similar but incorrect filenames", () => {
  withTempCwd((dir) => {
    writeFileSync(join(dir, "postcss.js"), "{}");
    writeFileSync(join(dir, "postcss-config.js"), "{}");
    writeFileSync(join(dir, ".postcss"), "{}");
    expect(hasPostCSSConfig()).toBe(false);
  });
});

test("findGlobalsCss - returns null when no globals.css exists", () => {
  withTempCwd(() => {
    expect(findGlobalsCss()).toBeNull();
  });
});

test("findGlobalsCss - finds globals.css in root directory", () => {
  withRealTempCwd((dir) => {
    const globalsPath = join(dir, "globals.css");
    writeFileSync(globalsPath, "body { margin: 0; }");
    expect(findGlobalsCss()).toBe(globalsPath);
  });
});

test("findGlobalsCss - finds globals.css in src directory", () => {
  withRealTempCwd((dir) => {
    const srcDir = join(dir, "src");
    mkdirSync(srcDir);
    const globalsPath = join(srcDir, "globals.css");
    writeFileSync(globalsPath, "body { margin: 0; }");
    expect(findGlobalsCss()).toBe(globalsPath);
  });
});

test("findGlobalsCss - finds globals.css in src/tools directory", () => {
  withRealTempCwd((dir) => {
    const toolsDir = join(dir, "src", "tools");
    mkdirSync(toolsDir, { recursive: true });
    const globalsPath = join(toolsDir, "globals.css");
    writeFileSync(globalsPath, "body { margin: 0; }");
    expect(findGlobalsCss()).toBe(globalsPath);
  });
});

test("findGlobalsCss - prioritizes root over src directory", () => {
  withRealTempCwd((dir) => {
    const srcDir = join(dir, "src");
    mkdirSync(srcDir);
    const rootGlobals = join(dir, "globals.css");
    const srcGlobals = join(srcDir, "globals.css");
    writeFileSync(rootGlobals, "/* root */");
    writeFileSync(srcGlobals, "/* src */");
    expect(findGlobalsCss()).toBe(rootGlobals);
  });
});

test("findGlobalsCss - prioritizes src over src/tools directory", () => {
  withRealTempCwd((dir) => {
    const toolsDir = join(dir, "src", "tools");
    mkdirSync(toolsDir, { recursive: true });
    const srcGlobals = join(dir, "src", "globals.css");
    const toolsGlobals = join(toolsDir, "globals.css");
    writeFileSync(srcGlobals, "/* src */");
    writeFileSync(toolsGlobals, "/* tools */");
    expect(findGlobalsCss()).toBe(srcGlobals);
  });
});

test("findGlobalsCss - returns null with similar but incorrect filenames", () => {
  withTempCwd((dir) => {
    writeFileSync(join(dir, "global.css"), "");
    writeFileSync(join(dir, "globals.scss"), "");
    writeFileSync(join(dir, "globals-css.css"), "");
    expect(findGlobalsCss()).toBeNull();
  });
});

test("findGlobalsCss - returns null when only other CSS files exist", () => {
  withTempCwd((dir) => {
    const srcDir = join(dir, "src");
    mkdirSync(srcDir);
    writeFileSync(join(dir, "styles.css"), "");
    writeFileSync(join(srcDir, "app.css"), "");
    expect(findGlobalsCss()).toBeNull();
  });
});
