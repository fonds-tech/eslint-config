import type { PromItem, FrameworkOption, ExtraLibrariesOption } from "./types"

import c from "ansis"

/**
 * 推荐的 VS Code 设置。
 * 核心策略：
 * 1. 禁用 Prettier 扩展的格式化功能，防止冲突。
 * 2. 启用 ESLint 插件的自动修复 (Auto Fix)。
 * 3. 将所有格式化规则 (style/*, format/*) 的严重等级在 IDE 中设为 off，但在保存时自动修复。
 *    这样做的好处是：代码写得乱一点不会满屏红线干扰视线，但保存时会自动变整齐。
 */
export const vscodeSettingsString = `
  // Disable the default formatter, use eslint instead
  "prettier.enable": false,
  "editor.formatOnSave": false,

  // Auto fix
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },

  // Silent the stylistic rules in your IDE, but still auto fix them
  "eslint.rules.customizations": [
    { "rule": "style/*", "severity": "off", "fixable": true },
    { "rule": "format/*", "severity": "off", "fixable": true },
    { "rule": "*-indent", "severity": "off", "fixable": true },
    { "rule": "*-spacing", "severity": "off", "fixable": true },
    { "rule": "*-spaces", "severity": "off", "fixable": true },
    { "rule": "*-order", "severity": "off", "fixable": true },
    { "rule": "*-dangle", "severity": "off", "fixable": true },
    { "rule": "*-newline", "severity": "off", "fixable": true },
    { "rule": "*quotes", "severity": "off", "fixable": true },
    { "rule": "*semi", "severity": "off", "fixable": true }
  ],

  // Enable eslint for all supported languages
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue",
    "html",
    "markdown",
    "json",
    "json5",
    "jsonc",
    "yaml",
    "toml",
    "xml",
    "gql",
    "graphql",
    "astro",
    "svelte",
    "css",
    "less",
    "scss",
    "pcss",
    "postcss"
  ]
`

export const frameworkOptions: PromItem<FrameworkOption>[] = [
  {
    label: c.green("Vue"),
    value: "vue",
  },
  {
    label: c.cyan("React"),
    value: "react",
  },
  {
    label: c.red("Svelte"),
    value: "svelte",
  },
  {
    label: c.magenta("Astro"),
    value: "astro",
  },
  {
    label: c.cyan("Solid"),
    value: "solid",
  },
  {
    label: c.blue("Slidev"),
    value: "slidev",
  },
]

export const frameworks: FrameworkOption[] = frameworkOptions.map(({ value }) => (value))

export const extraOptions: PromItem<ExtraLibrariesOption>[] = [
  {
    hint: "Use external formatters (Prettier and/or dprint) to format files that ESLint cannot handle yet (.css, .html, etc)",
    label: c.red("Formatter"),
    value: "formatter",
  },
  {
    label: c.cyan("UnoCSS"),
    value: "unocss",
  },
]

export const extra: ExtraLibrariesOption[] = extraOptions.map(({ value }) => (value))

// 依赖映射：根据用户选择的选项，自动安装所需的 ESLint 插件
export const dependenciesMap = {
  astro: [
    "eslint-plugin-astro",
    "astro-eslint-parser",
  ],
  formatter: [
    "eslint-plugin-format",
  ],
  formatterAstro: [
    "prettier-plugin-astro",
  ],
  nextjs: [
    "@next/eslint-plugin-next",
  ],
  react: [
    "@eslint-react/eslint-plugin",
    "eslint-plugin-react-hooks",
    "eslint-plugin-react-refresh",
  ],
  slidev: [
    "prettier-plugin-slidev",
  ],
  solid: [
    "eslint-plugin-solid",
  ],
  svelte: [
    "eslint-plugin-svelte",
    "svelte-eslint-parser",
  ],
  unocss: [
    "@unocss/eslint-plugin",
  ],
  vue: [],
} as const
