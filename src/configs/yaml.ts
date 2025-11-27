import type { OptionsFiles, OptionsOverrides, OptionsStylistic, TypedFlatConfigItem } from "../types"
import { GLOB_YAML } from "../globs"

import { interopDefault } from "../utils"

/**
 * YAML 配置。
 * 包含 YAML 格式化、结构检查以及针对 pnpm-workspace.yaml 的特殊排序规则。
 */
export async function yaml(
  options: OptionsOverrides & OptionsStylistic & OptionsFiles = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    files = [GLOB_YAML],
    overrides = {},
    stylistic = true,
  } = options

  const {
    indent = 2,
    quotes = "single",
  } = typeof stylistic === "boolean" ? {} : stylistic

  const [
    pluginYaml,
    parserYaml,
  ] = await Promise.all([
    interopDefault(import("eslint-plugin-yml")),
    interopDefault(import("yaml-eslint-parser")),
  ] as const)

  return [
    {
      name: "fonds/yaml/setup",
      plugins: {
        yaml: pluginYaml,
      },
    },
    {
      files,
      languageOptions: {
        parser: parserYaml,
      },
      name: "fonds/yaml/rules",
      rules: {
        "style/spaced-comment": "off",

        "yaml/block-mapping": "error", // 强制使用块级映射 (key: value) 而非 flow ({key: value})
        "yaml/block-sequence": "error", // 强制使用块级序列 (- item) 而非 flow ([item])
        "yaml/no-empty-key": "error", // 禁止空键
        "yaml/no-empty-sequence-entry": "error", // 禁止空序列项
        "yaml/no-irregular-whitespace": "error", // 禁止不规则空白
        "yaml/plain-scalar": "error", // 优先使用纯标量 (不带引号，除非包含特殊字符)

        "yaml/vue-custom-block/no-parsing-error": "error",

        // === 风格规则 ===
        ...stylistic
          ? {
              "yaml/block-mapping-question-indicator-newline": "error", // 问号指示符换行规范
              "yaml/block-sequence-hyphen-indicator-newline": "error", // 连字符后必须换行 (当包含映射时)
              "yaml/flow-mapping-curly-newline": "error", // Flow 映射大括号换行
              "yaml/flow-mapping-curly-spacing": "error", // Flow 映射大括号内空格
              "yaml/flow-sequence-bracket-newline": "error", // Flow 序列括号换行
              "yaml/flow-sequence-bracket-spacing": "error", // Flow 序列括号内空格
              "yaml/indent": ["error", indent === "tab" ? 2 : indent], // YAML 不支持 Tab 缩进，强制空格
              "yaml/key-spacing": "error", // 键值对间距
              "yaml/no-tab-indent": "error", // 禁止 Tab 缩进
              "yaml/quotes": ["error", { avoidEscape: true, prefer: quotes === "backtick" ? "single" : quotes }], // 引号风格
              "yaml/spaced-comment": "error", // 注释前要有空格
            }
          : {},

        ...overrides,
      },
    },
    {
      // pnpm-workspace.yaml 专用排序规则
      files: ["pnpm-workspace.yaml"],
      name: "fonds/yaml/pnpm-workspace",
      rules: {
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
        ],
      },
    },
  ]
}
