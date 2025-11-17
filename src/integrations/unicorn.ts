/**
 * Unicorn 配置模块
 * 配置 ESLint Unicorn 插件的主观最佳实践规则
 */

import type { OptionsUnicorn, TypedFlatConfigItem } from "../types";

import { pluginUnicorn } from "../plugins";

/**
 * 集成 `eslint-plugin-unicorn` 常用规则，可切换为 `allRecommended` 以启用官方完整推荐集。
 */
export async function unicorn(options: OptionsUnicorn = {}): Promise<TypedFlatConfigItem[]> {
  const { allRecommended = false, overrides = {} } = options;
  return [
    {
      name: "senran/unicorn/rules",
      plugins: {
        unicorn: pluginUnicorn,
      },
      rules: {
        // --- Unicorn 插件通用最佳实践（可切换全量推荐） ---
        ...(allRecommended
          ? (pluginUnicorn.configs.recommended.rules as any)
          : {
              "unicorn/consistent-empty-array-spread": "error", // 空数组 spread 格式一致
              "unicorn/error-message": "error", // Error message 必须有内容
              "unicorn/escape-case": "error", // 转义序列使用大写
              "unicorn/new-for-builtins": "error", // 原生构造器必须带 new
              "unicorn/no-instanceof-builtins": "error", // 使用 instanceof 时改用 Array.isArray 等
              "unicorn/no-new-array": "error", // 禁止 new Array
              "unicorn/no-new-buffer": "error", // 禁止 new Buffer
              "unicorn/number-literal-case": "error", // 数字字面量小写
              "unicorn/prefer-dom-node-text-content": "error", // 使用 textContent 而非 innerText
              "unicorn/prefer-includes": "error", // indexOf -> includes
              "unicorn/prefer-node-protocol": "error", // 使用 node: 协议
              "unicorn/prefer-number-properties": "error", // 使用 Number.isNaN 等
              "unicorn/prefer-string-starts-ends-with": "error", // 使用 startsWith/endsWith
              "unicorn/prefer-type-error": "error", // 类型错误抛 TypeError
              "unicorn/throw-new-error": "error", // 抛异常必须使用 new
            }),
        ...overrides,
      },
    },
  ];
}
