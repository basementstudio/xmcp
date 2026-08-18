import { test } from "node:test";
import assert from "node:assert";
import { pathToToolName } from "../path-utils";

test("pathToToolName - simple tool in root", () => {
  const result = pathToToolName("tools/calculator.tsx");
  assert.match(result, /^tools_calculator_[a-f0-9]{6}$/);
});

test("pathToToolName - simple tool with ts extension", () => {
  const result = pathToToolName("tools/weather.ts");
  assert.match(result, /^tools_weather_[a-f0-9]{6}$/);
});

test("pathToToolName - tool in nested directory", () => {
  const result = pathToToolName("tools/advanced/calculator.tsx");
  assert.match(result, /^tools_advanced_calculator_[a-f0-9]{6}$/);
});

test("pathToToolName - tool in deeply nested directory", () => {
  const result = pathToToolName("tools/math/advanced/calculator.tsx");
  assert.match(result, /^tools_math_advanced_calculator_[a-f0-9]{6}$/);
});

test("pathToToolName - tool with multiple dots in name", () => {
  const result = pathToToolName("tools/my.tool.name.tsx");
  assert.match(result, /^tools_my\.tool\.name_[a-f0-9]{6}$/);
});

test("pathToToolName - tool in triple nested directory", () => {
  const result = pathToToolName("tools/category/subcategory/tool.tsx");
  assert.match(result, /^tools_category_subcategory_tool_[a-f0-9]{6}$/);
});

test("pathToToolName - different tools with same name in different dirs are unique", () => {
  const tool1 = pathToToolName("tools/basic/converter.tsx");
  const tool2 = pathToToolName("tools/advanced/converter.tsx");
  assert.notStrictEqual(tool1, tool2);
  assert.match(tool1, /^tools_basic_converter_[a-f0-9]{6}$/);
  assert.match(tool2, /^tools_advanced_converter_[a-f0-9]{6}$/);
});

test("pathToToolName - tool with jsx extension", () => {
  const result = pathToToolName("tools/component.jsx");
  assert.match(result, /^tools_component_[a-f0-9]{6}$/);
});

test("pathToToolName - tool with js extension", () => {
  const result = pathToToolName("tools/helper.js");
  assert.match(result, /^tools_helper_[a-f0-9]{6}$/);
});

test("pathToToolName - absolute path", () => {
  const result = pathToToolName("/home/user/project/tools/calculator.tsx");
  assert.match(result, /^_home_user_project_tools_calculator_[a-f0-9]{6}$/);
});

test("pathToToolName - tool with hyphen in name", () => {
  const result = pathToToolName("tools/my-tool.tsx");
  assert.match(result, /^tools_my-tool_[a-f0-9]{6}$/);
});

test("pathToToolName - tool with underscore in name", () => {
  const result = pathToToolName("tools/my_tool.tsx");
  assert.match(result, /^tools_my_tool_[a-f0-9]{6}$/);
});

test("pathToToolName - nested with hyphenated names", () => {
  const result = pathToToolName("tools/data-tools/json-parser.tsx");
  assert.match(result, /^tools_data-tools_json-parser_[a-f0-9]{6}$/);
});

test("pathToToolName - four levels deep", () => {
  const result = pathToToolName("tools/a/b/c/tool.tsx");
  assert.match(result, /^tools_a_b_c_tool_[a-f0-9]{6}$/);
});

test("pathToToolName - tool with capital letters", () => {
  const result = pathToToolName("tools/MyComponent.tsx");
  assert.match(result, /^tools_MyComponent_[a-f0-9]{6}$/);
});

test("pathToToolName - nested with mixed case", () => {
  const result = pathToToolName("tools/Advanced/Calculator.tsx");
  assert.match(result, /^tools_Advanced_Calculator_[a-f0-9]{6}$/);
});

test("pathToToolName - tool with number in name", () => {
  const result = pathToToolName("tools/tool-v2.tsx");
  assert.match(result, /^tools_tool-v2_[a-f0-9]{6}$/);
});

test("pathToToolName - nested with numbers", () => {
  const result = pathToToolName("tools/v2/calculator-2.tsx");
  assert.match(result, /^tools_v2_calculator-2_[a-f0-9]{6}$/);
});

test("pathToToolName - real world scenario with collision prevention", () => {
  const basicCalc = pathToToolName("tools/calculator.tsx");
  const advancedCalc = pathToToolName("tools/advanced/calculator.tsx");
  const scientificCalc = pathToToolName("tools/scientific/calculator.tsx");

  assert.match(basicCalc, /^tools_calculator_[a-f0-9]{6}$/);
  assert.match(advancedCalc, /^tools_advanced_calculator_[a-f0-9]{6}$/);
  assert.match(scientificCalc, /^tools_scientific_calculator_[a-f0-9]{6}$/);

  const allUnique = new Set([basicCalc, advancedCalc, scientificCalc]);
  assert.strictEqual(allUnique.size, 3);
});

test("pathToToolName - handles empty path segments", () => {
  const result = pathToToolName("tools//calculator.tsx");
  assert.match(result, /^tools_calculator_[a-f0-9]{6}$/);
});

test("pathToToolName - same basename different paths produce different hashes", () => {
  const result1 = pathToToolName("tools/my-tool.tsx");
  const result2 = pathToToolName("tools/my/tool.tsx");
  assert.notStrictEqual(result1, result2);
});

test("pathToToolName - deterministic hash same path produces same result", () => {
  const path = "tools/my/nested/tool.tsx";
  const result1 = pathToToolName(path);
  const result2 = pathToToolName(path);
  assert.strictEqual(result1, result2);
});

test("pathToToolName - custom directory name", () => {
  const result = pathToToolName("my-custom-tools/calculator.tsx");
  assert.match(result, /^my-custom-tools_calculator_[a-f0-9]{6}$/);
});

test("pathToToolName - custom nested directory", () => {
  const result = pathToToolName("src/my-tools/advanced/converter.tsx");
  assert.match(result, /^src_my-tools_advanced_converter_[a-f0-9]{6}$/);
});
