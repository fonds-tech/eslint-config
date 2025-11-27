import type { OptionsFiles, OptionsOverrides, OptionsStylistic, TypedFlatConfigItem, OptionsHasTypeScript } from "../types"

import { GLOB_SVELTE } from "../globs"
import { ensurePackages, interopDefault } from "../utils"

/**
 * Svelte 配置。
 * 包含 Svelte 组件解析和特定规则。
 */
export async function svelte(
  options: OptionsHasTypeScript & OptionsOverrides & OptionsStylistic & OptionsFiles = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    files = [GLOB_SVELTE],
    overrides = {},
    stylistic = true,
  } = options

  const {
    indent = 2,
    quotes = "single",
  } = typeof stylistic === "boolean" ? {} : stylistic

  await ensurePackages([
    "eslint-plugin-svelte",
  ])

  const [
    pluginSvelte,
    parserSvelte,
  ] = await Promise.all([
    interopDefault(import("eslint-plugin-svelte")),
    interopDefault(import("svelte-eslint-parser")),
  ] as const)

  return [
    {
      name: "fonds/svelte/setup",
      plugins: {
        svelte: pluginSvelte,
      },
    },
    {
      files,
      languageOptions: {
        parser: parserSvelte,
        parserOptions: {
          extraFileExtensions: [".svelte"],
          // 支持 TypeScript
          parser: options.typescript
            ? await interopDefault(import("@typescript-eslint/parser")) as any
            : null,
        },
      },
      name: "fonds/svelte/rules",
      processor: pluginSvelte.processors[".svelte"],
      rules: {
        "no-undef": "off", // 与部分泛型 RFC 不兼容
        // 自定义未使用变量检查，忽略 Svelte 特定的 $$Props, $$Events, $$Slots
        "no-unused-vars": ["error", {
          args: "none",
          caughtErrors: "none",
          ignoreRestSiblings: true,
          vars: "all",
          varsIgnorePattern: "^(\\|\\$\$Props$|\\$\$Events$|\\$\$Slots$)",
        }],

        "svelte/comment-directive": "error", // 允许使用 HTML 注释指令禁用规则
        "svelte/no-at-debug-tags": "warn", // 警告调试标签 {@debug}
        "svelte/no-at-html-tags": "error", // 禁止 {@html} (防止 XSS)
        "svelte/no-dupe-else-if-blocks": "error", // 禁止重复的 else-if 条件
        "svelte/no-dupe-style-properties": "error", // 禁止样式属性重复
        "svelte/no-dupe-use-directives": "error", // 禁止重复的 use 指令
        "svelte/no-export-load-in-svelte-module-in-kit-pages": "error", // 禁止在 .svelte 模块中导出 load (SvelteKit 规范)
        "svelte/no-inner-declarations": "error", // 禁止内部声明
        "svelte/no-not-function-handler": "error", // 事件处理程序必须是函数
        "svelte/no-object-in-text-mustaches": "error", // 禁止在文本插值中输出对象
        "svelte/no-reactive-functions": "error", // 禁止在响应式语句中定义函数 (难以追踪副作用)
        "svelte/no-reactive-literals": "error", // 禁止响应式字面量 (如 $: x = 1 无意义)
        "svelte/no-shorthand-style-property-overrides": "error", // 禁止简写样式属性覆盖
        "svelte/no-unknown-style-directive-property": "error", // 禁止未知的样式指令属性
        "svelte/no-unused-svelte-ignore": "error", // 禁止未使用的 svelte-ignore
        "svelte/no-useless-mustaches": "error", // 禁止无用的花括号 (如 { "string" })
        "svelte/require-store-callbacks-use-set-param": "error", // store 回调必须使用 set 参数
        "svelte/system": "error", // 强制使用系统导入
        "svelte/valid-each-key": "error", // 验证 each 块的 key

        // 对 unused-imports 插件也进行相应的忽略配置
        "unused-imports/no-unused-vars": [
          "error",
          {
            args: "after-used",
            argsIgnorePattern: "^_",
            vars: "all",
            varsIgnorePattern: "^(_|\\$\$Props$|\\$\$Events$|\\$\$Slots$)",
          },
        ],

        // === Svelte 风格规则 ===
        ...stylistic
          ? {
              "style/indent": "off", // 使用 svelte/indent 替代
              "style/no-trailing-spaces": "off",
              "svelte/derived-has-same-inputs-outputs": "error",
              "svelte/html-closing-bracket-spacing": "error",
              "svelte/html-quotes": ["error", { prefer: quotes === "backtick" ? "double" : quotes }],
              "svelte/indent": ["error", { alignAttributesVertically: true, indent }],
              "svelte/mustache-spacing": "error",
              "svelte/no-spaces-around-equal-signs-in-attribute": "error",
              "svelte/no-trailing-spaces": "error",
              "svelte/spaced-html-comment": "error",
            }
          : {},

        ...overrides,
      },
    },
  ]
}
