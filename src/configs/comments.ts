import type { TypedFlatConfigItem } from "../types"

import { pluginComments } from "../plugins"

/**
 * ESLint 注释相关的规则。
 * 确保开发者正确且节制地使用 eslint-disable 等指令。
 */
export async function comments(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      name: "fonds/eslint-comments/rules",
      plugins: {
        "eslint-comments": pluginComments,
      },
      rules: {
        // 禁止聚合式的 enable (即不允许在同一行 enable 多个规则，需分开写以保持清晰)
        "eslint-comments/no-aggregating-enable": "error",
        // 禁止重复的 disable
        "eslint-comments/no-duplicate-disable": "error",
        // 禁止无限制的 disable (必须指定具体的规则 ID，例如 // eslint-disable-next-line no-console)
        "eslint-comments/no-unlimited-disable": "error",
        // 禁止未使用的 enable (即没有对应的 disable)
        "eslint-comments/no-unused-enable": "error",
      },
    },
  ]
}
