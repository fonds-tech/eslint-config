/**
 * React 配置模块
 * 为 React 项目和 Hooks 配置 ESLint 规则
 */

import type { OptionsFiles, OptionsOverrides, TypedFlatConfigItem, OptionsTypeScriptWithTypes, OptionsTypeScriptParserOptions } from "../types";

import { isPackageExists } from "local-pkg";
import { ensurePackages, interopDefault } from "../utils";
import { GLOB_TS, GLOB_SRC, GLOB_TSX, GLOB_ASTRO_TS, GLOB_MARKDOWN } from "../globs";

// react-refresh 相关运行时检测，用于控制允许的导出
const ReactRefreshAllowConstantExportPackages = ["vite"];
const RemixPackages = ["@remix-run/node", "@remix-run/react", "@remix-run/serve", "@remix-run/dev"];
const ReactRouterPackages = ["@react-router/node", "@react-router/react", "@react-router/serve", "@react-router/dev"];
const NextJsPackages = ["next"];

/**
 * React/JSX 专用规则集：自动安装依赖、按检测到的框架（Next/Remix/React Router）调整刷新策略，
 * 并在提供 `tsconfigPath` 时开启类型感知规则。
 */
export async function react(options: OptionsTypeScriptParserOptions & OptionsTypeScriptWithTypes & OptionsOverrides & OptionsFiles = {}): Promise<TypedFlatConfigItem[]> {
  const { files = [GLOB_SRC], filesTypeAware = [GLOB_TS, GLOB_TSX], ignoresTypeAware = [`${GLOB_MARKDOWN}/**`, GLOB_ASTRO_TS], overrides = {}, tsconfigPath } = options;

  await ensurePackages(["@eslint-react/eslint-plugin", "eslint-plugin-react-hooks", "eslint-plugin-react-refresh"]);

  const isTypeAware = !!tsconfigPath;

  const typeAwareRules: TypedFlatConfigItem["rules"] = {
    // --- 仅在类型感知模式下启用，捕获条件渲染遗漏 ---
    "react/no-leaked-conditional-rendering": "warn",
  };

  const [pluginReact, pluginReactHooks, pluginReactRefresh] = await Promise.all([
    interopDefault(import("@eslint-react/eslint-plugin")),
    interopDefault(import("eslint-plugin-react-hooks")),
    interopDefault(import("eslint-plugin-react-refresh")),
  ] as const);

  const isAllowConstantExport = ReactRefreshAllowConstantExportPackages.some(i => isPackageExists(i));
  const isUsingRemix = RemixPackages.some(i => isPackageExists(i));
  const isUsingReactRouter = ReactRouterPackages.some(i => isPackageExists(i));
  const isUsingNext = NextJsPackages.some(i => isPackageExists(i));

  const pluginsMap = (pluginReact.configs.all as { plugins: Record<string, any> }).plugins;

  return [
    {
      name: "senran/react/setup",
      plugins: {
        "react": pluginsMap["@eslint-react"],
        "react-dom": pluginsMap["@eslint-react/dom"],
        "react-hooks": pluginReactHooks,
        "react-hooks-extra": pluginsMap["@eslint-react/hooks-extra"],
        "react-naming-convention": pluginsMap["@eslint-react/naming-convention"],
        "react-refresh": pluginReactRefresh,
        "react-web-api": pluginsMap["@eslint-react/web-api"],
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
      name: "senran/react/rules",
      rules: {
        // eslint-plugin-react-x 推荐规则 https://eslint-react.xyz/docs/rules/overview#core-rules
        "react/jsx-no-duplicate-props": "warn", // JSX 中 props 不可重复
        "react/jsx-uses-vars": "warn", // JSX 中使用的组件必须有对应变量
        "react/no-access-state-in-setstate": "error", // setState 回调里禁止再次访问旧 state
        "react/no-array-index-key": "warn", // 列表 key 不使用索引
        "react/no-children-count": "warn", // 不再依赖 Children.count 等旧 API
        "react/no-children-for-each": "warn", // children 不使用 forEach 这类 API
        "react/no-children-map": "warn", // 鼓励直接使用数组 map
        "react/no-children-only": "warn", // 避免 Children.only 限制
        "react/no-children-to-array": "warn", // 不随意转成数组影响性能
        "react/no-clone-element": "warn", // 避免 cloneElement 带来的难以追踪
        "react/no-comment-textnodes": "warn", // JSX 中不要注释节点
        "react/no-component-will-mount": "error", // 禁用过时生命周期
        "react/no-component-will-receive-props": "error", // 禁用 UNSAFE 生命周期
        "react/no-component-will-update": "error", // 同上
        "react/no-context-provider": "warn", // 避免直接使用旧 Context API
        "react/no-create-ref": "error", // 优先使用 useRef/forwardRef
        "react/no-default-props": "error", // 函数组件建议使用参数默认值
        "react/no-direct-mutation-state": "error", // setState 之外不得直接改 state
        "react/no-duplicate-key": "warn", // 列表 key 必须唯一
        "react/no-forward-ref": "warn", // 避免随意暴露 forwardRef
        "react/no-implicit-key": "warn", // JSX fragment 也需要 key
        "react/no-missing-key": "error", // 列表必须提供 key
        "react/no-nested-component-definitions": "error", // 组件定义不要嵌套，避免重新创建
        "react/no-prop-types": "error", // 偏好 TypeScript 或其他静态类型
        "react/no-redundant-should-component-update": "error", // 不必要的 shouldComponentUpdate
        "react/no-set-state-in-component-did-mount": "warn", // didMount/setState 可能触发两次渲染
        "react/no-set-state-in-component-did-update": "warn", // didUpdate 内 setState 容易无限循环
        "react/no-set-state-in-component-will-update": "warn", // 已废弃生命周期禁止 setState
        "react/no-string-refs": "error", // 禁用字符串 ref
        "react/no-unsafe-component-will-mount": "warn", // 针对 UNSAFE_ 前缀方法
        "react/no-unsafe-component-will-receive-props": "warn",
        "react/no-unsafe-component-will-update": "warn",
        "react/no-unstable-context-value": "warn", // Provider value 不要每次创建新对象
        "react/no-unstable-default-props": "warn", // defaultProps 不应依赖动态值
        "react/no-unused-class-component-members": "warn", // class 组件中未使用成员应删除
        "react/no-unused-state": "warn", // state 声明未使用
        "react/no-use-context": "warn", // 避免直接访问 context（建议 useContext）
        "react/no-useless-forward-ref": "warn", // forwardRef 不应只做透传

        // eslint-plugin-react-dom 推荐规则 https://eslint-react.xyz/docs/rules/overview#dom-rules
        "react-dom/no-dangerously-set-innerhtml": "warn", // 谨慎使用 innerHTML
        "react-dom/no-dangerously-set-innerhtml-with-children": "error", // 使用 innerHTML 时不得再传 children
        "react-dom/no-find-dom-node": "error", // 禁用 findDOMNode
        "react-dom/no-flush-sync": "error", // 避免 flushSync 强制刷新
        "react-dom/no-hydrate": "error", // SSR 环境避免错误 hydrate 调用
        "react-dom/no-missing-button-type": "warn", // button 必须声明 type
        "react-dom/no-missing-iframe-sandbox": "warn", // iframe 应提供 sandbox
        "react-dom/no-namespace": "error", // HTML 不应使用命名空间
        "react-dom/no-render": "error", // 避免直接调用 ReactDOM.render
        "react-dom/no-render-return-value": "error", // render 不依赖返回值
        "react-dom/no-script-url": "warn", // 禁用 javascript: 链接
        "react-dom/no-unsafe-iframe-sandbox": "warn", // sandbox 不应过于宽松
        "react-dom/no-unsafe-target-blank": "warn", // target=_blank 必须 rel=noopener
        "react-dom/no-use-form-state": "error", // 避免使用已废弃 API
        "react-dom/no-void-elements-with-children": "error", // 空元素不得有子节点

        // React Hooks 官方规则 https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks/src/rules
        "react-hooks/exhaustive-deps": "warn", // useEffect/useCallback 依赖必须完整
        "react-hooks/rules-of-hooks": "error", // Hooks 必须在顶层调用

        // eslint-plugin-react-hooks-extra 推荐规则 https://eslint-react.xyz/docs/rules/overview#hooks-extra-rules
        "react-hooks-extra/no-direct-set-state-in-use-effect": "warn", // useEffect 中不要直接 setState
        "react-hooks-extra/no-unnecessary-use-prefix": "warn", // 自定义 Hook 命名遵循 use 前缀
        "react-hooks-extra/prefer-use-state-lazy-initialization": "warn", // useState 初始值建议懒计算

        // eslint-plugin-react-web-api 推荐规则 https://eslint-react.xyz/docs/rules/overview#web-api-rules
        "react-web-api/no-leaked-event-listener": "warn", // 注册的监听器需解绑
        "react-web-api/no-leaked-interval": "warn", // setInterval 需清理
        "react-web-api/no-leaked-resize-observer": "warn", // ResizeObserver 需断开
        "react-web-api/no-leaked-timeout": "warn", // setTimeout 需清理

        // eslint-plugin-react-refresh 预置规则 https://github.com/ArnaudBarre/eslint-plugin-react-refresh/tree/main/src
        "react-refresh/only-export-components": [
          "warn",
          {
            allowConstantExport: isAllowConstantExport,
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
              ...(isUsingRemix || isUsingReactRouter ? ["meta", "links", "headers", "loader", "action", "clientLoader", "clientAction", "handle", "shouldRevalidate"] : []),
            ],
          },
        ], // Fast Refresh 仅允许导出组件/特定 Next/Remix 方法

        // 用户自定义覆盖
        ...overrides,
      },
    },
    ...(isTypeAware
      ? [
          {
            files: filesTypeAware,
            ignores: ignoresTypeAware,
            name: "senran/react/type-aware-rules",
            rules: {
              ...typeAwareRules,
            },
          },
        ]
      : []),
  ];
}
