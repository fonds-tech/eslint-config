/**
 * 代码格式化器配置模块
 * 配置 ESLint 与代码格式化工具（Prettier、dprint 等）的集成
 */

import type { VendoredPrettierOptions, VendoredPrettierRuleOptions } from "../vender/prettier-types";
import type { StylisticConfig, OptionsFormatters, TypedFlatConfigItem } from "../types";
import { isPackageExists } from "local-pkg";
import { StylisticConfigDefaults } from "./stylistic";
import { parserPlain, ensurePackages, interopDefault, isPackageInScope } from "../utils";
import { GLOB_CSS, GLOB_SVG, GLOB_XML, GLOB_HTML, GLOB_LESS, GLOB_SCSS, GLOB_ASTRO, GLOB_GRAPHQL, GLOB_POSTCSS, GLOB_ASTRO_TS, GLOB_MARKDOWN } from "../globs";

/**
 * 将通用的 Prettier 选项与特定文件的覆盖项合并，确保插件数组被安全拼接。
 */
function mergePrettierOptions(options: VendoredPrettierOptions, overrides: VendoredPrettierRuleOptions = {}): VendoredPrettierRuleOptions {
  return {
    ...options,
    ...overrides,
    plugins: [...(overrides.plugins || []), ...(options.plugins || [])],
  };
}

/**
 * 统一在 ESLint 中调用 formatter 插件（Prettier 或 dprint），为样式、Markdown、Astro 等文件提供自动格式化能力。
 * 当 `options === true` 时会根据已安装依赖自动开启对应 formatter。
 */
