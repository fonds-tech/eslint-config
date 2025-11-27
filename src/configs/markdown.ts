import type { OptionsFiles, OptionsOverrides, TypedFlatConfigItem, OptionsComponentExts } from "../types"
import { parserPlain, interopDefault } from "../utils"
import { mergeProcessors, processorPassThrough } from "eslint-merge-processors"
import { GLOB_MARKDOWN, GLOB_MARKDOWN_CODE, GLOB_MARKDOWN_IN_MARKDOWN } from "../globs"

/**
 * Markdown 配置。
 * 包含 Markdown 文件的 Lint (如标题层级) 以及 Markdown 中代码块 (Code Blocks) 的 Lint。
 */
export async function markdown(
  options: OptionsFiles & OptionsComponentExts & OptionsOverrides = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    componentExts = [],
    files = [GLOB_MARKDOWN],
    overrides = {},
  } = options

  const markdown = await interopDefault(import("@eslint/markdown"))

  return [
    {
      name: "fonds/markdown/setup",
      plugins: {
        markdown,
      },
    },
    {
      files,
      ignores: [GLOB_MARKDOWN_IN_MARKDOWN],
      name: "fonds/markdown/processor",
      // 处理器逻辑：
      // `eslint-plugin-markdown` 默认只为代码块创建虚拟文件，而不处理 Markdown 文件本身。
      // 我们使用 `eslint-merge-processors` 添加一个透传处理器 (pass-through)，
      // 以便让 Markdown 文件本身也能被其他插件 (如 prettier 格式化插件) 处理。
      processor: mergeProcessors([
        markdown.processors!.markdown,
        processorPassThrough,
      ]),
    },
    {
      files,
      languageOptions: {
        parser: parserPlain,
      },
      name: "fonds/markdown/parser",
    },
    {
      // 针对 Markdown 内的代码块
      files: [
        GLOB_MARKDOWN_CODE,
        ...componentExts.map(ext => `${GLOB_MARKDOWN}/**/*.${ext}`),
      ],
      languageOptions: {
        parserOptions: {
          ecmaFeatures: {
            impliedStrict: true,
          },
        },
      },
      name: "fonds/markdown/disables",
      // 在代码片段中禁用部分规则
      // 因为文档中的代码片段通常是片段化的，不完整的，强制严格规则会导致大量误报。
      rules: {
        "fonds/no-top-level-await": "off",

        "no-alert": "off",
        "no-console": "off", // 示例代码常用 console
        "no-labels": "off",
        "no-lone-blocks": "off",
        "no-restricted-syntax": "off",
        "no-undef": "off", // 示例代码常引用未定义变量
        "no-unused-expressions": "off",
        "no-unused-labels": "off",
        "no-unused-vars": "off",

        "node/prefer-global/process": "off",

        "style/comma-dangle": "off",
        "style/eol-last": "off",
        "style/padding-line-between-statements": "off",

        "ts/consistent-type-imports": "off",
        "ts/explicit-function-return-type": "off",
        "ts/no-namespace": "off",
        "ts/no-redeclare": "off",
        "ts/no-require-imports": "off",
        "ts/no-unused-expressions": "off",
        "ts/no-unused-vars": "off",
        "ts/no-use-before-define": "off",

        "unicode-bom": "off",
        "unused-imports/no-unused-imports": "off",
        "unused-imports/no-unused-vars": "off",

        ...overrides,
      },
    },
  ]
}
