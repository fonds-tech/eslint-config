/**
 * JSONC 配置模块
 * 为 JSON 和 JSONC 文件配置 ESLint 规则
 */

import type { OptionsFiles, OptionsOverrides, OptionsStylistic, TypedFlatConfigItem } from "../types";

import { interopDefault } from "../utils";
import { GLOB_JSON, GLOB_JSON5, GLOB_JSONC } from "../globs";

/**
 * 为 JSON/JSONC/JSON5 提供语法解析与排序、缩进等规则，可通过 `stylistic` 和 `overrides` 定制。
 */
export async function jsonc(options: OptionsFiles & OptionsStylistic & OptionsOverrides = {}): Promise<TypedFlatConfigItem[]> {
  const { files = [GLOB_JSON, GLOB_JSON5, GLOB_JSONC], overrides = {}, stylistic = true } = options;

  const { indent = 2 } = typeof stylistic === "boolean" ? {} : stylistic;

  const [pluginJsonc, parserJsonc] = await Promise.all([interopDefault(import("eslint-plugin-jsonc")), interopDefault(import("jsonc-eslint-parser"))] as const);

  return [
    {
      name: "senran/jsonc/setup",
      plugins: {
        jsonc: pluginJsonc as any,
      },
    },
    {
      files,
      languageOptions: {
        parser: parserJsonc,
      },
      name: "senran/jsonc/rules",
      rules: {
        // --- JSON/JSONC 语法安全，禁止 JS 专有写法 ---
        "jsonc/no-bigint-literals": "error", // JSON 不支持 BigInt
        "jsonc/no-binary-expression": "error", // 禁止加减等表达式
        "jsonc/no-binary-numeric-literals": "error", // 不支持 0b 数字
        "jsonc/no-dupe-keys": "error", // 键不可重复
        "jsonc/no-escape-sequence-in-identifier": "error", // identifier 不可包含转义
        "jsonc/no-floating-decimal": "error", // 数字必须有整数部分
        "jsonc/no-hexadecimal-numeric-literals": "error", // 不支持 0x
        "jsonc/no-infinity": "error", // 禁用 Infinity
        "jsonc/no-multi-str": "error", // 禁止多行字符串
        "jsonc/no-nan": "error", // 禁止 NaN
        "jsonc/no-number-props": "error", // 属性名不能是数字表达式
        "jsonc/no-numeric-separators": "error", // 不支持下划线分隔
        "jsonc/no-octal": "error", // 禁用八进制
        "jsonc/no-octal-escape": "error", // 禁用八进制转义
        "jsonc/no-octal-numeric-literals": "error", // 禁用 0o
        "jsonc/no-parenthesized": "error", // 禁止括号包裹值
        "jsonc/no-plus-sign": "error", // 数字前不能加 +
        "jsonc/no-regexp-literals": "error", // 不允许正则字面量
        "jsonc/no-sparse-arrays": "error", // 不允许稀疏数组
        "jsonc/no-template-literals": "error", // 禁用模板字符串
        "jsonc/no-undefined-value": "error", // 不允许 undefined
        "jsonc/no-unicode-codepoint-escapes": "error", // 不支持 \u{...}
        "jsonc/no-useless-escape": "error", // 禁止多余转义
        "jsonc/space-unary-ops": "error", // 一元运算符必须紧挨
        "jsonc/valid-json-number": "error", // 数字整体格式合法
        "jsonc/vue-custom-block/no-parsing-error": "error", // Vue 自定义块 JSONC 解析无误

        ...(stylistic
          ? {
              // --- 可选：缩进、逗号、对象空格等格式化约束 ---
              "jsonc/array-bracket-spacing": ["error", "never"], // 数组内不留空格
              "jsonc/comma-dangle": ["error", "never"], // 禁止尾随逗号
              "jsonc/comma-style": ["error", "last"], // 逗号放末尾
              "jsonc/indent": ["error", indent], // JSON 缩进
              "jsonc/key-spacing": ["error", { afterColon: true, beforeColon: false }], // 冒号后空格
              "jsonc/object-curly-newline": ["error", { consistent: true, multiline: true }], // 多行对象换行
              "jsonc/object-curly-spacing": ["error", "always"], // 大括号内空格
              "jsonc/object-property-newline": ["error", { allowMultiplePropertiesPerLine: true }], // 属性换行控制
              "jsonc/quote-props": "error", // 强制属性名加引号
              "jsonc/quotes": "error", // 值使用双引号
            }
          : {}),

        ...overrides,
      },
    },
  ];
}
