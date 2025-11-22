import type { OptionsConfig, TypedFlatConfigItem } from "../src"
import fs from "node:fs/promises"
import { join, resolve } from "node:path"
import { fonds } from "../src"
import { ESLint } from "eslint"
import { it, expect, afterAll, describe, beforeAll } from "vitest"

// 类型别名定义
type FondsFlatOptions = OptionsConfig & Omit<TypedFlatConfigItem, "files">

// 定义测试夹具目录路径
const FIXTURE_DIR = resolve(__dirname, "..", "_fixtures_next")
// 定义模拟的 Next.js pages 目录
const PAGES_DIR = join(FIXTURE_DIR, "pages")

describe("next.js 规则", () => {
  // 在所有测试开始前执行初始化操作
  beforeAll(async () => {
    // 清理可能存在的旧 fixture 目录
    await fs.rm(FIXTURE_DIR, { recursive: true, force: true })
    // 创建新的 fixture 目录结构，包括 pages 子目录
    await fs.mkdir(PAGES_DIR, { recursive: true })
  })

  // 在所有测试结束后清理现场
  afterAll(async () => {
    await fs.rm(FIXTURE_DIR, { recursive: true, force: true })
  })

  // 创建 ESLint 实例的辅助函数
  const createESLint = async (options?: FondsFlatOptions) => {
    // 基础配置：显式开启 nextjs 支持
    const baseOptions = {
      nextjs: true,
      typescript: true,
      stylistic: false,
      formatters: false,
    } satisfies FondsFlatOptions

    // 生成 ESLint 配置
    const configs = await fonds({
      ...baseOptions,
      ...(options ?? {}),
    } as FondsFlatOptions)

    // 初始化 ESLint
    return new ESLint({
      overrideConfigFile: true,
      overrideConfig: configs as any,
      // 关键点：设置 cwd 为我们的 fixture 目录
      // 这是因为 Next.js 的 ESLint 插件通常需要依据项目根目录来查找 pages 或 app 目录结构
      // 从而判断哪些文件是页面组件，进而应用特定的规则
      cwd: FIXTURE_DIR,
    })
  }

  it("应验证 Next.js 特定规则", async () => {
    // 获取 ESLint 实例
    const eslint = await createESLint()

    // 构造一段测试代码：
    // 使用了原生的 <img> 标签而不是 Next.js 的 <Image> 组件
    // Next.js 推荐使用 next/image 进行图片优化，因此这应该触发警告或错误
    const code = `
export default function Page() {
  return <img src="/foo.png" alt="foo" />
}
`
    // 定义文件路径，模拟这是一个 Next.js 的页面文件
    const filePath = join(PAGES_DIR, "index.tsx")

    // 在 fixture 目录中创建一个假的 package.json
    // 包含 next 依赖。某些 Next.js 相关的 ESLint 规则或插件初始化逻辑会检查 package.json 是否存在以及是否安装了 next
    await fs.writeFile(join(FIXTURE_DIR, "package.json"), JSON.stringify({ dependencies: { next: "12.0.0" } }))

    // 将测试代码写入文件
    await fs.writeFile(filePath, code)

    // 对该文件执行 Lint 检查
    const results = await eslint.lintFiles([filePath])

    // 筛选错误信息
    // 注意：这里的规则 ID 检查兼容了两种情况：
    // 1. "@next/next/no-img-element": 原始插件规则名
    // 2. "next/no-img-element": 如果我们的配置工厂启用了插件重命名 (autoRenamePlugins: true)，可能会被重命名为 next 前缀
    const errors = results[0].messages.filter(msg =>
      msg.ruleId === "@next/next/no-img-element" || msg.ruleId === "next/no-img-element",
    )

    // 断言：应该检测到至少一个关于使用原生 img 标签的错误
    expect(errors.length).toBeGreaterThan(0)
  })
})
