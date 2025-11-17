import type { Linter } from "eslint";
import { parserPlain } from "../../../src/utils";
import { cssPropertyOrderRule } from "../../../src/rules/css-property-order";
import { it, expect, describe, beforeEach } from "vitest";
import { readRuleFixture, createRuleLinter, loadRuleFixtureGroup } from "../../helpers/rule-testing";

const baseConfig = {
  parser: "parser-plain",
  rules: {
    "css-property-order": 2,
  },
};

const ruleName = "css-property-order";

const validDescriptions: Record<string, string> = {
  "attribute-selector.css": "属性选择器依旧保持顺序",
  "basic.css": "基础属性排序用例",
  "complex-selectors.css": "复杂选择器组合",
  "complex-values.css": "复杂属性值场景",
  "custom-properties.css": "CSS 变量引用",
  "duplicate-properties.css": "重复属性声明",
  "empty-selector.css": "空规则块",
  "hyphenated-properties.css": "含连字符的属性名",
  "important-declarations.css": "!important 声明",
  "inline-comments.css": "保留内联注释",
  "less-mixins.less": "LESS mixin 支持",
  "many-properties.css": "大量属性有序排列",
  "multi-format-minified.css": "压缩格式",
  "multi-format-multiple-rules.css": "多规则块文件",
  "multi-format-standard.css": "常规多行 CSS",
  "multiple-selectors.css": "多个选择器独立校验",
  "pseudo-selector.css": "伪类选择器",
  "scss-nested.scss": "SCSS 嵌套结构",
  "scss-variables.scss": "SCSS 变量定义",
  "single-property.css": "单个属性",
};

const invalidDescriptions: Record<string, string> = {
  "many-properties.css": "大量属性乱序",
  "mixed-order.scss": "SCSS 属性乱序",
  "multiple-selectors.css": "多个选择器乱序",
  "unsorted-basic.css": "基础乱序样例",
  "wrong-length-order.less": "LESS 长度排序错误",
};

describe("css-property-order 规则", () => {
  let linter: Linter;

  beforeEach(() => {
    linter = createRuleLinter("css-property-order", cssPropertyOrderRule, {
      id: "parser-plain",
      implementation: parserPlain,
    });
  });

  const createConfig = (options?: Record<string, unknown>) => ({
    parser: "parser-plain",
    rules: {
      "css-property-order": options ? [2, options] : 2,
    },
  });

  describe("语义化正例", () => {
    loadRuleFixtureGroup(ruleName, "valid").forEach(({ name, content }) => {
      const title = validDescriptions[name] ?? `正例：${name}`;
      it(title, () => {
        const result = linter.verify(content, baseConfig as any);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe("语义化反例", () => {
    loadRuleFixtureGroup(ruleName, "invalid").forEach(({ name, content }) => {
      const title = invalidDescriptions[name] ?? `反例：${name}`;
      it(title, () => {
        const result = linter.verify(content, baseConfig as any);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]?.messageId).toBe("shouldSortProperties");
      });
    });
  });

  describe("配置：ignoreProperties", () => {
    const singleIgnored = readRuleFixture(ruleName, "options", "ignore-properties.css");
    const multipleIgnored = readRuleFixture(ruleName, "options", "ignore-multiple.css");

    it("忽略单个属性", () => {
      const config = createConfig({ ignoreProperties: ["display"] });
      const result = linter.verify(singleIgnored, config as any);
      expect(result).toHaveLength(0);
    });

    it("忽略多个属性", () => {
      const config = createConfig({ ignoreProperties: ["z-index", "position"] });
      const result = linter.verify(multipleIgnored, config as any);
      expect(result).toHaveLength(0);
    });
  });

  describe("配置：sortByLength", () => {
    const sortByLengthEnabled = readRuleFixture(ruleName, "options", "sort-by-length-true.css");
    const sortByLengthDisabledValid = readRuleFixture(ruleName, "options", "sort-by-length-false-valid.css");
    const sortByLengthDisabledInvalid = readRuleFixture(ruleName, "options", "sort-by-length-false-invalid.css");

    it("启用时按长度排序", () => {
      const config = createConfig({ sortByLength: true });
      const result = linter.verify(sortByLengthEnabled, config as any);
      expect(result).toHaveLength(0);
    });

    it("禁用时按字母排序", () => {
      const config = createConfig({ sortByLength: false });
      const result = linter.verify(sortByLengthDisabledValid, config as any);
      expect(result).toHaveLength(0);
    });

    it("禁用时检测字母顺序问题", () => {
      const config = createConfig({ sortByLength: false });
      const result = linter.verify(sortByLengthDisabledInvalid, config as any);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("自动修复能力", () => {
    const unsorted = readRuleFixture(ruleName, "invalid", "unsorted-basic.css");

    it("提供自动修复信息", () => {
      const result = linter.verify(unsorted, baseConfig as any);
      expect(result[0]?.fix).toBeDefined();
      expect(Array.isArray(result[0]?.fix?.range)).toBe(true);
    });
  });

  describe("多格式覆盖", () => {
    const multiFormatFixtures = [
      "multi-format-standard.css",
      "multi-format-multiple-rules.css",
      "multi-format-minified.css",
    ].map(file => readRuleFixture(ruleName, "valid", file));

    it("兼容多种格式", () => {
      multiFormatFixtures.forEach((code) => {
        const result = linter.verify(code, baseConfig as any);
        expect(result).toHaveLength(0);
      });
    });
  });
});
