import type { OptionsConfig, TypedFlatConfigItem } from "../src/types"

import fs from "node:fs/promises"
import { join, resolve } from "node:path"

import { glob } from "tinyglobby"
import { execa } from "execa"
import { it, afterAll, beforeAll } from "vitest"

// 环境变量检测，Windows 系统下增加超时时间，因为文件系统操作可能较慢
const isWindows = process.platform === "win32"
const timeout = isWindows ? 300_000 : 60_000

// 全局前置钩子：清理测试用的临时输出目录
beforeAll(async () => {
  // 删除 _fixtures 目录，确保测试环境干净
  await fs.rm("_fixtures", { recursive: true, force: true })
})

// 全局后置钩子：测试结束后清理临时文件
afterAll(async () => {
  await fs.rm("_fixtures", { recursive: true, force: true })
})

// 注册测试用例：基础 JavaScript 配置
runWithConfig("js", {
  typescript: false,
  vue: false,
})

// 注册测试用例：全量配置 (开启所有主要特性)
runWithConfig("all", {
  typescript: true,
  vue: true,
  svelte: true,
  astro: true,
})

// 注册测试用例：禁用样式规则 (no-style)
runWithConfig("no-style", {
  typescript: true,
  vue: true,
  stylistic: false,
})

// 注册测试用例：自定义样式 (Tab 缩进和双引号)
runWithConfig(
  "tab-double-quotes",
  {
    typescript: true,
    vue: true,
    stylistic: {
      indent: "tab",
      quotes: "double",
    },
  },
  {
    rules: {
      // 关闭可能会与 tab 缩进冲突的规则
      "style/no-mixed-spaces-and-tabs": "off",
    },
  },
)

// 注册测试用例：TypeScript 规则覆盖
// 用于验证 GitHub Issue #255: 确保用户可以覆盖默认的 TS 规则
runWithConfig(
  "ts-override",
  {
    typescript: true,
  },
  {
    rules: {
      "ts/consistent-type-definitions": ["error", "type"],
    },
  },
)

// 注册测试用例：TypeScript 严格模式
// 启用 tsconfigPath 从而开启类型感知的严格规则
runWithConfig(
  "ts-strict",
  {
    typescript: {
      tsconfigPath: "./tsconfig.json",
    },
  },
  {
    rules: {
      // 关闭此规则以简化测试用例的构造
      "ts/no-unsafe-return": ["off"],
    },
  },
)

// 注册测试用例：TypeScript 严格模式 + React
// 验证 Issue #618: 确保 TS 和 React 规则能共存且不冲突
runWithConfig(
  "ts-strict-with-react",
  {
    typescript: {
      tsconfigPath: "./tsconfig.json",
    },
    react: true,
  },
  {
    rules: {
      "ts/no-unsafe-return": ["off"],
    },
  },
)

// 注册测试用例：启用外部格式化器 (Prettier/dprint)
runWithConfig(
  "with-formatters",
  {
    typescript: true,
    vue: true,
    astro: true,
    formatters: true,
  },
)

// 注册测试用例：仅针对 Markdown 启用格式化器
runWithConfig(
  "no-markdown-with-formatters",
  {
    jsx: false,
    vue: false,
    markdown: false, // 关闭默认的 markdown lint 规则
    formatters: {
      markdown: true, // 仅使用 formatter 处理 markdown
    },
  },
)

/**
 * 运行集成测试的辅助函数
 *
 * 核心逻辑：
 * 1. 将 fixtures/input 中的文件复制到 _fixtures/<name> 目录
 * 2. 在该目录下生成 eslint.config.js
 * 3. 执行 eslint --fix
 * 4. 将修复后的文件内容与 fixtures/output/<name> 中的快照进行对比
 *
 * @param name 测试用例名称，对应 fixtures 下的子目录名
 * @param configs 传递给 fonds 工厂的配置选项
 * @param items 额外的扁平配置项
 */
function runWithConfig(name: string, configs: OptionsConfig, ...items: TypedFlatConfigItem[]) {
  // 定义中文描述映射，增强测试报告的可读性
  const descriptions: Record<string, string> = {
    "js": "基础 JS 配置",
    "all": "全量配置 (TS, Vue, Svelte, Astro)",
    "no-style": "无样式配置",
    "tab-double-quotes": "Tab 缩进与双引号",
    "ts-override": "TypeScript 规则覆盖",
    "ts-strict": "TypeScript 严格模式",
    "ts-strict-with-react": "TypeScript 严格模式 + React",
    "with-formatters": "启用格式化器",
    "no-markdown-with-formatters": "仅启用 Markdown 格式化器 (禁用其他 Markdown 规则)",
  }

  const description = descriptions[name] || name

  // 使用 it.concurrent 并行运行测试，提高效率
  it.concurrent(`${name} (${description})`, async ({ expect }) => {
    const from = resolve("fixtures/input")
    const output = resolve("fixtures/output", name)
    const target = resolve("_fixtures", name)

    // 步骤 1: 复制输入文件，排除 node_modules
    await fs.cp(from, target, {
      recursive: true,
      filter: (src) => {
        return !src.includes("node_modules")
      },
    })

    // 步骤 2: 动态生成 eslint.config.js
    // 这里使用了 JSON.stringify 将配置对象序列化为字符串写入文件
    await fs.writeFile(join(target, "eslint.config.js"), `
// @eslint-disable
import fonds from '@fonds/eslint-config'

export default fonds(
  ${JSON.stringify(configs)},
  ...${JSON.stringify(items) ?? []},
)
  `)

    // 步骤 3: 在目标目录执行 ESLint CLI 的修复模式
    // 这将修改目标目录下的文件
    await execa("npx", ["eslint", ".", "--fix"], {
      cwd: target,
      stdio: "pipe", // 捕获输出，避免污染测试日志
    })

    // 步骤 4: 获取所有被处理的文件列表
    const files = await glob("**/*", {
      ignore: [
        "node_modules",
        "eslint.config.js",
      ],
      cwd: target,
    })

    // 步骤 5: 逐个文件验证结果
    await Promise.all(files.map(async (file) => {
      const content = await fs.readFile(join(target, file), "utf-8")
      const source = await fs.readFile(join(from, file), "utf-8")
      const outputPath = join(output, file)

      // 如果文件内容在 lint 后没有变化（说明没有规则被触发或修复）
      // 则删除预期的输出快照文件（如果存在），因为不需要对比
      if (content === source) {
        await fs.rm(outputPath, { force: true })
        return
      }

      // 使用 Vitest 的快照功能对比实际内容与 fixtures/output 中的预期内容
      // expect.soft 允许单个断言失败不阻断后续断言
      await expect.soft(content).toMatchFileSnapshot(join(output, file))
    }))
  }, timeout)
}
