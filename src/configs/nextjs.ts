import type { OptionsFiles, OptionsOverrides, TypedFlatConfigItem } from "../types"
import { GLOB_SRC } from "../globs"
import { ensurePackages, interopDefault } from "../utils"

// 规范化规则格式的辅助函数
function normalizeRules(rules: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(rules).map(([key, value]) =>
      [key, typeof value === "string" ? [value] : value],
    ),
  )
}

/**
 * Next.js 配置。
 * 需要安装 `@next/eslint-plugin-next`。
 */
export async function nextjs(
  options: OptionsOverrides & OptionsFiles = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    files = [GLOB_SRC],
    overrides = {},
  } = options

  await ensurePackages([
    "@next/eslint-plugin-next",
  ])

  const pluginNextJS = await interopDefault(import("@next/eslint-plugin-next"))

  // 提取 Next.js 插件中的规则配置
  function getRules(name: keyof typeof pluginNextJS.configs): Record<string, any> {
    const rules = pluginNextJS.configs?.[name]?.rules
    if (!rules)
      throw new Error(`[@fonds/eslint-config] Failed to find config ${name} in @next/eslint-plugin-next`)
    return normalizeRules(rules)
  }

  return [
    {
      name: "fonds/nextjs/setup",
      plugins: {
        next: pluginNextJS,
      },
    },
    {
      files,
      languageOptions: {
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
        sourceType: "module",
      },
      name: "fonds/nextjs/rules",
      rules: {
        // === Next.js 推荐规则 ===
        // 包括对 Image, Link, Script 组件的正确使用检查
        ...getRules("recommended"),

        // === Core Web Vitals 规则 ===
        // 旨在提高页面加载性能和用户体验
        ...getRules("core-web-vitals"),

        ...overrides,
      },
      settings: {
        react: {
          version: "detect",
        },
      },
    },
  ]
}
