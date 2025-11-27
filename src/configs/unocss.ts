import type { OptionsUnoCSS, TypedFlatConfigItem } from "../types"

import { ensurePackages, interopDefault } from "../utils"

/**
 * UnoCSS 配置。
 * 针对 Atomic CSS 框架 UnoCSS 的规则。
 */
export async function unocss(
  options: OptionsUnoCSS = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    attributify = true, // 是否启用了属性化模式 (e.g. <div flex="~ col">)
    strict = false, // 是否启用严格模式 (检查类名是否存在)
  } = options

  await ensurePackages([
    "@unocss/eslint-plugin",
  ])

  const [
    pluginUnoCSS,
  ] = await Promise.all([
    interopDefault(import("@unocss/eslint-plugin")),
  ] as const)

  return [
    {
      name: "fonds/unocss",
      plugins: {
        unocss: pluginUnoCSS,
      },
      rules: {
        "unocss/order": "warn", // 强制类名排序 (提高 Gzip 压缩率和可读性)
        ...attributify
          ? {
              "unocss/order-attributify": "warn", // 属性化模式下的类名排序
            }
          : {},
        ...strict
          ? {
              "unocss/blocklist": "error", // 禁止使用配置中 blocklist 列出的类名
            }
          : {},
      },
    },
  ]
}
