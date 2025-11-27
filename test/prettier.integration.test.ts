import fs from "node:fs/promises"
import { join, resolve } from "node:path"
import { glob } from "tinyglobby"
import { execa } from "execa"
import { it, expect, afterAll, describe, beforeAll } from "vitest"

const CASES = [
  {
    name: "prettier-local",
    inputDir: resolve("fixtures/prettier-local/input"),
    outputDir: resolve("fixtures/prettier-local/output"),
    eslintConfig: `// @eslint-disable
import fonds from '@fonds/eslint-config'

export default fonds({
  formatters: {
    prettier: {
      useLocalPrettierConfig: true,
      singleQuote: true,
      trailingComma: "all",
      printWidth: 60,
    },
    css: true,
    html: true,
    vue: true,
    markdown: true,
    graphql: true,
    astro: false,
    xml: false,
    svg: false,
  },
})
`,
  },
  {
    name: "prettier-default",
    inputDir: resolve("fixtures/prettier-local/input"),
    outputDir: resolve("fixtures/prettier-default/output"),
    eslintConfig: `// @eslint-disable
import fonds from '@fonds/eslint-config'

export default fonds({
  formatters: {
    prettier: {
      useLocalPrettierConfig: false,
    },
    css: true,
    html: true,
    vue: true,
    markdown: true,
    graphql: true,
    astro: false,
    xml: false,
    svg: false,
  },
})
`,
  },
]

const TARGET_ROOT = resolve("_tmp_prettier")
const originalCI = process.env.CI

describe("prettier 集成格式化（多语言）", () => {
  beforeAll(() => {
    process.env.CI = "1" // 避免 ensurePackages 交互
    return fs.rm(TARGET_ROOT, { recursive: true, force: true })
  })

  afterAll(() => {
    process.env.CI = originalCI
    return fs.rm(TARGET_ROOT, { recursive: true, force: true })
  })

  for (const testCase of CASES) {
    it(`${testCase.name} 格式化结果与快照一致`, async () => {
      const targetDir = join(TARGET_ROOT, testCase.name)
      await fs.rm(targetDir, { recursive: true, force: true })
      await fs.mkdir(targetDir, { recursive: true })
      await fs.cp(testCase.inputDir, targetDir, { recursive: true })
      await fs.writeFile(join(targetDir, "eslint.config.js"), testCase.eslintConfig)

      await execa("npx", ["eslint", ".", "--fix", "--no-warn-ignored"], {
        cwd: targetDir,
        stdio: "pipe",
      })

      const files = await glob("**/*", {
        cwd: testCase.outputDir,
        filesOnly: true,
      })

      for (const file of files) {
        const expected = await fs.readFile(join(testCase.outputDir, file), "utf8")
        const actual = await fs.readFile(join(targetDir, file), "utf8")
        expect(actual).toBe(expected)
      }

      await fs.rm(targetDir, { recursive: true, force: true })
    }, 120000)
  }
})
