import { test, expect } from "vitest";
import { pathToToolName } from "@/compiler/utils/path-utils";

test("pathToToolName - simple tool in root", () => {
  expect(pathToToolName("tools/calculator.tsx")).toMatch(
    /^tools_calculator_[a-f0-9]{6}$/
  );
});

test("pathToToolName - simple tool with ts extension", () => {
  expect(pathToToolName("tools/weather.ts")).toMatch(
    /^tools_weather_[a-f0-9]{6}$/
  );
});

test("pathToToolName - tool in nested directory", () => {
  expect(pathToToolName("tools/advanced/calculator.tsx")).toMatch(
    /^tools_advanced_calculator_[a-f0-9]{6}$/
  );
});

test("pathToToolName - tool in deeply nested directory", () => {
  expect(pathToToolName("tools/math/advanced/calculator.tsx")).toMatch(
    /^tools_math_advanced_calculator_[a-f0-9]{6}$/
  );
});

test("pathToToolName - tool with multiple dots in name", () => {
  expect(pathToToolName("tools/my.tool.name.tsx")).toMatch(
    /^tools_my\.tool\.name_[a-f0-9]{6}$/
  );
});

test("pathToToolName - tool in triple nested directory", () => {
  expect(pathToToolName("tools/category/subcategory/tool.tsx")).toMatch(
    /^tools_category_subcategory_tool_[a-f0-9]{6}$/
  );
});

test("pathToToolName - different tools with same name in different dirs are unique", () => {
  const tool1 = pathToToolName("tools/basic/converter.tsx");
  const tool2 = pathToToolName("tools/advanced/converter.tsx");
  expect(tool1).not.toBe(tool2);
  expect(tool1).toMatch(/^tools_basic_converter_[a-f0-9]{6}$/);
  expect(tool2).toMatch(/^tools_advanced_converter_[a-f0-9]{6}$/);
});

test("pathToToolName - tool with jsx extension", () => {
  expect(pathToToolName("tools/component.jsx")).toMatch(
    /^tools_component_[a-f0-9]{6}$/
  );
});

test("pathToToolName - tool with js extension", () => {
  expect(pathToToolName("tools/helper.js")).toMatch(
    /^tools_helper_[a-f0-9]{6}$/
  );
});

test("pathToToolName - absolute path", () => {
  expect(pathToToolName("/home/user/project/tools/calculator.tsx")).toMatch(
    /^_home_user_project_tools_calculator_[a-f0-9]{6}$/
  );
});

test("pathToToolName - tool with hyphen in name", () => {
  expect(pathToToolName("tools/my-tool.tsx")).toMatch(
    /^tools_my-tool_[a-f0-9]{6}$/
  );
});

test("pathToToolName - tool with underscore in name", () => {
  expect(pathToToolName("tools/my_tool.tsx")).toMatch(
    /^tools_my_tool_[a-f0-9]{6}$/
  );
});

test("pathToToolName - nested with hyphenated names", () => {
  expect(pathToToolName("tools/data-tools/json-parser.tsx")).toMatch(
    /^tools_data-tools_json-parser_[a-f0-9]{6}$/
  );
});

test("pathToToolName - four levels deep", () => {
  expect(pathToToolName("tools/a/b/c/tool.tsx")).toMatch(
    /^tools_a_b_c_tool_[a-f0-9]{6}$/
  );
});

test("pathToToolName - tool with capital letters", () => {
  expect(pathToToolName("tools/MyComponent.tsx")).toMatch(
    /^tools_MyComponent_[a-f0-9]{6}$/
  );
});

test("pathToToolName - nested with mixed case", () => {
  expect(pathToToolName("tools/Advanced/Calculator.tsx")).toMatch(
    /^tools_Advanced_Calculator_[a-f0-9]{6}$/
  );
});

test("pathToToolName - tool with number in name", () => {
  expect(pathToToolName("tools/tool-v2.tsx")).toMatch(
    /^tools_tool-v2_[a-f0-9]{6}$/
  );
});

test("pathToToolName - nested with numbers", () => {
  expect(pathToToolName("tools/v2/calculator-2.tsx")).toMatch(
    /^tools_v2_calculator-2_[a-f0-9]{6}$/
  );
});

test("pathToToolName - real world scenario with collision prevention", () => {
  const basicCalc = pathToToolName("tools/calculator.tsx");
  const advancedCalc = pathToToolName("tools/advanced/calculator.tsx");
  const scientificCalc = pathToToolName("tools/scientific/calculator.tsx");

  expect(basicCalc).toMatch(/^tools_calculator_[a-f0-9]{6}$/);
  expect(advancedCalc).toMatch(/^tools_advanced_calculator_[a-f0-9]{6}$/);
  expect(scientificCalc).toMatch(/^tools_scientific_calculator_[a-f0-9]{6}$/);

  expect(new Set([basicCalc, advancedCalc, scientificCalc]).size).toBe(3);
});

// TODO(canary): pins current behaviour — `tools//x.tsx` → `tools__x_<hash>`.
// Realistic on Windows (`tools\\x.tsx` normalizes to `tools//x.tsx`) and with
// trailing-slash `paths` config. Decide on canary whether to collapse
// consecutive separators in `normalizeAndGetBaseName`. See test/ROADMAP.md §2.2.
test("pathToToolName - empty path segments produce consecutive underscores", () => {
  expect(pathToToolName("tools//calculator.tsx")).toMatch(
    /^tools__calculator_[a-f0-9]{6}$/
  );
});

test("pathToToolName - same basename different paths produce different hashes", () => {
  expect(pathToToolName("tools/my-tool.tsx")).not.toBe(
    pathToToolName("tools/my/tool.tsx")
  );
});

test("pathToToolName - deterministic hash same path produces same result", () => {
  const path = "tools/my/nested/tool.tsx";
  expect(pathToToolName(path)).toBe(pathToToolName(path));
});

test("pathToToolName - custom directory name", () => {
  expect(pathToToolName("my-custom-tools/calculator.tsx")).toMatch(
    /^my-custom-tools_calculator_[a-f0-9]{6}$/
  );
});

test("pathToToolName - custom nested directory", () => {
  expect(pathToToolName("src/my-tools/advanced/converter.tsx")).toMatch(
    /^src_my-tools_advanced_converter_[a-f0-9]{6}$/
  );
});
