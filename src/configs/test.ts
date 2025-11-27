import type { OptionsFiles, OptionsOverrides, OptionsIsInEditor, TypedFlatConfigItem } from "../types"

import { GLOB_TESTS } from "../globs"
import { interopDefault } from "../utils"

// 缓存插件实例，避免重复加载
let _pluginTest: any

/**
 * 测试文件专用配置。
 * 基于 Vitest 插件，并集成了 no-only-tests 等辅助规则。
 */
export async function test(
  options: OptionsFiles & OptionsIsInEditor & OptionsOverrides = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    files = GLOB_TESTS,
    isInEditor = false,
    overrides = {},
  } = options

  const [
    pluginVitest,
    pluginNoOnlyTests,
  ] = await Promise.all([
    interopDefault(import("@vitest/eslint-plugin")),
    // @ts-expect-error 缺少类型定义
    interopDefault(import("eslint-plugin-no-only-tests")),
  ] as const)

  _pluginTest = _pluginTest || {
    ...pluginVitest,
    rules: {
      ...pluginVitest.rules,
      // 扩展 `test/no-only-tests` 规则到 Vitest 插件对象中
      ...pluginNoOnlyTests.rules,
    },
  }

  return [
    {
      name: "fonds/test/setup",
      plugins: {
        test: _pluginTest,
      },
    },
    {
      files,
      name: "fonds/test/rules",
      rules: {
        // === 测试风格规则 ===
        "test/consistent-test-it": ["error", { fn: "it", withinDescribe: "it" }], // 统一使用 it() 而非 test()
        "test/no-identical-title": "error", // 禁止重复的测试标题
        "test/no-import-node-test": "error", // 禁止导入 node:test (既然用了 Vitest)
        // 防止提交 .only (在 CI/CD 中尤为重要，但在编辑器中仅警告)
        "test/no-only-tests": isInEditor ? "warn" : "error",

        "test/prefer-hooks-in-order": "error", // 强制 hooks (beforeAll, beforeEach...) 按顺序排列
        "test/prefer-lowercase-title": "error", // 测试标题建议小写 (描述行为)

        // === 规则禁用 ===
        // 在测试文件中，很多常规代码规则需要放宽
        ...{
          "fonds/no-top-level-await": "off", // 测试文件中常需要顶层 await
          "no-unused-expressions": "off", // expect(foo).to.be.true 这种断言属于表达式
          "node/prefer-global/process": "off",
          "ts/explicit-function-return-type": "off", // 测试用例通常不需要显式返回类型
        },

        ...overrides,
      },
    },
  ]
}
