/**
 * Solid.js 配置模块
 * 为 Solid.js 反应式框架项目配置 ESLint 规则
 */

import type { OptionsFiles, OptionsOverrides, TypedFlatConfigItem, OptionsHasTypeScript, OptionsTypeScriptWithTypes } from "../types";
import { GLOB_JSX, GLOB_TSX } from "../globs";

import { toArray, ensurePackages, interopDefault } from "../utils";

/**
 * Solid 应用的推荐规则集，若提供 `tsconfigPath` 则自动开启类型感知模式，并根据 `typescript` 选项包容纯 JS 项目。
 */
export async function solid(options: OptionsHasTypeScript & OptionsOverrides & OptionsFiles & OptionsTypeScriptWithTypes = {}): Promise<TypedFlatConfigItem[]> {
  const { files = [GLOB_JSX, GLOB_TSX], overrides = {}, typescript = true } = options;

  await ensurePackages(["eslint-plugin-solid"]);

  const tsconfigPath = options?.tsconfigPath ? toArray(options.tsconfigPath) : undefined;
  const isTypeAware = !!tsconfigPath;

  const [pluginSolid, parserTs] = await Promise.all([interopDefault(import("eslint-plugin-solid")), interopDefault(import("@typescript-eslint/parser"))] as const);

  return [
    {
      name: "senran/solid/setup",
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
          ...(isTypeAware ? { project: tsconfigPath } : {}),
        },
        sourceType: "module",
      },
      name: "senran/solid/rules",
      rules: {
        // --- 核心响应式语义 ---
        "solid/components-return-once": "warn", // 组件仅返回一次避免条件 return
        "solid/event-handlers": [
          "error",
          {
            ignoreCase: false, // 为 true 时允许 onclick/onchange 等歧义处理器
            warnOnSpread: false, // Solid <1.6 禁止事件处理器 spread
          },
        ],
        // 风格类建议
        "solid/imports": "error", // 自动补全 Solid API import
        // 标识符与 JSX 相关的约束
        "solid/jsx-no-duplicate-props": "error", // JSX props 不可重复
        "solid/jsx-no-script-url": "error", // 禁用 script: URL
        "solid/jsx-no-undef": "error", // JSX 中声明的组件必须定义
        "solid/jsx-uses-vars": "error", // JSX 使用的变量不能标记为未使用
        "solid/no-destructure": "error", // 避免 props 解构失去响应性
        // 安全相关
        "solid/no-innerhtml": ["error", { allowStatic: true }], // 禁用危险 innerHTML
        "solid/no-react-deps": "error", // 不允许使用 React 特有依赖
        "solid/no-react-specific-props": "error", // 禁止 React 专属 props
        "solid/no-unknown-namespaces": "error", // JSX 命名空间必须已知
        "solid/prefer-for": "error", // 循环使用 <For> 而非 map
        "solid/reactivity": "warn", // 检查响应式语法使用
        "solid/self-closing-comp": "error", // 无子节点组件使用自闭合
        "solid/style-prop": ["error", { styleProps: ["style", "css"] }], // style/ css 属性需使用对象
        ...(typescript
          ? {
              "solid/jsx-no-undef": ["error", { typescriptEnabled: true }], // TS 模式下开启类型感知
              "solid/no-unknown-namespaces": "off", // TS 自身处理命名空间
            }
          : {}),
        // 用户自定义规则
        ...overrides,
      },
    },
  ];
}
