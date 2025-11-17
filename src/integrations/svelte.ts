/**
 * Svelte 配置模块
 * 为 Svelte 组件文件配置 ESLint 规则
 */

import type { OptionsFiles, OptionsOverrides, OptionsStylistic, TypedFlatConfigItem, OptionsHasTypeScript } from "../types";

import { GLOB_SVELTE } from "../globs";
import { ensurePackages, interopDefault } from "../utils";

/**
 * 针对 Svelte/SvelteKit 的规则集合，自动接入官方解析器及 TypeScript 支持，并在 `stylistic` 为 true 时补充格式化偏好。
 */
export async function svelte(options: OptionsHasTypeScript & OptionsOverrides & OptionsStylistic & OptionsFiles = {}): Promise<TypedFlatConfigItem[]> {
  const { files = [GLOB_SVELTE], overrides = {}, stylistic = true } = options;

  const { indent = 2, quotes = "double" } = typeof stylistic === "boolean" ? {} : stylistic;

  await ensurePackages(["eslint-plugin-svelte"]);

  const [pluginSvelte, parserSvelte] = await Promise.all([interopDefault(import("eslint-plugin-svelte")), interopDefault(import("svelte-eslint-parser"))] as const);

  return [
    {
      name: "senran/svelte/setup",
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
          parser: options.typescript ? ((await interopDefault(import("@typescript-eslint/parser"))) as any) : null,
        },
      },
      name: "senran/svelte/rules",
      processor: pluginSvelte.processors[".svelte"],
      rules: {
        // --- Svelte 核心语法与运行时安全 ---
        "no-undef": "off", // 与近期 attribute-form 泛型 RFC 不兼容，统一关闭
        "no-unused-vars": [
          "error",
          {
            args: "none",
            caughtErrors: "none",
            ignoreRestSiblings: true,
            vars: "all",
            varsIgnorePattern: "^(\\$\\$Props$|\\$\\$Events$|\\$\\$Slots$)",
          },
        ],

        "svelte/comment-directive": "error", // Svelte 指令注释写法正确
        "svelte/no-at-debug-tags": "warn", // 避免使用 @debug
        "svelte/no-at-html-tags": "error", // 禁止 @html 造成 XSS
        "svelte/no-dupe-else-if-blocks": "error", // else-if 条件不可重复
        "svelte/no-dupe-style-properties": "error", // style 不可重复属性
        "svelte/no-dupe-use-directives": "error", // use: 指令不可重复
        "svelte/no-export-load-in-svelte-module-in-kit-pages": "error", // kit pages 中禁止在 module context export load
        "svelte/no-inner-declarations": "error", // 模板内禁止声明函数/变量
        "svelte/no-not-function-handler": "error", // on:handler 必须是函数
        "svelte/no-object-in-text-mustaches": "error", // mustache 中不可直接输出对象
        "svelte/no-reactive-functions": "error", // 避免函数滥用 $:
        "svelte/no-reactive-literals": "error", // $: 常量会导致无意义依赖
        "svelte/no-shorthand-style-property-overrides": "error", // 样式简写不能覆盖单独属性
        "svelte/no-unknown-style-directive-property": "error", // style 指令属性需存在
        "svelte/no-unused-svelte-ignore": "error", // svelte-ignore 必须实际忽略
        "svelte/no-useless-mustaches": "error", // 避免冗余的 {{}}
        "svelte/require-store-callbacks-use-set-param": "error", // store 回调必须使用 set 参数
        "svelte/system": "error", // 系统级别检查
        "svelte/valid-each-key": "error", // each 循环需要稳定 key

        // --- 针对 script 块中导入/变量的专门检查 ---
        "unused-imports/no-unused-vars": [
          "error",
          {
            args: "after-used",
            argsIgnorePattern: "^_",
            vars: "all",
            varsIgnorePattern: "^(_|\\$\\$Props$|\\$\\$Events$|\\$\\$Slots$)",
          },
        ], // Svelte 脚本段落专用未使用变量检查

        ...(stylistic
          ? {
              "style/indent": "off", // 交由 svelte/indent 接管
              "style/no-trailing-spaces": "off", // 交由 svelte/no-trailing-spaces 接管
              "svelte/derived-has-same-inputs-outputs": "error", // 派生 store 输入输出一致
              "svelte/html-closing-bracket-spacing": "error", // 标签闭合前空格规范
              "svelte/html-quotes": ["error", { prefer: quotes === "backtick" ? "double" : quotes }], // HTML 属性引号风格
              "svelte/indent": ["error", { alignAttributesVertically: true, indent }], // 模板缩进
              "svelte/mustache-spacing": "error", // Mustache 内空格
              "svelte/no-spaces-around-equal-signs-in-attribute": "error", // 属性等号两侧无空格
              "svelte/no-trailing-spaces": "error", // 禁止行尾空格
              "svelte/spaced-html-comment": "error", // 注释左右留空格
            }
          : {}),

        ...overrides,
      },
    },
  ];
}
