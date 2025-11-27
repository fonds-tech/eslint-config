import type { VendoredPrettierOptions, VendoredPrettierRuleOptions } from "../vender/prettier-types"
import type { StylisticConfig, OptionsFormatters, TypedFlatConfigItem } from "../types"
import { isPackageExists } from "local-pkg"
import { StylisticConfigDefaults } from "./stylistic"
import { parserPlain, ensurePackages, interopDefault, isPackageInScope } from "../utils"
import { GLOB_CSS, GLOB_SVG, GLOB_XML, GLOB_HTML, GLOB_LESS, GLOB_SCSS, GLOB_ASTRO, GLOB_GRAPHQL, GLOB_POSTCSS, GLOB_ASTRO_TS, GLOB_MARKDOWN } from "../globs"

// 合并 Prettier 选项的辅助函数
function mergePrettierOptions(
  options: VendoredPrettierOptions,
  overrides: VendoredPrettierRuleOptions = {},
): VendoredPrettierRuleOptions {
  return {
    ...options,
    ...overrides,
    plugins: [
      ...(overrides.plugins || []),
      ...(options.plugins || []),
    ],
  }
}

const formatterToggleKeys: (keyof OptionsFormatters)[] = [
  "astro",
  "css",
  "graphql",
  "html",
  "markdown",
  "slidev",
  "svg",
  "xml",
]

// 解析格式化选项，自动检测依赖并设置默认值
// 如果用户传入 true，则尝试启用所有已安装依赖支持的格式化器
function resolveFormatterOptions(options: OptionsFormatters | true): OptionsFormatters {
  const isPrettierPluginXmlInScope = isPackageInScope("@prettier/plugin-xml")

  const resolvedDefaults: OptionsFormatters = {
    astro: isPackageInScope("prettier-plugin-astro"),
    css: true,
    graphql: true,
    html: true,
    markdown: true,
    slidev: isPackageExists("@slidev/cli"),
    svg: isPrettierPluginXmlInScope,
    xml: isPrettierPluginXmlInScope,
  }

  if (options === true)
    return resolvedDefaults

  // 如果用户显式指定了某些 toggle key (例如 { css: false })，直接返回用户配置
  const hasToggleOverride = formatterToggleKeys.some(key => key in options)

  if (hasToggleOverride)
    return options

  // 否则将用户配置与默认检测结果合并
  return {
    ...resolvedDefaults,
    ...options,
  }
}

/**
 * 格式化工具配置 (Formatters)。
 * 核心思想：使用 ESLint 运行 Prettier (通过 eslint-plugin-format)。
 *
 * 作用：
 * 1. 统一管理 ESLint 和 Prettier，无需单独的 .prettierrc
 * 2. 复用 ESLint 的 Ignore 逻辑
 * 3. 支持 CSS, HTML, Markdown, XML 等多种文件的格式化
 */
