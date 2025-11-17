/**
 * Markdown 配置模块
 * 为 Markdown 文件及其代码块配置 ESLint 检查
 */

import type { OptionsFiles, OptionsOverrides, TypedFlatConfigItem, OptionsComponentExts } from "../types";

import { parserPlain, interopDefault } from "../utils";
import { mergeProcessors, processorPassThrough } from "eslint-merge-processors";
import { GLOB_MARKDOWN, GLOB_MARKDOWN_CODE, GLOB_MARKDOWN_IN_MARKDOWN } from "../globs";

/**
 * 为 Markdown 文件及其中的代码块提供解析、禁用和规则控制，支持扩展自定义组件后缀。
 */
export async function markdown(options: OptionsFiles & OptionsComponentExts & OptionsOverrides = {}): Promise<TypedFlatConfigItem[]> {
  const { componentExts = [], files = [GLOB_MARKDOWN], overrides = {} } = options;

  const markdown = await interopDefault(import("@eslint/markdown"));

  return [
    {
      name: "senran/markdown/setup",
      plugins: {
        markdown,
      },
    },
    {
      files,
      ignores: [GLOB_MARKDOWN_IN_MARKDOWN, "src/rules/**/*.md"],
      name: "senran/markdown/processor",
      // `eslint-plugin-markdown` 只会为代码块生成虚拟文件，不会处理 Markdown 本身；借助 mergeProcessors 再挂一个透传处理器让 Markdown 文件也能进入 ESLint。
      processor: mergeProcessors([markdown.processors!.markdown, processorPassThrough]),
    },
    {
      files,
      ignores: [GLOB_MARKDOWN_IN_MARKDOWN, "src/rules/**/*.md"],
      languageOptions: {
        parser: parserPlain,
      },
      name: "senran/markdown/parser",
    },
    {
      files: [GLOB_MARKDOWN_CODE, ...componentExts.map(ext => `${GLOB_MARKDOWN}/**/*.${ext}`)],
      ignores: ["src/rules/**/*.md/**"],
      languageOptions: {
        parserOptions: {
          ecmaFeatures: {
            impliedStrict: true,
          },
        },
      },
      name: "senran/markdown/disables",
      rules: {
        // --- Markdown 代码块中允许使用 demo 型写法，放宽大部分语法限制 ---
        "no-alert": "off", // 示例代码允许 alert
        "no-console": "off", // 允许 console
        "no-labels": "off", // 可以展示 label 用法
        "no-lone-blocks": "off", // 允许裸代码块
        "no-restricted-syntax": "off", // 放宽语法限制
        "no-undef": "off", // demo 可引用未定义变量
        "no-unused-expressions": "off", // 允许表达式示例
        "no-unused-labels": "off", // label 示例可保留
        "no-unused-vars": "off", // demo 变量不必使用

        "node/prefer-global/process": "off", // Markdown 中可直接使用 process

        "style/comma-dangle": "off", // 不与示例冲突
        "style/eol-last": "off", // Markdown 虚拟文件无需强制换行
        "style/padding-line-between-statements": "off", // 允许紧凑示例

        "ts/consistent-type-imports": "off", // 允许展示多种写法
        "ts/explicit-function-return-type": "off", // 简化 demo
        "ts/no-namespace": "off", // 可展示 namespace
        "ts/no-redeclare": "off", // demo 可重复声明
        "ts/no-require-imports": "off", // 允许 require 示例
        "ts/no-unused-expressions": "off", // TS 表达式示例
        "ts/no-unused-vars": "off", // TS demo 变量可未使用
        "ts/no-use-before-define": "off", // TS demo 可先用后定义

        "unicode-bom": "off", // 忽略 BOM
        "unused-imports/no-unused-imports": "off", // 允许未使用 import
        "unused-imports/no-unused-vars": "off", // 允许未使用变量

        ...overrides,
      },
    },
  ];
}
