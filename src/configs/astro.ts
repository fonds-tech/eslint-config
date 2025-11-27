import type { OptionsFiles, OptionsOverrides, OptionsStylistic, TypedFlatConfigItem } from "../types"

import { GLOB_ASTRO } from "../globs"
import { interopDefault } from "../utils"

/**
 * Astro 配置。
 * 支持 Astro 组件的解析和 Lint。
 */
export async function astro(
  options: OptionsOverrides & OptionsStylistic & OptionsFiles = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    files = [GLOB_ASTRO],
    overrides = {},
    stylistic = true,
  } = options

  const [
    pluginAstro,
    parserAstro,
    parserTs,
  ] = await Promise.all([
    interopDefault(import("eslint-plugin-astro")),
    interopDefault(import("astro-eslint-parser")),
    interopDefault(import("@typescript-eslint/parser")),
  ] as const)

  return [
    {
      name: "fonds/astro/setup",
      plugins: {
        astro: pluginAstro,
      },
    },
    {
      files,
      languageOptions: {
        globals: pluginAstro.environments.astro.globals,
        parser: parserAstro,
        parserOptions: {
          extraFileExtensions: [".astro"],
          parser: parserTs, // 使用 TS 解析器处理脚本部分
        },
        sourceType: "module",
      },
      name: "fonds/astro/rules",
      processor: "astro/client-side-ts", // 处理客户端脚本
      rules: {
        // === Astro 推荐规则 ===
        "astro/missing-client-only-directive-value": "error", // client:only 指令必须有值

        "astro/no-conflict-set-directives": "error", // 禁止冲突的 set 指令
        "astro/no-deprecated-astro-canonicalurl": "error", // 禁止废弃 API
        "astro/no-deprecated-astro-fetchcontent": "error",
        "astro/no-deprecated-astro-resolve": "error",
        "astro/no-deprecated-getentrybyslug": "error",
        "astro/no-set-html-directive": "off", // 允许 set:html
        "astro/no-unused-define-vars-in-style": "error", // 检查 style 中未使用的 define:vars
        "astro/semi": "off",
        "astro/valid-compile": "error", // 确保代码可编译

        // Astro 允许在 Frontmatter 中使用顶层 await (例如数据获取)
        // https://docs.astro.build/en/guides/data-fetching/#fetch-in-astro
        "fonds/no-top-level-await": "off",

        ...stylistic
          ? {
              "style/indent": "off",
              "style/jsx-closing-tag-location": "off",
              "style/jsx-one-expression-per-line": "off",
              "style/no-multiple-empty-lines": "off",
            }
          : {},

        ...overrides,
      },
    },
  ]
}
