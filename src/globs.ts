/**
 * 全局文件匹配模式 (Globs) 定义
 * 用于在 ESLint 配置中指定规则生效的文件范围。
 */

// === 核心源代码 ===
// 匹配 JS/TS 及其变体 (cjs, mjs, jsx, tsx)
// ?([cm]) 表示匹配 'c', 'm' 或者空字符串，从而覆盖 .js, .cjs, .mjs
export const GLOB_SRC_EXT = "?([cm])[jt]s?(x)"
export const GLOB_SRC = "**/*.?([cm])[jt]s?(x)"

// 具体语言的匹配模式
export const GLOB_JS = "**/*.?([cm])js"
export const GLOB_JSX = "**/*.?([cm])jsx"
export const GLOB_TS = "**/*.?([cm])ts"
export const GLOB_TSX = "**/*.?([cm])tsx"

// === 样式文件 ===
export const GLOB_STYLE = "**/*.{c,le,sc}ss"
export const GLOB_CSS = "**/*.css"
export const GLOB_POSTCSS = "**/*.{p,post}css"
export const GLOB_LESS = "**/*.less"
export const GLOB_SCSS = "**/*.scss"

// === 数据与配置文件 ===
export const GLOB_JSON = "**/*.json"
export const GLOB_JSON5 = "**/*.json5"
export const GLOB_JSONC = "**/*.jsonc"
export const GLOB_YAML = "**/*.y?(a)ml"
export const GLOB_TOML = "**/*.toml"
export const GLOB_XML = "**/*.xml"
export const GLOB_GRAPHQL = "**/*.{g,graph}ql"

// === 标记语言与框架 ===
export const GLOB_MARKDOWN = "**/*.md"
// 匹配 Markdown 文件中的内嵌代码块 (e.g. ```js ... ```)
export const GLOB_MARKDOWN_IN_MARKDOWN = "**/*.md/*.md"
export const GLOB_SVELTE = "**/*.svelte?(.{js,ts})"
export const GLOB_VUE = "**/*.vue"
export const GLOB_SVG = "**/*.svg"
export const GLOB_HTML = "**/*.htm?(l)"
export const GLOB_ASTRO = "**/*.astro"
export const GLOB_ASTRO_TS = "**/*.astro/*.ts"

// 特殊：Markdown 中的代码块，视为源代码处理
export const GLOB_MARKDOWN_CODE = `${GLOB_MARKDOWN}/${GLOB_SRC}`

// === 测试文件 ===
export const GLOB_TESTS = [
  `**/__tests__/**/*.${GLOB_SRC_EXT}`,
  `**/*.spec.${GLOB_SRC_EXT}`,
  `**/*.test.${GLOB_SRC_EXT}`,
  `**/*.bench.${GLOB_SRC_EXT}`,
  `**/*.benchmark.${GLOB_SRC_EXT}`,
]

// === 所有源码文件汇总 ===
export const GLOB_ALL_SRC = [
  GLOB_SRC,
  GLOB_STYLE,
  GLOB_JSON,
  GLOB_JSON5,
  GLOB_MARKDOWN,
  GLOB_SVELTE,
  GLOB_VUE,
  GLOB_YAML,
  GLOB_XML,
  GLOB_HTML,
]

// === 全局忽略文件 ===
// 这些目录或文件通常不需要进行 Lint 检查
export const GLOB_EXCLUDE = [
  "**/node_modules",
  "**/dist",
  "**/package-lock.json",
  "**/yarn.lock",
  "**/pnpm-lock.yaml",
  "**/bun.lockb",

  "**/output",
  "**/coverage",
  "**/temp",
  "**/.temp",
  "**/tmp",
  "**/.tmp",
  "**/.history",
  "**/.vitepress/cache",
  "**/.nuxt",
  "**/.next",
  "**/.svelte-kit",
  "**/.vercel",
  "**/.changeset",
  "**/.idea",
  "**/.cache",
  "**/.output",
  "**/.vite-inspect",
  "**/.yarn",
  "**/vite.config.*.timestamp-*",

  "**/CHANGELOG*.md",
  "**/*.min.*",
  "**/LICENSE*",
  "**/__snapshots__",
  "**/auto-import?(s).d.ts",
  "**/components.d.ts",
]
