import type { OptionsFiles, OptionsOverrides, OptionsStylistic, TypedFlatConfigItem } from "../types"

import { GLOB_TOML } from "../globs"
import { interopDefault } from "../utils"

/**
 * TOML 配置。
 * TOML 常用于 Rust 项目配置 (Cargo.toml) 或 Python 工具配置 (pyproject.toml)。
 */
export async function toml(
  options: OptionsOverrides & OptionsStylistic & OptionsFiles = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    files = [GLOB_TOML],
    overrides = {},
    stylistic = true,
  } = options

  const {
    indent = 2,
  } = typeof stylistic === "boolean" ? {} : stylistic

  const [
    pluginToml,
    parserToml,
  ] = await Promise.all([
    interopDefault(import("eslint-plugin-toml")),
    interopDefault(import("toml-eslint-parser")),
  ] as const)

  return [
    {
      name: "fonds/toml/setup",
      plugins: {
        toml: pluginToml,
      },
    },
    {
      files,
      languageOptions: {
        parser: parserToml,
      },
      name: "fonds/toml/rules",
      rules: {
        "style/spaced-comment": "off",

        "toml/comma-style": "error", // 逗号风格
        "toml/keys-order": "error", // 键排序
        "toml/no-space-dots": "error", // 禁止点号周围有空格
        "toml/no-unreadable-number-separator": "error", // 禁止不可读的数字分隔符
        "toml/precision-of-fractional-seconds": "error", // 秒的小数精度
        "toml/precision-of-integer": "error", // 整数精度
        "toml/tables-order": "error", // 表格排序

        "toml/vue-custom-block/no-parsing-error": "error",

        // === 风格规则 ===
        ...stylistic
          ? {
              "toml/array-bracket-newline": "error", // 数组括号换行
              "toml/array-bracket-spacing": "error", // 数组括号内空格
              "toml/array-element-newline": "error", // 数组元素换行
              "toml/indent": ["error", indent === "tab" ? 2 : indent], // 缩进
              "toml/inline-table-curly-spacing": "error", // 内联表格大括号内空格
              "toml/key-spacing": "error", // 键值对间距
              "toml/padding-line-between-pairs": "error", // 键值对之间的空行
              "toml/padding-line-between-tables": "error", // 表格之间的空行
              "toml/quoted-keys": "error", // 尽量不使用引号包围键名 (除非包含特殊字符)
              "toml/spaced-comment": "error", // 注释空格
              "toml/table-bracket-spacing": "error", // 表格括号空格
            }
          : {},

        ...overrides,
      },
    },
  ]
}
