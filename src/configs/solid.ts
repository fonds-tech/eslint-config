import type { OptionsFiles, OptionsOverrides, TypedFlatConfigItem, OptionsHasTypeScript, OptionsTypeScriptWithTypes } from "../types"
import { GLOB_JSX, GLOB_TSX } from "../globs"

import { toArray, ensurePackages, interopDefault } from "../utils"

/**
 * SolidJS 配置。
 * 针对 SolidJS 特有的响应式系统 (Signals) 进行 Lint 检查。
 */
export async function solid(
  options: OptionsHasTypeScript & OptionsOverrides & OptionsFiles & OptionsTypeScriptWithTypes = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    files = [GLOB_JSX, GLOB_TSX],
    overrides = {},
    typescript = true,
  } = options

  await ensurePackages([
    "eslint-plugin-solid",
  ])

  const tsconfigPath = options?.tsconfigPath
    ? toArray(options.tsconfigPath)
    : undefined
  const isTypeAware = !!tsconfigPath

  const [
    pluginSolid,
    parserTs,
  ] = await Promise.all([
    interopDefault(import("eslint-plugin-solid")),
    interopDefault(import("@typescript-eslint/parser")),
  ] as const)

  return [
    {
      name: "fonds/solid/setup",
      plugins: {
        solid: pluginSolid,
      },
    },
    {
      files,
      languageOptions: {
        parser: parserTs,
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
          ...isTypeAware ? { project: tsconfigPath } : {},
        },
        sourceType: "module",
      },
      name: "fonds/solid/rules",
      rules: {
        // === 响应式规则 (Reactivity) ===
        "solid/components-return-once": "warn", // 组件应该只返回一次 (Solid 组件运行一次，不重新渲染)
        "solid/event-handlers": ["error", {
          ignoreCase: false,
          warnOnSpread: false,
        }],
        "solid/imports": "error", // 检查 Solid 导入
        // 标识符使用
        "solid/jsx-no-duplicate-props": "error", // 禁止重复 Props
        "solid/jsx-no-script-url": "error", // 禁止脚本 URL
        "solid/jsx-no-undef": "error", // 禁止未定义的 JSX 元素
        "solid/jsx-uses-vars": "error", // 标记 JSX 中使用的变量
        "solid/no-destructure": "error", // 禁止解构 props (会丢失响应性)
        // 安全问题
        "solid/no-innerhtml": ["error", { allowStatic: true }], // 限制 innerHTML
        "solid/no-react-deps": "error", // 避免使用 React 的依赖数组风格 (Solid 自动追踪依赖)
        "solid/no-react-specific-props": "error", // 避免使用 className 等 React 特有属性 (应使用 class)
        "solid/no-unknown-namespaces": "error", // 禁止未知命名空间
        "solid/prefer-for": "error", // 推荐使用 <For> 组件而非 map (性能更好)
        "solid/reactivity": "warn", // 强制响应式规范 (检测副作用中的信号访问)
        "solid/self-closing-comp": "error", // 自闭合组件
        "solid/style-prop": ["error", { styleProps: ["style", "css"] }], // 样式属性规范

        ...typescript
          ? {
              "solid/jsx-no-undef": ["error", { typescriptEnabled: true }],
              "solid/no-unknown-namespaces": "off",
            }
          : {},
        ...overrides,
      },
    },
  ]
}
