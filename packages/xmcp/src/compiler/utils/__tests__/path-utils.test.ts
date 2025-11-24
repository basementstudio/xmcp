import { test } from "node:test";
import assert from "node:assert";
import { pathToToolName } from "../path-utils";

test("pathToToolName - simple tool in root", () => {
  const result = pathToToolName("tools/calculator.tsx");
  assert.match(result, /^calculator-[a-f0-9]{6}$/);
});

test("pathToToolName - simple tool with ts extension", () => {
  const result = pathToToolName("tools/weather.ts");
  assert.match(result, /^weather-[a-f0-9]{6}$/);
});

test("pathToToolName - tool in nested directory", () => {
  const result = pathToToolName("tools/advanced/calculator.tsx");
  assert.match(result, /^advanced-calculator-[a-f0-9]{6}$/);
});

test("pathToToolName - tool in deeply nested directory", () => {
  const result = pathToToolName("tools/math/advanced/calculator.tsx");
  assert.match(result, /^math-advanced-calculator-[a-f0-9]{6}$/);
});

test("pathToToolName - tool with multiple dots in name", () => {
  const result = pathToToolName("tools/my.tool.name.tsx");
  assert.match(result, /^my\.tool\.name-[a-f0-9]{6}$/);
});

test("pathToToolName - tool in triple nested directory", () => {
  const result = pathToToolName("tools/category/subcategory/tool.tsx");
  assert.match(result, /^category-subcategory-tool-[a-f0-9]{6}$/);
});

test("pathToToolName - different tools with same name in different dirs are unique", () => {
  const tool1 = pathToToolName("tools/basic/converter.tsx");
  const tool2 = pathToToolName("tools/advanced/converter.tsx");
  assert.notStrictEqual(tool1, tool2);
  assert.match(tool1, /^basic-converter-[a-f0-9]{6}$/);
  assert.match(tool2, /^advanced-converter-[a-f0-9]{6}$/);
});

test("pathToToolName - tool with jsx extension", () => {
  const result = pathToToolName("tools/component.jsx");
  assert.match(result, /^component-[a-f0-9]{6}$/);
});

test("pathToToolName - tool with js extension", () => {
  const result = pathToToolName("tools/helper.js");
  assert.match(result, /^helper-[a-f0-9]{6}$/);
});

test("pathToToolName - absolute path", () => {
  const result = pathToToolName("/home/user/project/tools/calculator.tsx");
  assert.match(result, /^calculator-[a-f0-9]{6}$/);
});

test("pathToToolName - tool with hyphen in name", () => {
  const result = pathToToolName("tools/my-tool.tsx");
  assert.match(result, /^my-tool-[a-f0-9]{6}$/);
});

test("pathToToolName - tool with underscore in name", () => {
  const result = pathToToolName("tools/my_tool.tsx");
  assert.match(result, /^my_tool-[a-f0-9]{6}$/);
});

test("pathToToolName - nested with hyphenated names", () => {
  const result = pathToToolName("tools/data-tools/json-parser.tsx");
  assert.match(result, /^data-tools-json-parser-[a-f0-9]{6}$/);
});

test("pathToToolName - four levels deep", () => {
  const result = pathToToolName("tools/a/b/c/tool.tsx");
  assert.match(result, /^a-b-c-tool-[a-f0-9]{6}$/);
});

test("pathToToolName - tool with capital letters", () => {
  const result = pathToToolName("tools/MyComponent.tsx");
  assert.match(result, /^MyComponent-[a-f0-9]{6}$/);
});

test("pathToToolName - nested with mixed case", () => {
  const result = pathToToolName("tools/Advanced/Calculator.tsx");
  assert.match(result, /^Advanced-Calculator-[a-f0-9]{6}$/);
});

test("pathToToolName - tool with number in name", () => {
  const result = pathToToolName("tools/tool-v2.tsx");
  assert.match(result, /^tool-v2-[a-f0-9]{6}$/);
});

test("pathToToolName - nested with numbers", () => {
  const result = pathToToolName("tools/v2/calculator-2.tsx");
  assert.match(result, /^v2-calculator-2-[a-f0-9]{6}$/);
});

test("pathToToolName - real world scenario with collision prevention", () => {
  const basicCalc = pathToToolName("tools/calculator.tsx");
  const advancedCalc = pathToToolName("tools/advanced/calculator.tsx");
  const scientificCalc = pathToToolName("tools/scientific/calculator.tsx");

  assert.match(basicCalc, /^calculator-[a-f0-9]{6}$/);
  assert.match(advancedCalc, /^advanced-calculator-[a-f0-9]{6}$/);
  assert.match(scientificCalc, /^scientific-calculator-[a-f0-9]{6}$/);

  const allUnique = new Set([basicCalc, advancedCalc, scientificCalc]);
  assert.strictEqual(allUnique.size, 3);
});

test("pathToToolName - handles empty path segments", () => {
  const result = pathToToolName("tools//calculator.tsx");
  assert.match(result, /^calculator-[a-f0-9]{6}$/);
});

test("pathToToolName - same basename different paths produce different hashes", () => {
  const result1 = pathToToolName("tools/my-tool.tsx");
  const result2 = pathToToolName("tools/my/tool.tsx");
  assert.notStrictEqual(result1, result2);
});

test("pathToToolName - missing tools directory throws error", () => {
  assert.throws(() => {
    pathToToolName("src/calculator.tsx");
  }, /does not contain "tools" directory/);
});

test("pathToToolName - empty path after tools directory throws error", () => {
  assert.throws(() => {
    pathToToolName("tools/");
  }, /has no filename after "tools" directory/);
});

test("pathToToolName - deterministic hash same path produces same result", () => {
  const path = "tools/my/nested/tool.tsx";
  const result1 = pathToToolName(path);
  const result2 = pathToToolName(path);
  assert.strictEqual(result1, result2);
});
