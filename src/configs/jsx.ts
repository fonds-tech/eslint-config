import type { OptionsJSX, TypedFlatConfigItem } from "../types"
import { GLOB_JSX, GLOB_TSX } from "../globs"
import { ensurePackages, interopDefault } from "../utils"

/**
 * JSX 基础配置。
 * 可选开启 JSX 可访问性 (a11y) 检查。
 */
export async function jsx(options: OptionsJSX = {}): Promise<TypedFlatConfigItem[]> {
  const { a11y } = options

  // 基础配置：仅启用 JSX 解析特性
  const baseConfig: TypedFlatConfigItem = {
    files: [GLOB_JSX, GLOB_TSX],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    name: "fonds/jsx/setup",
    plugins: {},
    rules: {},
  }

  // 如果不需要 a11y，直接返回基础配置
  if (!a11y) {
    return [baseConfig]
  }

  await ensurePackages(["eslint-plugin-jsx-a11y"])
  const jsxA11yPlugin = await interopDefault(import("eslint-plugin-jsx-a11y"))
  const a11yConfig = jsxA11yPlugin.flatConfigs.recommended

  const a11yRules = {
    ...(a11yConfig.rules || {}),
    ...(typeof a11y === "object" && a11y.overrides ? a11y.overrides : {}),
  }

  // 合并基础配置与 a11y 配置
  return [
    {
      ...baseConfig,
      ...a11yConfig,
      files: baseConfig.files,
      languageOptions: {
        ...baseConfig.languageOptions,
        ...a11yConfig.languageOptions,
      },
      name: baseConfig.name,
      plugins: {
        ...baseConfig.plugins,
        "jsx-a11y": jsxA11yPlugin,
      },
      rules: {
        ...baseConfig.rules,
        ...a11yRules,
      },
    },
  ]
}
