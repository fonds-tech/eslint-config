/**
 * 测试文件配置模块
 * 为测试文件配置 ESLint 规则
 */

import type { OptionsFiles, OptionsOverrides, OptionsIsInEditor, TypedFlatConfigItem } from "../types";

import { GLOB_TESTS } from "../globs";
import { interopDefault } from "../utils";

// 缓存插件实例，避免每次调用都重新声明
let _pluginTest: any;

/**
 * 针对测试文件（默认匹配 `GLOB_TESTS`）启用 Vitest 与 no-only-tests 规则，可通过 `isInEditor` 自动降级 only 提示级别。
 */
export async function test(options: OptionsFiles & OptionsIsInEditor & OptionsOverrides = {}): Promise<TypedFlatConfigItem[]> {
  const { files = GLOB_TESTS, isInEditor = false, overrides = {} } = options;

  const [pluginVitest, pluginNoOnlyTests] = await Promise.all([
    interopDefault(import("@vitest/eslint-plugin")),
    // @ts-expect-error missing types
    interopDefault(import("eslint-plugin-no-only-tests")),
  ] as const);

  _pluginTest = _pluginTest || {
    ...pluginVitest,
    rules: {
      ...pluginVitest.rules,
      // 合并 eslint-plugin-no-only-tests 提供的规则
      ...pluginNoOnlyTests.rules,
    },
  };

  return [
    {
      name: "senran/test/setup",
      plugins: {
        test: _pluginTest,
      },
    },
    {
      files,
      name: "senran/test/rules",
      rules: {
        // --- Vitest/测试文件惯例，保证命名与生命周期一致 ---
        "test/consistent-test-it": ["error", { fn: "it", withinDescribe: "it" }], // 统一使用 it/describe
        "test/no-identical-title": "error", // describe/it 标题不可重复
        "test/no-import-node-test": "error", // 不允许从 node:test 导入
        "test/no-only-tests": isInEditor ? "warn" : "error", // 禁用 .only，编辑器降级

        "test/prefer-hooks-in-order": "error", // before/after 顺序固定
        "test/prefer-lowercase-title": "error", // 标题使用小写

        // 针对测试场景放宽的核心规则
        ...{
          "no-unused-expressions": "off", // 允许 expect 链式表达式
          "node/prefer-global/process": "off", // 测试中可直接访问 process
          "ts/explicit-function-return-type": "off", // 测试函数可省略返回类型
        },

        ...overrides,
      },
    },
  ];
}
