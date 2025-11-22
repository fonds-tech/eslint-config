import type { OptionsConfig, TypedFlatConfigItem } from "../src"
import fs from "node:fs/promises"
import { resolve } from "node:path"
import { fonds } from "../src"
import { ESLint } from "eslint"
import { it, expect, describe } from "vitest"

type FondsFlatOptions = OptionsConfig & Omit<TypedFlatConfigItem, "files">

describe("jSX 无障碍性 (a11y) 规则", () => {
  // 创建 ESLint 实例，默认开启 a11y
  const createESLint = async (options?: FondsFlatOptions) => {
    const baseOptions = {
      react: true,
      typescript: false,
      stylistic: false,
      formatters: false,
      jsx: {
        a11y: true, // 启用无障碍检查
      },
    } satisfies FondsFlatOptions

    const configs = await fonds({
      ...baseOptions,
      ...(options ?? {}),
    } as FondsFlatOptions)

    return new ESLint({
      overrideConfigFile: true,
      overrideConfig: configs as any,
    })
  }

  // 读取 fixture 文件的辅助函数
  const readFixture = async (filePath: string) => {
    const fullPath = resolve("fixtures", filePath)
    return await fs.readFile(fullPath, "utf-8")
  }

  it("应捕获无效的锚点链接 href", async () => {
    const eslint = await createESLint()
    // 读取一个包含无效 href（如 href="#" 或 href="javascript:void(0)"）的 JSX 文件
    const code = await readFixture("jsx-a11y-errors/invalid-anchor-href.jsx")

    // 执行 Lint
    const results = await eslint.lintText(code, { filePath: "test.jsx" })
    // 筛选所有 jsx-a11y 插件抛出的错误
    const errors = results[0].messages.filter(msg => msg.ruleId?.startsWith("jsx-a11y/"))

    // 断言：应检测到错误
    expect(errors.length).toBeGreaterThan(0)
  })

  it("如果未启用，应忽略 a11y 错误", async () => {
    // 显式禁用 a11y
    const eslint = await createESLint({ jsx: { a11y: false } })
    const code = await readFixture("jsx-a11y-errors/invalid-anchor-href.jsx")

    const results = await eslint.lintText(code, { filePath: "test.jsx" })
    const errors = results[0].messages.filter(msg => msg.ruleId?.startsWith("jsx-a11y/"))

    // 断言：即使代码有问题，但因为规则被禁用，所以不应报告错误
    expect(errors.length).toBe(0)
  })

  it("应允许有效且可访问的 JSX", async () => {
    const eslint = await createESLint()
    // 读取一个完全符合无障碍规范的 JSX 文件
    const code = await readFixture("jsx-a11y-valid/accessible-elements.jsx")

    const results = await eslint.lintText(code, { filePath: "test.jsx" })
    const a11yErrors = results[0].messages.filter(msg => msg.ruleId?.startsWith("jsx-a11y/"))

    // 断言：对于合规代码，不应报告错误
    expect(a11yErrors.length).toBe(0)
  })

  it("应遵循 ESLint 配置中的 a11y 覆盖设置", async () => {
    const code = await readFixture("jsx-a11y-errors/invalid-anchor-href.jsx")

    // 通过配置覆盖 (overrides) 手动关闭特定规则 'jsx-a11y/anchor-is-valid'
    const configs = await fonds({
      react: true,
      typescript: false,
      stylistic: false,
      formatters: false,
      jsx: {
        a11y: {
          overrides: {
            "jsx-a11y/anchor-is-valid": "off",
          },
        },
      },
    })

    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: configs as any,
    })

    const results = await eslint.lintText(code, { filePath: "test.jsx" })
    const anchorErrors = results[0].messages.filter(msg => msg.ruleId === "jsx-a11y/anchor-is-valid")

    // 断言：该特定规则已被关闭，因此不应报告错误
    expect(anchorErrors.length).toBe(0)
  })
})
