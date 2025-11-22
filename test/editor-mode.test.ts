import type { OptionsConfig, TypedFlatConfigItem } from "../src"
import { fonds } from "../src"
import { ESLint } from "eslint"
import { it, vi, expect, describe, afterEach } from "vitest"

type FondsFlatOptions = OptionsConfig & Omit<TypedFlatConfigItem, "files">

describe("编辑器模式", () => {
  // 保存原始环境变量，以便测试后恢复
  const originalEnv = process.env

  afterEach(() => {
    // 恢复环境变量，避免影响其他测试
    process.env = originalEnv
    // 恢复所有的 mock 函数
    vi.restoreAllMocks()
  })

  // 创建 ESLint 实例的辅助函数
  // isInEditor: 模拟是否在编辑器环境中
  const createESLint = async (isInEditor: boolean) => {
    const configs = await fonds({
      imports: true, // 启用 import 相关插件，它包含 unused-imports 规则
      typescript: true,
      isInEditor, // 将模拟的编辑器状态传入配置工厂
    } as FondsFlatOptions)

    return new ESLint({
      overrideConfigFile: true,
      overrideConfig: configs as any,
      fix: true, // 关键：开启 fix 模式，因为我们要测试自动修复功能是否被禁用
    })
  }

  it("非编辑器模式下应自动修复未使用的导入", async () => {
    // 模拟非编辑器环境 (命令行 CI/CD 等)
    const eslint = await createESLint(false)
    // 构造代码：包含一个未使用的导入
    const code = `
import { unused } from 'fs';
export const a = 1;
`
    // 执行 Lint
    const results = await eslint.lintText(code, { filePath: "test.ts" })

    // 检查 output 属性。如果 ESLint 进行了修复，output 将包含修复后的代码
    // 我们期望未使用的导入被自动删除
    expect(results[0].output).toBeDefined()
    expect(results[0].output).not.toContain("import { unused }")
  })

  it("编辑器模式下不应自动修复未使用的导入", async () => {
    // 模拟 VS Code 环境
    process.env.VSCODE_PID = "12345"

    // 创建实例，显式传入 isInEditor=true
    const eslint = await createESLint(true)
    const code = `
import { unused } from 'fs';
export const a = 1;
`
    // 执行 Lint
    const results = await eslint.lintText(code, { filePath: "test.ts" })

    // 核心逻辑：在编辑器模式下，为了避免打字时自动删除还没写完的 import 导致开发体验下降，
    // 我们期望禁用针对 unused-imports 的自动修复功能。

    // 首先，验证规则本身是否仍然工作（即依然报告错误/警告）
    const unusedImportErrors = results[0].messages.filter(m => m.ruleId === "unused-imports/no-unused-imports")
    expect(unusedImportErrors.length).toBeGreaterThan(0)

    // 然后，验证是否**没有**进行修复
    // 如果 results[0].output 为 undefined，说明没有进行任何修复，则直接使用原始 code
    // 我们期望最终代码中仍然包含 "import { unused }"
    const finalCode = results[0].output || code
    expect(finalCode).toContain("import { unused }")
  })
})