export async function formatters(
  options: OptionsFormatters | true = {},
  stylistic: StylisticConfig = {},
): Promise<TypedFlatConfigItem[]> {
  const resolvedOptions = resolveFormatterOptions(options)

  // 按需安装 Prettier 插件
  await ensurePackages([
    "eslint-plugin-format",
    resolvedOptions.markdown && resolvedOptions.slidev ? "prettier-plugin-slidev" : undefined,
    resolvedOptions.astro ? "prettier-plugin-astro" : undefined,
    (resolvedOptions.xml || resolvedOptions.svg) ? "@prettier/plugin-xml" : undefined,
  ])

  if (resolvedOptions.slidev && resolvedOptions.markdown !== true && resolvedOptions.markdown !== "prettier")
    throw new Error("`slidev` option only works when `markdown` is enabled with `prettier`")

  const {
    indent,
    quotes,
    semi,
  } = {
    ...StylisticConfigDefaults,
    ...stylistic,
  }

  // 将 ESLint 的 stylistic 选项转换为 Prettier 选项
  // 确保 ESLint 的代码风格规则与 Prettier 格式化结果一致，避免打架
  const prettierOptions: VendoredPrettierOptions = Object.assign(
    {
      endOfLine: "auto",
      printWidth: 160,
      semi,
      singleQuote: quotes === "single",
      tabWidth: typeof indent === "number" ? indent : 2,
      trailingComma: "all",
      useTabs: indent === "tab",
    } satisfies VendoredPrettierOptions,
    resolvedOptions.prettier || {},
  )

  // XML 特定的 Prettier 配置
  const prettierXmlOptions: VendoredPrettierOptions = {
    xmlQuoteAttributes: "double",
    xmlSelfClosingSpace: true,
    xmlSortAttributesByKey: false,
    xmlWhitespaceSensitivity: "ignore",
  }

  // 支持 dprint 作为 markdown 的替代格式化工具 (速度更快)
  const dprintOptions = Object.assign(
    {
      indentWidth: typeof indent === "number" ? indent : 2,
      quoteStyle: quotes === "single" ? "preferSingle" : "preferDouble",
      useTabs: indent === "tab",
    },
    resolvedOptions.dprintOptions || {},
  )

  const pluginFormat = await interopDefault(import("eslint-plugin-format"))

  const configs: TypedFlatConfigItem[] = [
    {
      name: "fonds/formatter/setup",
      plugins: {
        format: pluginFormat,
      },
    },
  ]

  // === CSS / SCSS / LESS ===
  if (resolvedOptions.css) {
    configs.push(
      {
        files: [GLOB_CSS, GLOB_POSTCSS],
        languageOptions: {
          parser: parserPlain, // 使用 Plain 解析器，仅读取内容
        },
        name: "fonds/formatter/css",
        rules: {
          "format/prettier": [
            "error",
            mergePrettierOptions(prettierOptions, {
              parser: "css",
            }),
          ],
        },
      },
      {
        files: [GLOB_SCSS],
        languageOptions: {
          parser: parserPlain,
        },
        name: "fonds/formatter/scss",
        rules: {
          "format/prettier": [
            "error",
            mergePrettierOptions(prettierOptions, {
              parser: "scss",
            }),
          ],
        },
      },
      {
        files: [GLOB_LESS],
        languageOptions: {
          parser: parserPlain,
        },
        name: "fonds/formatter/less",
        rules: {
          "format/prettier": [
            "error",
            mergePrettierOptions(prettierOptions, {
              parser: "less",
            }),
          ],
        },
      },
    )
  }

  // === HTML ===
  if (resolvedOptions.html) {
    configs.push({
      files: [GLOB_HTML],
      languageOptions: {
        parser: parserPlain,
      },
      name: "fonds/formatter/html",
      rules: {
        "format/prettier": [
          "error",
          mergePrettierOptions(prettierOptions, {
            parser: "html",
          }),
        ],
      },
    })
  }

  // === XML ===
  if (resolvedOptions.xml) {
    configs.push({
      files: [GLOB_XML],
      languageOptions: {
        parser: parserPlain,
      },
      name: "fonds/formatter/xml",
      rules: {
        "format/prettier": [
          "error",
          mergePrettierOptions({ ...prettierXmlOptions, ...prettierOptions }, {
            parser: "xml",
            plugins: [
              "@prettier/plugin-xml",
            ],
          }),
        ],
      },
    })
  }

  // === SVG ===
  if (resolvedOptions.svg) {
    configs.push({
      files: [GLOB_SVG],
      languageOptions: {
        parser: parserPlain,
      },
      name: "fonds/formatter/svg",
      rules: {
        "format/prettier": [
          "error",
          mergePrettierOptions({ ...prettierXmlOptions, ...prettierOptions }, {
            parser: "xml",
            plugins: [
              "@prettier/plugin-xml",
            ],
          }),
        ],
      },
    })
  }

  // === Markdown ===
  if (resolvedOptions.markdown) {
    const formater = resolvedOptions.markdown === true
      ? "prettier"
      : resolvedOptions.markdown

    const GLOB_SLIDEV = !resolvedOptions.slidev
      ? []
      : resolvedOptions.slidev === true
        ? ["**/slides.md"]
        : resolvedOptions.slidev.files

    configs.push({
      files: [GLOB_MARKDOWN],
      ignores: GLOB_SLIDEV,
      languageOptions: {
        parser: parserPlain,
      },
      name: "fonds/formatter/markdown",
      rules: {
        [`format/${formater}`]: [
          "error",
          formater === "prettier"
            ? mergePrettierOptions(prettierOptions, {
                embeddedLanguageFormatting: "off", // 禁用 Prettier 内嵌语言格式化，交由 ESLint 处理代码块
                parser: "markdown",
              })
            : {
                ...dprintOptions,
                language: "markdown",
              },
        ],
      },
    })

    // === Slidev (Slide Decks) ===
    if (resolvedOptions.slidev) {
      configs.push({
        files: GLOB_SLIDEV,
        languageOptions: {
          parser: parserPlain,
        },
        name: "fonds/formatter/slidev",
        rules: {
          "format/prettier": [
            "error",
            mergePrettierOptions(prettierOptions, {
              embeddedLanguageFormatting: "off",
              parser: "slidev",
              plugins: [
                "prettier-plugin-slidev",
              ],
            }),
          ],
        },
      })
    }
  }

  // === Astro ===
  if (resolvedOptions.astro) {
    configs.push({
      files: [GLOB_ASTRO],
      languageOptions: {
        parser: parserPlain,
      },
      name: "fonds/formatter/astro",
      rules: {
        "format/prettier": [
          "error",
          mergePrettierOptions(prettierOptions, {
            parser: "astro",
            plugins: [
              "prettier-plugin-astro",
            ],
          }),
        ],
      },
    })

    // 禁用与 Prettier 冲突的 Stylistic 规则
    // Astro 文件由 Prettier 接管格式化，ESLint 的格式规则可能会冲突
    configs.push({
      files: [GLOB_ASTRO, GLOB_ASTRO_TS],
      name: "fonds/formatter/astro/disables",
      rules: {
        "style/arrow-parens": "off",
        "style/block-spacing": "off",
        "style/comma-dangle": "off",
        "style/indent": "off",
        "style/no-multi-spaces": "off",
        "style/quotes": "off",
        "style/semi": "off",
      },
    })
  }

  // === GraphQL ===
  if (resolvedOptions.graphql) {
    configs.push({
      files: [GLOB_GRAPHQL],
      languageOptions: {
        parser: parserPlain,
      },
      name: "fonds/formatter/graphql",
      rules: {
        "format/prettier": [
          "error",
          mergePrettierOptions(prettierOptions, {
            parser: "graphql",
          }),
        ],
      },
    })
  }

  return configs
}
