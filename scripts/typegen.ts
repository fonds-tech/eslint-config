import fs from "node:fs/promises"
import { fonds } from "../src/factory"
import { Linter } from "eslint"
import { flatConfigsToRulesDTS } from "eslint-typegen/core"

/**
 * 类型定义生成脚本。
 *
 * 目的：
 * 生成 `src/typegen.d.ts` 文件，其中包含所有已启用规则的类型定义。
 * 这使得用户在使用 vscode 等编辑器配置 eslint.config.ts 时，
 * 能够获得 rules 属性的智能提示和类型检查。
 */

// 实例化一个传统的 ESLint Linter (configType: "eslintrc")
// 目的：在 ESLint 9+ 的 Flat Config 模式下，获取所有内置规则的定义。
// Flat Config 默认不再直接暴露所有内置规则，因此需要这种变通方法。
const builtinRules = new Linter({ configType: "eslintrc" }).getRules()

// 创建一个包含所有特性的“全量”配置对象
// 这样做的目的是为了收集所有可能被使用的插件规则，生成最完整的类型定义。
const configs = await fonds({
  astro: true,
  formatters: true,
  imports: true,
  jsx: {
    a11y: true,
  },
  jsonc: true,
  markdown: true,
  nextjs: true,
  react: true,
  solid: true,
  pnpm: true,
  regexp: true,
  stylistic: true,
  gitignore: true, // 注意：gitignore 在类型生成中不贡献规则，但为了完整性保留
  svelte: true,
  typescript: {
    tsconfigPath: "tsconfig.json", // 模拟一个 tsconfig 路径以激活类型感知规则
    erasableOnly: true,
  },
  unicorn: true,
  unocss: true,
  vue: {
    a11y: true,
  },
  yaml: true,
  toml: true,
  test: true,
})
  // 将内置规则注入到配置列表的最前面
  // 插件名设为空字符串 ""，表示这是 ESLint 的核心规则
  .prepend(
    {
      plugins: {
        "": {
          rules: Object.fromEntries(builtinRules.entries()),
        },
      },
    },
  )

// 提取所有配置项的名称 (name 字段)
// 用于生成 ConfigNames 类型，方便调试和过滤配置
const configNames = configs.map(i => i.name).filter(Boolean) as string[]

// 使用 eslint-typegen 生成 .d.ts 内容
let dts = await flatConfigsToRulesDTS(configs, {
  includeAugmentation: false, // 不包含全局模块扩展，保持类型纯净
})

// 追加 ConfigNames 类型定义
dts += `
// Names of all the configs
export type ConfigNames = ${configNames.map(i => `'${i}'`).join(" | ")}
`

// 写入文件
await fs.writeFile("src/typegen.d.ts", dts)
