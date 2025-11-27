import type { TypedFlatConfigItem } from "../types"
import { pluginPerfectionist } from "../plugins"

/**
 * Perfectionist 插件配置。
 * 这是一个“强迫症”友好的插件，用于各种元素的排序。
 * 此处默认只启用了导出 (Export) 的排序，其他排序规则在其他模块中配置。
 *
 * @see https://github.com/azat-io/eslint-plugin-perfectionist
 */
export async function perfectionist(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      name: "fonds/perfectionist/setup",
      plugins: {
        perfectionist: pluginPerfectionist,
      },
      rules: {
        // 强制命名导出按字母顺序排列 (type: "natural" 表示自然排序，如 item1, item2, item10)
        "perfectionist/sort-exports": ["error", { order: "asc", type: "natural" }],
        // 强制命名导出的内部顺序排列
        "perfectionist/sort-named-exports": ["error", { order: "asc", type: "natural" }],
      },
    },
  ]
}
