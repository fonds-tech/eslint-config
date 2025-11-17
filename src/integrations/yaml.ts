/**
 * YAML 配置模块
 * 为 YAML 文件配置 ESLint 规则
 */

import type { OptionsFiles, OptionsOverrides, OptionsStylistic, TypedFlatConfigItem } from "../types";
import { GLOB_YAML } from "../globs";

import { interopDefault } from "../utils";

/**
 * 通过 `eslint-plugin-yml` 校验 YAML 配置，并附带对 pnpm-workspace.yaml 的排序规则。
 */
export async function yaml(options: OptionsOverrides & OptionsStylistic & OptionsFiles = {}): Promise<TypedFlatConfigItem[]> {
  const { files = [GLOB_YAML], overrides = {}, stylistic = true } = options;

  const { indent = 2, quotes = "double" } = typeof stylistic === "boolean" ? {} : stylistic;

  const [pluginYaml, parserYaml] = await Promise.all([interopDefault(import("eslint-plugin-yml")), interopDefault(import("yaml-eslint-parser"))] as const);

  return [
    {
      name: "senran/yaml/setup",
      plugins: {
        yaml: pluginYaml,
      },
    },
    {
      files,
      languageOptions: {
        parser: parserYaml,
      },
      name: "senran/yaml/rules",
      rules: {
        // --- YAML 语法与语义校验 ---
        "style/spaced-comment": "off",

        "yaml/block-mapping": "error", // 块映射缩进正确
        "yaml/block-sequence": "error", // 列表缩进正确
        "yaml/no-empty-key": "error", // 键不能为空
        "yaml/no-empty-sequence-entry": "error", // 列表项不能为空
        "yaml/no-irregular-whitespace": "error", // 禁止异常空白
        "yaml/plain-scalar": "error", // 标量使用正确类型

        "yaml/vue-custom-block/no-parsing-error": "error", // Vue YAML 块解析正常

        ...(stylistic
          ? {
              // --- 可选：块/缩进/引号等风格约束 ---
              "yaml/block-mapping-question-indicator-newline": "error", // ? 指示符换行
              "yaml/block-sequence-hyphen-indicator-newline": "error", // - 指示符换行
              "yaml/flow-mapping-curly-newline": "error", // flow map 换行
              "yaml/flow-mapping-curly-spacing": "error", // flow map 花括号空格
              "yaml/flow-sequence-bracket-newline": "error", // flow 列表换行
              "yaml/flow-sequence-bracket-spacing": "error", // flow 列表空格
              "yaml/indent": ["error", indent === "tab" ? 2 : indent], // 缩进
              "yaml/key-spacing": "error", // key 与值之间空格
              "yaml/no-tab-indent": "error", // 禁用 tab 缩进
              "yaml/quotes": ["error", { avoidEscape: true, prefer: quotes === "backtick" ? "single" : quotes }], // 引号风格
              "yaml/spaced-comment": "error", // 注释前留空格
            }
          : {}),

        ...overrides,
      },
    },
    {
      files: ["pnpm-workspace.yaml"],
      name: "senran/yaml/pnpm-workspace",
      rules: {
        // --- pnpm-workspace.yaml 特定字段顺序 ---
        "yaml/sort-keys": [
          "error",
          {
            order: [
              "packages",
              "overrides",
              "patchedDependencies",
              "hoistPattern",
              "catalog",
              "catalogs",

              "allowedDeprecatedVersions",
              "allowNonAppliedPatches",
              "configDependencies",
              "ignoredBuiltDependencies",
              "ignoredOptionalDependencies",
              "neverBuiltDependencies",
              "onlyBuiltDependencies",
              "onlyBuiltDependenciesFile",
              "packageExtensions",
              "peerDependencyRules",
              "supportedArchitectures",
            ],
            pathPattern: "^$",
          },
          {
            order: { type: "asc" },
            pathPattern: ".*",
          },
        ], // pnpm-workspace 中所有键排序
      },
    },
  ];
}
