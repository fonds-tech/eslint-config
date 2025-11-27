import type { VendoredPrettierOptions, VendoredPrettierRuleOptions } from "../vender/prettier-types"
import type { StylisticConfig, OptionsFormatters, TypedFlatConfigItem } from "../types"
import process from "node:process"
import vueParser from "vue-eslint-parser"
import { isPackageExists } from "local-pkg"
import { StylisticConfigDefaults } from "./stylistic"
import { parserPlain, ensurePackages, interopDefault, isPackageInScope } from "../utils"
import { GLOB_CSS, GLOB_SVG, GLOB_VUE, GLOB_XML, GLOB_HTML, GLOB_LESS, GLOB_SCSS, GLOB_ASTRO, GLOB_GRAPHQL, GLOB_POSTCSS, GLOB_ASTRO_TS, GLOB_MARKDOWN } from "../globs"

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
  "vue",
]

const VUE_PRETTIER_CONFLICT_RULES = [
  "style/quotes",
  "vue/html-indent",
  "vue/html-closing-bracket-newline",
  "vue/html-closing-bracket-spacing",
  "vue/html-quotes",
  "vue/multiline-html-element-content-newline",
  "vue/singleline-html-element-content-newline",
  "vue/no-multi-spaces",
  "vue/mustache-interpolation-spacing",
  "vue/attribute-hyphenation",
  "vue/v-bind-style",
  "vue/v-on-style",
  "vue/this-in-template",
  "vue/component-name-in-template-casing",
  "vue/custom-event-name-casing",
]

const vuePrettierRuleOffs = Object.fromEntries(
  VUE_PRETTIER_CONFLICT_RULES.map(rule => [rule, "off"] as const),
) as Record<string, "off">

async function loadPrettierConfig(): Promise<VendoredPrettierOptions | undefined> {
  try {
    // 动态加载，避免在未安装 Prettier 时直接报错
    const prettier = await import("prettier")
    if (typeof prettier.resolveConfig !== "function")
      return undefined

    const resolved = await prettier.resolveConfig(process.cwd())
    if (!resolved)
      return undefined

    return resolved as VendoredPrettierOptions
  }
  catch {
    // 缺少依赖或解析失败时静默降级
    return undefined
  }
}

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
    vue: true,
    xml: isPrettierPluginXmlInScope,
  }

  if (options === true)
    return resolvedDefaults

  const hasToggleOverride = formatterToggleKeys.some(key => key in options)

  if (hasToggleOverride)
    return options

  return {
    ...resolvedDefaults,
    ...options,
  }
}

