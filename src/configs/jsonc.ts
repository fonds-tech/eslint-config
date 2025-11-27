import type { OptionsFiles, OptionsOverrides, OptionsStylistic, TypedFlatConfigItem } from "../types"

import { interopDefault } from "../utils"
import { GLOB_JSON, GLOB_JSON5, GLOB_JSONC } from "../globs"

/**
 * JSON/JSONC 配置。
 * 支持带注释的 JSON (JSONC) 以及 JSON5。
 * 包含格式化与排序规则。
 */
export async function jsonc(
  options: OptionsFiles & OptionsStylistic & OptionsOverrides = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    files = [GLOB_JSON, GLOB_JSON5, GLOB_JSONC],
    overrides = {},
    stylistic = true,
  } = options

  const {
    indent = 2,
  } = typeof stylistic === "boolean" ? {} : stylistic

  const [
    pluginJsonc,
    parserJsonc,
  ] = await Promise.all([
    interopDefault(import("eslint-plugin-jsonc")),
    interopDefault(import("jsonc-eslint-parser")),
  ] as const)

  return [
    {
      name: "fonds/jsonc/setup",
      plugins: {
        jsonc: pluginJsonc as any,
      },
    },
    {
      files,
      languageOptions: {
        parser: parserJsonc,
      },
      name: "fonds/jsonc/rules",
      rules: {
        // === JSON 语法规则 (防止无效 JSON) ===
        "jsonc/no-bigint-literals": "error", // 禁止 BigInt 字面量 (JSON 标准不支持)
        "jsonc/no-binary-expression": "error", // 禁止二进制表达式
        "jsonc/no-binary-numeric-literals": "error", // 禁止二进制数字
        "jsonc/no-dupe-keys": "error", // 禁止重复键
        "jsonc/no-escape-sequence-in-identifier": "error", // 禁止标识符中的转义序列
        "jsonc/no-floating-decimal": "error", // 禁止浮点小数 (.5 -> 0.5)
        "jsonc/no-hexadecimal-numeric-literals": "error", // 禁止十六进制数字
        "jsonc/no-infinity": "error", // 禁止 Infinity
        "jsonc/no-multi-str": "error", // 禁止多行字符串
        "jsonc/no-nan": "error", // 禁止 NaN
        "jsonc/no-number-props": "error", // 禁止数字属性名
        "jsonc/no-numeric-separators": "error", // 禁止数字分隔符 (1_000)
        "jsonc/no-octal": "error", // 禁止八进制
        "jsonc/no-octal-escape": "error",
        "jsonc/no-octal-numeric-literals": "error",
        "jsonc/no-parenthesized": "error", // 禁止括号表达式
        "jsonc/no-plus-sign": "error", // 禁止正号 (+1)
        "jsonc/no-regexp-literals": "error", // 禁止正则字面量
        "jsonc/no-sparse-arrays": "error", // 禁止稀疏数组 ([1,,2])
        "jsonc/no-template-literals": "error", // 禁止模板字符串 (反引号)
        "jsonc/no-undefined-value": "error", // 禁止 undefined
        "jsonc/no-unicode-codepoint-escapes": "error", // 禁止 Unicode 代码点转义
        "jsonc/no-useless-escape": "error", // 禁止无用的转义
        "jsonc/space-unary-ops": "error", // 禁用一元操作符空格
        "jsonc/valid-json-number": "error", // 验证数字格式
        "jsonc/vue-custom-block/no-parsing-error": "error", // 检查 Vue SFC 中的 <i18n> 块等

        // === 风格规则 (如果启用) ===
        ...stylistic
          ? {
              "jsonc/array-bracket-spacing": ["error", "never"], // 数组括号内不留空格
              "jsonc/comma-dangle": ["error", "never"], // JSON 通常不允许尾随逗号 (即使 JSONC 允许，为了通用性通常禁用)
              "jsonc/comma-style": ["error", "last"], // 逗号在行尾
              "jsonc/indent": ["error", indent], // 缩进
              "jsonc/key-spacing": ["error", { afterColon: true, beforeColon: false }], // 冒号后有空格
              "jsonc/object-curly-newline": ["error", { consistent: true, multiline: true }], // 对象大括号换行规则
              "jsonc/object-curly-spacing": ["error", "always"], // 对象大括号内有空格
              "jsonc/object-property-newline": ["error", { allowAllPropertiesOnSameLine: true }], // 对象属性换行
              "jsonc/quote-props": "error", // 强制属性名加引号
              "jsonc/quotes": "error", // 强制双引号
            }
          : {},

        ...overrides,
      },
    },
  ]
}
