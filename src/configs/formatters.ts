import type { VendoredPrettierOptions, VendoredPrettierRuleOptions } from "../vender/prettier-types"
import type { StylisticConfig, OptionsFormatters, TypedFlatConfigItem } from "../types"
import { isPackageExists } from "local-pkg"
import { StylisticConfigDefaults } from "./stylistic"
import { parserPlain, ensurePackages, interopDefault, isPackageInScope } from "../utils"
import { GLOB_CSS, GLOB_SVG, GLOB_XML, GLOB_HTML, GLOB_LESS, GLOB_SCSS, GLOB_ASTRO, GLOB_GRAPHQL, GLOB_POSTCSS, GLOB_ASTRO_TS, GLOB_MARKDOWN } from "../globs"

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
    resolvedOptions.prettierOptions || {},
  )

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

  const pluginFormat = await interopDefault(import("eslint-plugin-format"))

  const configs: TypedFlatConfigItem[] = [
    {
      name: "fonds/formatter/setup",
      plugins: {
        format: pluginFormat,
      },
    },
  ]

  if (resolvedOptions.css) {
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
