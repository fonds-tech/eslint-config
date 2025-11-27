import type { OptionsRegExp, OptionsOverrides, TypedFlatConfigItem } from "../types"

import { configs } from "eslint-plugin-regexp"

/**
 * 正则表达式 (RegExp) 专项规则。
 * 帮助发现正则中的错误、潜在的性能问题 (ReDoS) 以及风格问题。
 */
export async function regexp(
  options: OptionsRegExp & OptionsOverrides = {},
): Promise<TypedFlatConfigItem[]> {
  const config = configs["flat/recommended"] as TypedFlatConfigItem

  const rules = {
    ...config.rules,
  }

  // 如果设定级别为 warn，则将所有 error 规则降级为 warn
  // 这在引入大量正则检查到旧项目时很有用
  if (options.level === "warn") {
    for (const key in rules) {
      if (rules[key] === "error")
        rules[key] = "warn"
    }
  }

  return [
    {
      ...config,
      name: "fonds/regexp/rules",
      rules: {
        ...rules,
        ...options.overrides,
      },
    },
  ]
}
