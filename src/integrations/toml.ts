/**
 * TOML 配置模块
 * 为 TOML 文件配置 ESLint 规则
 */

import type { OptionsFiles, OptionsOverrides, OptionsStylistic, TypedFlatConfigItem } from "../types";

import { GLOB_TOML } from "../globs";
import { interopDefault } from "../utils";

/**
 * 对 TOML 配置文件提供语法校验与格式化能力，依赖 `eslint-plugin-toml` 与 `toml-eslint-parser`。
 */
export async function toml(options: OptionsOverrides & OptionsStylistic & OptionsFiles = {}): Promise<TypedFlatConfigItem[]> {
  const { files = [GLOB_TOML], overrides = {}, stylistic = true } = options;

  const { indent = 2 } = typeof stylistic === "boolean" ? {} : stylistic;

  const [pluginToml, parserToml] = await Promise.all([interopDefault(import("eslint-plugin-toml")), interopDefault(import("toml-eslint-parser"))] as const);

  return [
    {
      name: "senran/toml/setup",
      plugins: {
        toml: pluginToml,
      },
    },
    {
      files,
      languageOptions: {
        parser: parserToml,
      },
      name: "senran/toml/rules",
      rules: {
        // --- TOML 语法与数值精度校验 ---
        "style/spaced-comment": "off", // 注释格式由 toml 规则处理

        "toml/comma-style": "error", // 逗号应位于末尾
        "toml/keys-order": "error", // 键按字母排序
        "toml/no-space-dots": "error", // 键路径中的点不能有空格
        "toml/no-unreadable-number-separator": "error", // 数字分隔符合法
        "toml/precision-of-fractional-seconds": "error", // 时间小数位合法
        "toml/precision-of-integer": "error", // 整数精度限制
        "toml/tables-order": "error", // 表定义排序

        "toml/vue-custom-block/no-parsing-error": "error", // Vue TOML 块解析正确

        ...(stylistic
          ? {
              // --- 可选：缩进/间距等风格化约束 ---
              "toml/array-bracket-newline": "error", // 数组换行
              "toml/array-bracket-spacing": "error", // 数组内空格
              "toml/array-element-newline": "error", // 元素逐行
              "toml/indent": ["error", indent === "tab" ? 2 : indent], // 缩进
              "toml/inline-table-curly-spacing": "error", // 内联表空格
              "toml/key-spacing": "error", // 键与值间空格
              "toml/padding-line-between-pairs": "error", // 相邻键值对空行
              "toml/padding-line-between-tables": "error", // 表之间空行
              "toml/quoted-keys": "error", // 键需加引号
              "toml/spaced-comment": "error", // 注释前留空格
              "toml/table-bracket-spacing": "error", // 表括号空格
            }
          : {}),

        ...overrides,
      },
    },
  ];
}