export async function formatters(
  options: OptionsFormatters | true = {},
  stylistic: StylisticConfig = {},
): Promise<TypedFlatConfigItem[]> {
  const resolvedOptions = resolveFormatterOptions(options)

  const {
    indent,
    quotes,
    semi,
  } = {
    ...StylisticConfigDefaults,
    ...stylistic,
  }

  const prettierInput = "prettier" in resolvedOptions
    ? resolvedOptions.prettier
    : true

  const prettierEnabled = prettierInput !== false
  const prettierOverrides = prettierEnabled && typeof prettierInput === "object"
    ? (() => {
        const { useLocalPrettierConfig, ...rest } = prettierInput
        return rest
      })()
    : {}
  const usePrettierConfig = prettierEnabled && typeof prettierInput === "object"
    ? prettierInput.useLocalPrettierConfig ?? false
    : false

  const prettierOptions: VendoredPrettierOptions = prettierEnabled
    ? Object.assign(
      {
        endOfLine: "auto",
        printWidth: 160,
        semi,
        singleQuote: quotes === "single",
        tabWidth: typeof indent === "number" ? indent : 2,
        trailingComma: "all",
        useTabs: indent === "tab",
      } satisfies VendoredPrettierOptions,
      usePrettierConfig ? await loadPrettierConfig() : {},
      prettierOverrides,
      )
    : {
        endOfLine: "auto",
        printWidth: 160,
        semi,
        singleQuote: quotes === "single",
        tabWidth: typeof indent === "number" ? indent : 2,
        trailingComma: "all",
        useTabs: indent === "tab",
      }

  const prettierXmlOptions: VendoredPrettierOptions = {
    xmlQuoteAttributes: "double",
    xmlSelfClosingSpace: true,
    xmlSortAttributesByKey: false,
    xmlWhitespaceSensitivity: "ignore",
  }

  const dprintOptions = Object.assign(
    {
      indentWidth: typeof indent === "number" ? indent : 2,
      quoteStyle: quotes === "single" ? "preferSingle" : "preferDouble",
      useTabs: indent === "tab",
    },
    resolvedOptions.dprintOptions || {},
  )

  if (resolvedOptions.slidev && resolvedOptions.markdown !== true && resolvedOptions.markdown !== "prettier")
    throw new Error("`slidev` option only works when `markdown` is enabled with `prettier`")

  if (!prettierEnabled) {
    const prettierRequired = [
      resolvedOptions.css,
      resolvedOptions.html,
      resolvedOptions.vue,
      resolvedOptions.xml,
      resolvedOptions.svg,
      resolvedOptions.astro,
      resolvedOptions.graphql,
      resolvedOptions.markdown === true || resolvedOptions.markdown === "prettier" || resolvedOptions.markdown === undefined,
      resolvedOptions.slidev,
    ].some(Boolean)

    if (prettierRequired)
      throw new Error("Prettier 已被禁用，但当前 formatters 配置仍依赖 Prettier，请关闭相关语言或开启 `prettier`")
  }

  await ensurePackages([
    "eslint-plugin-format",
    prettierEnabled ? "prettier" : undefined,
    prettierEnabled && resolvedOptions.markdown && resolvedOptions.slidev ? "prettier-plugin-slidev" : undefined,
    prettierEnabled && resolvedOptions.astro ? "prettier-plugin-astro" : undefined,
    prettierEnabled && (resolvedOptions.xml || resolvedOptions.svg) ? "@prettier/plugin-xml" : undefined,
  ])

  const pluginFormat = await interopDefault(import("eslint-plugin-format"))

  const configs: TypedFlatConfigItem[] = [
    {
      name: "fonds/formatter/setup",
      plugins: {
        format: pluginFormat,
      },
    },
  ]

  if (resolvedOptions.css && prettierEnabled) {
    configs.push(
      {
        files: [GLOB_CSS, GLOB_POSTCSS],
        languageOptions: {
          parser: parserPlain,
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

  if (resolvedOptions.html && prettierEnabled) {
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

  if (resolvedOptions.vue && prettierEnabled) {
    configs.push({
      files: [GLOB_VUE],
      languageOptions: {
        parser: vueParser,
      },
      name: "fonds/formatter/vue",
      rules: {
        "format/prettier": [
          "error",
          mergePrettierOptions(prettierOptions, {
            parser: "vue",
          }),
        ],
        // 在 formatter 规则下关闭需要类型信息的 TS 规则，避免 parser 切换为 parser-plain 时抛错
        "ts/consistent-type-imports": "off",
        // 避免与 Prettier 的换行/缩进/引号冲突
        ...vuePrettierRuleOffs,
      },
    })
  }

  if (resolvedOptions.xml && prettierEnabled) {
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
  if (resolvedOptions.svg && prettierEnabled) {
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

  if (resolvedOptions.markdown) {
    const formater = resolvedOptions.markdown === true
      ? "prettier"
      : resolvedOptions.markdown

    if (formater === "prettier" && !prettierEnabled)
      throw new Error("Markdown 格式化需要 Prettier，但当前 `prettier` 为 false")

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
                embeddedLanguageFormatting: "off",
                parser: "markdown",
              })
            : {
                ...dprintOptions,
                language: "markdown",
              },
        ],
      },
    })

    if (resolvedOptions.slidev && prettierEnabled) {
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

  if (resolvedOptions.astro && prettierEnabled) {
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

  if (resolvedOptions.graphql && prettierEnabled) {
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
