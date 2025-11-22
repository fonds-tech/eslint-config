import type { OptionsConfig, TypedFlatConfigItem } from "../src"
import fs from "node:fs/promises"
import { join, resolve } from "node:path"
import { fonds } from "../src"
import { ESLint } from "eslint"
import { it, expect, afterAll, describe, beforeAll } from "vitest"

// 类型别名定义
type FondsFlatOptions = OptionsConfig & Omit<TypedFlatConfigItem, "files">

// 定义测试用的临时目录路径
const FIXTURE_DIR = resolve(__dirname, "..", "_fixtures_ts_type_aware")
// tsconfig.json 文件路径
const TSCONFIG_PATH = join(FIXTURE_DIR, "tsconfig.json")

describe("typeScript 类型感知规则", () => {
  // 测试前准备
  beforeAll(async () => {
    // 清理目录
    await fs.rm(FIXTURE_DIR, { recursive: true, force: true })
    // 创建目录
    await fs.mkdir(FIXTURE_DIR, { recursive: true })

    // 创建一个有效的 tsconfig.json 文件
    // 这是启用“类型感知 Linting” (Type-Aware Linting) 的关键
    // 只有存在 tsconfig.json，TypeScript ESLint 解析器才能构建项目的类型图
    await fs.writeFile(TSCONFIG_PATH, JSON.stringify({
      compilerOptions: {
        strict: true,
        target: "esnext",
        module: "esnext",
        moduleResolution: "bundler",
        skipLibCheck: true,
      },
      include: ["**/*.ts"], // 包含所有 ts 文件
    }))
  })

  // 测试后清理
  afterAll(async () => {
    await fs.rm(FIXTURE_DIR, { recursive: true, force: true })
  })

  // 创建 ESLint 实例的辅助函数
  const createESLint = async (options?: FondsFlatOptions) => {
    const configs = await fonds({
      typescript: {
        // 核心：将 tsconfigPath 指向我们刚刚创建的 tsconfig.json
        // 这会告诉配置工厂启用类型感知相关的规则集
        tsconfigPath: TSCONFIG_PATH,
      },
      ...options,
    } as FondsFlatOptions)

    return new ESLint({
      overrideConfigFile: true,
      overrideConfig: configs as any,
      cwd: FIXTURE_DIR, // 设置 cwd 确保相对路径解析正确
    })
  }

  it("应标记未处理的 Promise (类型感知规则)", async () => {
    const eslint = await createESLint()
    // 构造测试代码：
    // fetchData 返回一个 Promise
    // main 函数中调用了 fetchData 但没有 await，也没有 .then/.catch 处理
    // 这被称为 "Floating Promise"，容易导致未捕获的异步错误
    // 这是一个典型的需要类型信息才能检测到的问题（解析器需要知道 fetchData 返回的是 Promise 类型）
    const code = `
    async function fetchData() {
      return Promise.resolve();
    }
    
    function main() {
      fetchData(); // ts/no-floating-promises 应该标记此处
    }
    `
    const filePath = join(FIXTURE_DIR, "test-floating.ts")
    await fs.writeFile(filePath, code)

    // 执行 Lint
    const results = await eslint.lintFiles([filePath])

    // 验证是否触发了 ts/no-floating-promises 规则
    const floatingPromiseErrors = results[0].messages.filter(msg => msg.ruleId === "ts/no-floating-promises")
    expect(floatingPromiseErrors.length).toBeGreaterThan(0)
  })

  it("应标记对非 Thenable 对象的 await (类型感知规则)", async () => {
    const eslint = await createESLint()
    // 构造测试代码：
    // 变量 value 是一个数字 (number)
    // 可以在没有类型信息的情况下 await 任何东西（JS 语法允许），但这通常是无意义的逻辑错误
    // ts/await-thenable 规则利用类型信息检测这种无用的 await
    const code = `
    async function main() {
      const value = 42;
      await value; // ts/await-thenable 应该标记此处
    }
    `
    const filePath = join(FIXTURE_DIR, "test-await.ts")
    await fs.writeFile(filePath, code)

    // 执行 Lint
    const results = await eslint.lintFiles([filePath])

    // 验证是否触发了 ts/await-thenable 规则
    const awaitErrors = results[0].messages.filter(msg => msg.ruleId === "ts/await-thenable")
    expect(awaitErrors.length).toBeGreaterThan(0)
  })
})
