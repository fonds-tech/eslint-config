import { formatters } from "../src/configs/formatters"
import { it, vi, expect, afterAll, describe, afterEach, beforeAll } from "vitest"

const originalCI = process.env.CI

beforeAll(() => {
  // 避免 ensurePackages 在测试中触发交互安装
  process.env.CI = "1"
})

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

afterAll(() => {
  process.env.CI = originalCI
})

describe("formatters / Prettier 行为", () => {
  it("默认（不读取本地配置）仍生成 Prettier 规则", async () => {
    const configs = await formatters({
      prettier: true,
      css: true,
      html: false,
      vue: false,
      xml: false,
      svg: false,
      astro: false,
      graphql: false,
      markdown: false,
    })

    const cssConfig = configs.find(item => item.name === "fonds/formatter/css")
    expect(cssConfig?.rules?.["format/prettier"]).toBeTruthy()
  })

  it("useLocalPrettierConfig=true 时合并本地配置（mock resolveConfig）", async () => {
    const mockConfig = { printWidth: 99, singleQuote: true }
    vi.doMock("prettier", () => ({
      resolveConfig: vi.fn().mockResolvedValue(mockConfig),
    }))
    const { formatters: formattersWithMock } = await import("../src/configs/formatters")

    const configs = await formattersWithMock({
      prettier: {
        useLocalPrettierConfig: true,
      },
      css: true,
      html: false,
      vue: false,
      xml: false,
      svg: false,
      astro: false,
      graphql: false,
      markdown: false,
    })

    const cssRule = configs.find(item => item.name === "fonds/formatter/css")?.rules?.["format/prettier"] as any[]
    const options = cssRule?.[1]
    expect(options?.printWidth).toBe(99)
    expect(options?.singleQuote).toBe(true)
  })

  it("prettier=false 且仍启用依赖 Prettier 的语言会报错", async () => {
    await expect(() => formatters({
      prettier: false,
      css: true,
      markdown: true,
    })).rejects.toThrow(/Prettier 已被禁用/)
  })

  it("markdown 使用 dprint 时可在 prettier=false 下工作", async () => {
    const configs = await formatters({
      prettier: false,
      markdown: "dprint",
    })
    const mdRule = configs.find(item => item.name === "fonds/formatter/markdown")?.rules?.["format/dprint"]
    expect(mdRule).toBeTruthy()
  })

  it("prettier 对象覆盖默认值", async () => {
    const configs = await formatters({
      prettier: {
        printWidth: 80,
        semi: true,
        useLocalPrettierConfig: true,
      },
      css: true,
      markdown: false,
      html: false,
      vue: false,
      astro: false,
      graphql: false,
      xml: false,
      svg: false,
    })
    const cssRule = configs.find(item => item.name === "fonds/formatter/css")?.rules?.["format/prettier"] as any[]
    const options = cssRule?.[1]
    expect(options?.printWidth).toBe(80)
    expect(options?.semi).toBe(true)
  })
})
