/**
 * 正则表达式配置模块
 * 配置正则表达式规则的 ESLint 检查
 */

import type { OptionsRegExp, OptionsOverrides, TypedFlatConfigItem } from "../types";

import { configs } from "eslint-plugin-regexp";

/**
 * 引入 `eslint-plugin-regexp` 的 Flat 推荐配置，可选将严重级别降为 `warn` 并继续接受自定义 overrides。
 */
export async function regexp(options: OptionsRegExp & OptionsOverrides = {}): Promise<TypedFlatConfigItem[]> {
  const config = configs["flat/recommended"] as TypedFlatConfigItem;

  const rules = {
    ...config.rules,
  };

  if (options.level === "warn") {
    // 允许通过配置将插件所有报错降级为警告，方便在遗留项目中逐步接入
    for (const key in rules) {
      if (rules[key] === "error") {
        rules[key] = "warn";
      }
    }
  }

  return [
    {
      ...config,
      name: "senran/regexp/rules",
      rules: {
        // --- 基于 eslint-plugin-regexp 的推荐规则，可整体降级为 warn ---
        ...rules,
        ...options.overrides,
      },
    },
  ];
}
