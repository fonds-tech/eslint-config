/* eslint-disable perfectionist/sort-objects */
import type { OptionsFiles, OptionsOverrides, TypedFlatConfigItem, OptionsTypeScriptWithTypes, OptionsTypeScriptParserOptions } from "../types"

import { isPackageExists } from "local-pkg"
import { ensurePackages, interopDefault } from "../utils"

import { GLOB_TS, GLOB_SRC, GLOB_TSX, GLOB_ASTRO_TS, GLOB_MARKDOWN } from "../globs"

// 检测项目中使用的 React 生态库，以便自动调整规则
// react refresh 允许常量导出的包列表
const ReactRefreshAllowConstantExportPackages = [
  "vite",
]
const RemixPackages = [
  "@remix-run/node",
  "@remix-run/react",
  "@remix-run/serve",
  "@remix-run/dev",
]
const ReactRouterPackages = [
  "@react-router/node",
  "@react-router/react",
  "@react-router/serve",
  "@react-router/dev",
]
const NextJsPackages = [
  "next",
]

/**
 * React 配置。
 * 包含 React, Hooks, Refresh 以及可访问性和最佳实践规则。
 * 自动检测是否使用 Next.js 或 Remix 并调整规则。
 */
export async function react(
  options: OptionsTypeScriptParserOptions & OptionsTypeScriptWithTypes & OptionsOverrides & OptionsFiles = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    files = [GLOB_SRC],
    filesTypeAware = [GLOB_TS, GLOB_TSX],
    ignoresTypeAware = [
      `${GLOB_MARKDOWN}/**`,
      GLOB_ASTRO_TS,
    ],
    overrides = {},
    tsconfigPath,
  } = options

  // 确保安装了必要的 React 相关插件
  await ensurePackages([
    "@eslint-react/eslint-plugin",
    "eslint-plugin-react-hooks",
    "eslint-plugin-react-refresh",
  ])

  const isTypeAware = !!tsconfigPath

  // 类型感知的 React 规则 (如检测条件渲染中的泄漏)
  const typeAwareRules: TypedFlatConfigItem["rules"] = {
    "react/no-leaked-conditional-rendering": "warn", // 防止渲染类似 0 或 NaN 的意外值
  }

  const [
    pluginReact,
    pluginReactHooks,
    pluginReactRefresh,
  ] = await Promise.all([
    interopDefault(import("@eslint-react/eslint-plugin")),
    interopDefault(import("eslint-plugin-react-hooks")),
    interopDefault(import("eslint-plugin-react-refresh")),
  ] as const)

  // 检测环境特征
  const isAllowConstantExport = ReactRefreshAllowConstantExportPackages.some(i => isPackageExists(i))
  const isUsingRemix = RemixPackages.some(i => isPackageExists(i))
  const isUsingReactRouter = ReactRouterPackages.some(i => isPackageExists(i))
  const isUsingNext = NextJsPackages.some(i => isPackageExists(i))

  const plugins = (pluginReact.configs.all as any).plugins

  return [
    {
      name: "fonds/react/setup",
      plugins: {
        "react": plugins["@eslint-react"],
        "react-dom": plugins["@eslint-react/dom"],
        "react-hooks": pluginReactHooks,
        "react-hooks-extra": plugins["@eslint-react/hooks-extra"],
        "react-naming-convention": plugins["@eslint-react/naming-convention"],
        "react-refresh": pluginReactRefresh,
        "react-web-api": plugins["@eslint-react/web-api"],
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
      name: "fonds/react/rules",
      rules: {
        // === 核心 React 规则 (eslint-plugin-react-x) ===
        // https://eslint-react.xyz/docs/rules/overview#core-rules
        "react/jsx-no-comment-textnodes": "warn", // 防止注释文本被渲染
        "react/jsx-no-duplicate-props": "warn", // 禁止重复的 props
        "react/jsx-uses-vars": "warn", // 防止 JSX 中使用的变量被误报为未使用
        "react/no-access-state-in-setstate": "error", // 禁止在 setState 中访问 this.state (应使用回调参数)
        "react/no-array-index-key": "warn", // 尽量避免使用 index 作为 key (会导致渲染性能和状态问题)
        "react/no-children-count": "warn", // 避免手动计算 children 数量
        "react/no-children-for-each": "warn", // 优先使用 React.Children.forEach
        "react/no-children-map": "warn", // 优先使用 React.Children.map
        "react/no-children-only": "warn", // 优先使用 React.Children.only
        "react/no-children-to-array": "warn", // 优先使用 React.Children.toArray
        "react/no-clone-element": "warn", // 尽量避免 cloneElement
        "react/no-component-will-mount": "error", // 禁止使用废弃的生命周期 componentWillMount
        "react/no-component-will-receive-props": "error", // 禁止使用废弃的生命周期 componentWillReceiveProps
        "react/no-component-will-update": "error", // 禁止使用废弃的生命周期 componentWillUpdate
        "react/no-context-provider": "warn", // Context Provider 必须包含 value
        "react/no-create-ref": "error", // 禁止在函数组件中使用 createRef (应使用 useRef)
        "react/no-default-props": "error", // 推荐使用函数参数默认值而非 defaultProps
        "react/no-direct-mutation-state": "error", // 禁止直接修改 state
        "react/no-duplicate-key": "warn", // 禁止重复的 key
        "react/no-forward-ref": "warn", // forwardRef 的使用建议
        "react/no-implicit-key": "warn", // 警告隐式 key
        "react/no-missing-key": "error", // 强制列表渲染必须有 key
        "react/no-nested-component-definitions": "error", // 禁止在组件内定义组件 (会导致状态丢失和性能问题)
        "react/no-prop-types": "error", // TS 项目中不需要 prop-types，应使用 TypeScript 接口
        "react/no-redundant-should-component-update": "error", // 禁止冗余的 shouldComponentUpdate
        "react/no-set-state-in-component-did-mount": "warn", // 警告在 componentDidMount 中 setState (可能导致二次渲染)
        "react/no-set-state-in-component-did-update": "warn", // 警告在 componentDidUpdate 中 setState
        "react/no-set-state-in-component-will-update": "warn", // 警告在 componentWillUpdate 中 setState
        "react/no-string-refs": "error", // 禁止使用字符串 ref (已废弃)
        "react/no-unnecessary-use-prefix": "warn", // 避免不必要的 use 前缀
        "react/no-unsafe-component-will-mount": "warn", // 警告 UNSAFE_componentWillMount
        "react/no-unsafe-component-will-receive-props": "warn", // 警告 UNSAFE_componentWillReceiveProps
        "react/no-unsafe-component-will-update": "warn", // 警告 UNSAFE_componentWillUpdate
        "react/no-unstable-context-value": "warn", // 防止 Context Provider 的 value 不稳定导致频繁重渲染 (应使用 useMemo)
        "react/no-unstable-default-props": "warn", // 警告不稳定的 defaultProps
        "react/no-unused-class-component-members": "warn", // 警告未使用的类组件成员
        "react/no-unused-state": "warn", // 警告未使用的 state
        "react/no-use-context": "warn", // Context 使用规范
        "react/no-useless-forward-ref": "warn", // 禁止无用的 forwardRef
        "react/prefer-use-state-lazy-initialization": "warn", // 复杂初始状态推荐懒初始化

        // === DOM 相关规则 (eslint-plugin-react-dom) ===
        // https://eslint-react.xyz/docs/rules/overview#dom-rules
        "react-dom/no-dangerously-set-innerhtml": "warn", // 警告使用 dangerouslySetInnerHTML (易导致 XSS)
        "react-dom/no-dangerously-set-innerhtml-with-children": "error", // 禁止 dangerouslySetInnerHTML 与 children 同时存在
        "react-dom/no-find-dom-node": "error", // 禁止使用 findDOMNode (已废弃，且在严格模式下失效)
        "react-dom/no-flush-sync": "error", // 限制 flushSync 使用
        "react-dom/no-hydrate": "error", // 限制 hydrate 使用
        "react-dom/no-missing-button-type": "warn", // 按钮应显式指定 type (submit/button/reset)
        "react-dom/no-missing-iframe-sandbox": "warn", // iframe 应该有 sandbox 属性
        "react-dom/no-namespace": "error", // 限制命名空间使用
        "react-dom/no-render": "error", // 限制 render 使用
        "react-dom/no-render-return-value": "error", // 禁止使用 render 的返回值
        "react-dom/no-script-url": "warn", // 警告 script URL (javascript:...)
        "react-dom/no-unsafe-iframe-sandbox": "warn", // 警告不安全的 iframe sandbox 配置
        "react-dom/no-unsafe-target-blank": "warn", // 带有 target="_blank" 的链接应有 rel="noreferrer" (安全隐患)
        "react-dom/no-use-form-state": "error", // 限制 useFormState 使用
        "react-dom/no-void-elements-with-children": "error", // 禁止空元素 (如 <br>, <img>) 包含 children

        // === Hooks 规则 ===
        ...pluginReactHooks.configs.recommended.rules, // 包含 rules-of-hooks 和 exhaustive-deps

        // === Hooks Extra 规则 ===
        "react-hooks-extra/no-direct-set-state-in-use-effect": "warn", // 防止 useEffect 中直接 setState 导致的死循环

        // === Web API 规则 ===
        // 检测可能导致内存泄漏的 API 使用 (EventListener, Interval, Timeout 等)
        "react-web-api/no-leaked-event-listener": "warn", // 警告未移除的事件监听器
        "react-web-api/no-leaked-interval": "warn", // 警告未清除的 interval
        "react-web-api/no-leaked-resize-observer": "warn", // 警告未断开的 ResizeObserver
        "react-web-api/no-leaked-timeout": "warn", // 警告未清除的 timeout

        // === React Refresh 规则 ===
        "react-refresh/only-export-components": [
          "warn",
          {
            allowConstantExport: isAllowConstantExport,
            // 允许特定框架的特定导出，防止误报
            allowExportNames: [
              ...(isUsingNext
                ? [
                    "dynamic",
                    "dynamicParams",
                    "revalidate",
                    "fetchCache",
                    "runtime",
                    "preferredRegion",
                    "maxDuration",
                    "config",
                    "generateStaticParams",
                    "metadata",
                    "generateMetadata",
                    "viewport",
                    "generateViewport",
                  ]
                : []),
              ...(isUsingRemix || isUsingReactRouter
                ? [
                    "meta",
                    "links",
                    "headers",
                    "loader",
                    "action",
                    "clientLoader",
                    "clientAction",
                    "handle",
                    "shouldRevalidate",
                  ]
                : []),
            ],
          },
        ],

        // overrides
        ...overrides,
      },
    },
    // 应用类型感知规则
    ...isTypeAware
      ? [{
          files: filesTypeAware,
          ignores: ignoresTypeAware,
          name: "fonds/react/type-aware-rules",
          rules: {
            ...typeAwareRules,
          },
        }]
      : [],
  ]
}
