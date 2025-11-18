import fs from 'node:fs/promises'
import { fonds } from '../src/factory'
import { Linter } from 'eslint'
import { flatConfigsToRulesDTS } from 'eslint-typegen/core'

// 强制使用 eslintrc 模式以便在 ESLint 9 flat config 下仍能读取内置规则
const builtinRules = new Linter({ configType: 'eslintrc' }).getRules()

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
  gitignore: true,
  svelte: true,
  typescript: {
    tsconfigPath: 'tsconfig.json',
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
  .prepend(
    {
      plugins: {
        '': {
          rules: Object.fromEntries(builtinRules.entries()),
        },
      },
    },
  )

const configNames = configs.map(i => i.name).filter(Boolean) as string[]

let dts = await flatConfigsToRulesDTS(configs, {
  includeAugmentation: false,
})

dts += `
// Names of all the configs
export type ConfigNames = ${configNames.map(i => `'${i}'`).join(' | ')}
`

await fs.writeFile('src/typegen.d.ts', dts)