export async function formatters(options: OptionsFormatters | true = {}, stylistic: StylisticConfig = {}): Promise<TypedFlatConfigItem[]> {
  // 帮用户自动根据依赖开启 formatter，减少显式配置成本
  if (options === true) {
    const isPrettierPluginXmlInScope = isPackageInScope("@prettier/plugin-xml");
    options = {
      astro: isPackageInScope("prettier-plugin-astro"),
      css: true,
      graphql: true,
      html: true,
      markdown: true,
      slidev: isPackageExists("@slidev/cli"),
      svg: isPrettierPluginXmlInScope,
      xml: isPrettierPluginXmlInScope,
    };
  }

  await ensurePackages([
    "eslint-plugin-format",
    options.markdown && options.slidev ? "prettier-plugin-slidev" : undefined,
    options.astro ? "prettier-plugin-astro" : undefined,
    options.xml || options.svg ? "@prettier/plugin-xml" : undefined,
  ]);

  if (options.slidev && options.markdown !== true && options.markdown !== "prettier") {
    throw new Error("`slidev` option only works when `markdown` is enabled with `prettier`");
  }

  const { indent, quotes, semi } = {
    ...StylisticConfigDefaults,
    ...stylistic,
  };

  const prettierOptions: VendoredPrettierOptions = Object.assign(
    {
      endOfLine: "auto",
      printWidth: 150,
      semi,
      singleQuote: quotes === "single",
      tabWidth: typeof indent === "number" ? indent : 2,
      trailingComma: "all",
      useTabs: indent === "tab",
    } satisfies VendoredPrettierOptions,
    options.prettierOptions || {},
  );

  const prettierXmlOptions: VendoredPrettierOptions = {
    xmlQuoteAttributes: "double",
    xmlSelfClosingSpace: true,
    xmlSortAttributesByKey: false,
    xmlWhitespaceSensitivity: "ignore",
  };

  const dprintOptions = Object.assign(
    {
      indentWidth: typeof indent === "number" ? indent : 2,
      quoteStyle: quotes === "single" ? "preferSingle" : "preferDouble",
      useTabs: indent === "tab",
    },
    options.dprintOptions || {},
  );

  const pluginFormat = await interopDefault(import("eslint-plugin-format"));

  const configs: TypedFlatConfigItem[] = [
    {
      name: "senran/formatter/setup",
      plugins: {
        format: pluginFormat,
      },
    },
  ];

  if (options.css) {
    configs.push(
      {
        files: [GLOB_CSS, GLOB_POSTCSS],
        languageOptions: {
          parser: parserPlain,
        },
        name: "senran/formatter/css",
        rules: {
          // --- 使用 Prettier 对 CSS/PostCSS 保持一致格式 ---
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
        name: "senran/formatter/scss",
        rules: {
          // --- SCSS 复用 Prettier 方案，兼容 mixin/变量 ---
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
        name: "senran/formatter/less",
        rules: {
          // --- Less 同样交给 Prettier 处理 ---
          "format/prettier": [
            "error",
            mergePrettierOptions(prettierOptions, {
              parser: "less",
            }),
          ],
        },
      },
    );
  }

  if (options.html) {
    configs.push({
      files: [GLOB_HTML],
      languageOptions: {
        parser: parserPlain,
      },
      name: "senran/formatter/html",
      rules: {
        // --- HTML 模板交给 Prettier，避免 AST 分析误判 ---
        "format/prettier": [
          "error",
          mergePrettierOptions(prettierOptions, {
            parser: "html",
          }),
        ],
      },
    });
  }

  if (options.xml) {
    configs.push({
      files: [GLOB_XML],
      languageOptions: {
        parser: parserPlain,
      },
      name: "senran/formatter/xml",
      rules: {
        // --- XML 通过官方插件来格式化 ---
        "format/prettier": [
          "error",
          mergePrettierOptions(
            { ...prettierXmlOptions, ...prettierOptions },
            {
              parser: "xml",
              plugins: ["@prettier/plugin-xml"],
            },
          ),
        ],
      },
    });
  }
  if (options.svg) {
    configs.push({
      files: [GLOB_SVG],
      languageOptions: {
        parser: parserPlain,
      },
      name: "senran/formatter/svg",
      rules: {
        // --- SVG 视作 XML 处理，应用同样的插件 ---
        "format/prettier": [
          "error",
          mergePrettierOptions(
            { ...prettierXmlOptions, ...prettierOptions },
            {
              parser: "xml",
              plugins: ["@prettier/plugin-xml"],
            },
          ),
        ],
      },
    });
  }

  if (options.markdown) {
    const formater = options.markdown === true ? "prettier" : options.markdown;

    const GLOB_SLIDEV = !options.slidev ? [] : options.slidev === true ? ["**/slides.md"] : options.slidev.files;

    configs.push({
      files: [GLOB_MARKDOWN],
      ignores: GLOB_SLIDEV,
      languageOptions: {
        parser: parserPlain,
      },
      name: "senran/formatter/markdown",
      rules: {
        // --- Markdown 默认交由 Prettier/dprint 处理，禁用嵌入语言自动格式 ---
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
    });

    if (options.slidev) {
      configs.push({
        files: GLOB_SLIDEV,
        languageOptions: {
          parser: parserPlain,
        },
        name: "senran/formatter/slidev",
        rules: {
        // --- Slidev 幻灯片启用专用 Prettier 插件 ---
          "format/prettier": [
            "error",
            mergePrettierOptions(prettierOptions, {
              embeddedLanguageFormatting: "off",
              parser: "slidev",
              plugins: ["prettier-plugin-slidev"],
            }),
          ],
        },
      });
    }
  }

  if (options.astro) {
    configs.push({
      files: [GLOB_ASTRO],
      languageOptions: {
        parser: parserPlain,
      },
      name: "senran/formatter/astro",
      rules: {
        // --- Astro SFC 由 Prettier + 插件格式化 ---
        "format/prettier": [
          "error",
          mergePrettierOptions(prettierOptions, {
            parser: "astro",
            plugins: ["prettier-plugin-astro"],
          }),
        ],
      },
    });

    configs.push({
      files: [GLOB_ASTRO, GLOB_ASTRO_TS],
      name: "senran/formatter/astro/disables",
      rules: {
        // --- 避免与 Astro SFC 中的模板格式互相冲突 ---
        "style/arrow-parens": "off", // 交由 Prettier 统一
        "style/block-spacing": "off", // 防止 ESLint 与 Prettier 打架
        "style/comma-dangle": "off", // 关闭尾随逗号校验
        "style/indent": "off", // 缩进由 Prettier 控制
        "style/no-multi-spaces": "off", // 保留 Prettier 输出
        "style/quotes": "off", // 引号风格交给 Prettier
        "style/semi": "off", // 分号风格交给 Prettier
      },
    });
  }

  if (options.graphql) {
    configs.push({
      files: [GLOB_GRAPHQL],
      languageOptions: {
        parser: parserPlain,
      },
      name: "senran/formatter/graphql",
      rules: {
        // --- GraphQL Schema/查询使用 Prettier ---
        "format/prettier": [
          "error",
          mergePrettierOptions(prettierOptions, {
            parser: "graphql",
          }),
        ],
      },
    });
  }

  return configs;
}
