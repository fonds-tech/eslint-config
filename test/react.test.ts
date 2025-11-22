import type { OptionsConfig, TypedFlatConfigItem } from "../src"
import { fonds } from "../src"
import { ESLint } from "eslint"
import { it, expect, describe } from "vitest"

// 定义配置项类型别名，组合了全局选项和扁平配置项（排除 files 属性）
type FondsFlatOptions = OptionsConfig & Omit<TypedFlatConfigItem, "files">

describe("react 规则", () => {
  // 创建 ESLint 实例的辅助函数
  // options: 可选的覆盖配置，用于测试特定场景
  const createESLint = async (options?: FondsFlatOptions) => {
    // 定义基础配置，启用 React 和 TypeScript，关闭格式化和样式规则以专注逻辑测试
    const baseOptions = {
      react: true,
      typescript: true,
      stylistic: false,
      formatters: false,
    } satisfies FondsFlatOptions

    // 使用项目提供的工厂函数 fonds 生成最终的 ESLint 配置数组
    const configs = await fonds({
      ...baseOptions,
      ...(options ?? {}),
    } as FondsFlatOptions)

    // 实例化 ESLint 类
    // overrideConfigFile: true 表示不读取文件系统上的配置文件，完全使用传入的配置
    // overrideConfig: 传入生成的配置数组
    return new ESLint({
      overrideConfigFile: true,
      overrideConfig: configs as any,
    })
  }

  it("应在 .tsx 中验证 React Hooks 规则", async () => {
    // 创建 ESLint 实例
    const eslint = await createESLint()
    // 构造一段测试代码：
    // 这里的 useState 和 useEffect 都是合法的导入
    // 但 useEffect 被包裹在 if (count > 0) 条件语句中，这违反了 React Hooks 的调用规则 (Hooks must be called at the top level)
    const code = `
import { useState, useEffect } from 'react';

export function Component() {
  const [count, setCount] = useState(0);

  if (count > 0) {
    useEffect(() => { // react-hooks/rules-of-hooks
      console.log('effect');
    }, []);
  }

  return <div onClick={() => setCount(c => c + 1)}>{count}</div>;
}
`
    // 对这段代码进行 Lint 检查，指定文件名为 test.tsx 以触发 React/TS 规则
    const results = await eslint.lintText(code, { filePath: "test.tsx" })
    // 筛选出规则 ID 为 "react-hooks/rules-of-hooks" 的错误消息
    const errors = results[0].messages.filter(msg => msg.ruleId === "react-hooks/rules-of-hooks")

    // 断言：应该至少发现一个违反 Hooks 规则的错误
    expect(errors.length).toBeGreaterThan(0)
  })

  it("应在 .tsx 中验证依赖项详尽性 (exhaustive-deps)", async () => {
    // 创建 ESLint 实例
    const eslint = await createESLint()
    // 构造一段测试代码：
    // 组件接收 props 'dep'
    // useEffect 内部使用了 'dep'
    // 但是依赖数组 [] 是空的，这违反了 react-hooks/exhaustive-deps 规则
    const code = `
import { useEffect } from 'react';

export function Component({ dep }) {
  useEffect(() => {
    console.log(dep);
  }, []); // react-hooks/exhaustive-deps
  return <div></div>;
}
`
    // 对代码进行 Lint 检查
    const results = await eslint.lintText(code, { filePath: "test.tsx" })
    // 筛选出规则 ID 为 "react-hooks/exhaustive-deps" 的警告消息
    const warnings = results[0].messages.filter(msg => msg.ruleId === "react-hooks/exhaustive-deps")

    // 断言：应该至少发现一个关于依赖项缺失的警告
    expect(warnings.length).toBeGreaterThan(0)
  })
})
