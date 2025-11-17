import parser from "@typescript-eslint/parser";
import { it, expect, describe } from "vitest";
import { importLengthOrderRule } from "../../../src/rules/import-length-order";
import { readRuleFixture, createRuleLinter } from "../../helpers/rule-testing";

const baseConfig = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module" as const,
  },
  rules: {
    "import-length-order": "error" as const,
  },
};

const ruleName = "import-length-order";

describe("import-length-order rule", () => {
  const createLinter = () => createRuleLinter("import-length-order", importLengthOrderRule, {
    id: "@typescript-eslint/parser",
    implementation: parser,
  });

  it("保持已排序的导入块不报错", () => {
    const linter = createLinter();
    const code = readRuleFixture(ruleName, "valid", "sorted.ts");
    const result = linter.verify(code, baseConfig);
    expect(result).toHaveLength(0);
  });

  const fixScenarios = [
    {
      name: "当长语句位于短语句之前时给出报错并提供修复",
      input: "long-before-short.ts",
      expected: "long-before-short.ts",
    },
    {
      name: "import type 语句始终排在最前面",
      input: "import-type-priority.ts",
      expected: "import-type-priority.ts",
    },
    {
      name: "仅根据 from 前的语句长度排序",
      input: "specifier-length.ts",
      expected: "specifier-length.ts",
    },
    {
      name: "import 括号内的 specifier 也按长度排序",
      input: "specifier-sorting.ts",
      expected: "specifier-sorting.ts",
    },
    {
      name: "多行 specifier 排序时保留缩进和换行",
      input: "multiline-specifiers.ts",
      expected: "multiline-specifiers.ts",
    },
  ] as const;

  const normalizeOutput = (code: string) => code.replace(/\r\n/g, "\n").trimEnd();

  fixScenarios.forEach(({ name, input, expected }) => {
    it(name, () => {
      const linter = createLinter();
      const source = readRuleFixture(ruleName, "invalid", input);
      const expectedOutput = readRuleFixture(ruleName, "expected", expected);
      const messages = linter.verify(source, baseConfig);
      expect(messages[0]?.ruleId).toBe("import-length-order");

      const { fixed, output } = linter.verifyAndFix(source, baseConfig);
      expect(fixed).toBe(true);
      expect(normalizeOutput(output)).toBe(normalizeOutput(expectedOutput));
    });
  });
});
