/**
 * Vue 配置模块
 * 为 Vue.js 单文件组件配置 ESLint 规则
 */

import type { OptionsVue, OptionsFiles, OptionsOverrides, OptionsStylistic, TypedFlatConfigItem, OptionsHasTypeScript } from "../types";

import { GLOB_VUE } from "../globs";
import { mergeProcessors } from "eslint-merge-processors";
import { ensurePackages, interopDefault } from "../utils";

/**
 * Vue/NUXT/SFC 全量规则：自动处理 `<script setup>`、SFC block 解析与 a11y 扩展，可兼容 Vue2/Vue3 且可自定义样式、TS 支持。
 */
export async function vue(options: OptionsVue & OptionsHasTypeScript & OptionsOverrides & OptionsStylistic & OptionsFiles = {}): Promise<TypedFlatConfigItem[]> {
  const { a11y = false, files = [GLOB_VUE], overrides = {}, stylistic = true, vueVersion = 3 } = options;

  const sfcBlocks = options.sfcBlocks === true ? {} : options.sfcBlocks ?? {};

  const { indent = 2 } = typeof stylistic === "boolean" ? {} : stylistic;

  if (a11y) {
    await ensurePackages(["eslint-plugin-vuejs-accessibility"]);
  }

  const [pluginVue, parserVue, processorVueBlocks, pluginVueA11y] = await Promise.all([
    interopDefault(import("eslint-plugin-vue")),
    interopDefault(import("vue-eslint-parser")),
    interopDefault(import("eslint-processor-vue-blocks")),
    ...(a11y ? [interopDefault(import("eslint-plugin-vuejs-accessibility"))] : []),
  ] as const);

  return [
    {
      // 通过声明常用组合式 API 的全局读权限，让自动导入正常生效（参考 https://github.com/vuejs/eslint-plugin-vue/pull/2422）
      languageOptions: {
        globals: {
          computed: "readonly",
          defineEmits: "readonly",
          defineExpose: "readonly",
          defineProps: "readonly",
          onMounted: "readonly",
          onUnmounted: "readonly",
          reactive: "readonly",
          ref: "readonly",
          shallowReactive: "readonly",
          shallowRef: "readonly",
          toRef: "readonly",
          toRefs: "readonly",
          watch: "readonly",
          watchEffect: "readonly",
        },
      },
      name: "senran/vue/setup",
      plugins: {
        vue: pluginVue,
        ...(a11y ? { "vue-a11y": pluginVueA11y } : {}),
      },
    },
    {
      files,
      languageOptions: {
        parser: parserVue,
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
          extraFileExtensions: [".vue"],
          parser: options.typescript ? ((await interopDefault(import("@typescript-eslint/parser"))) as any) : null,
          sourceType: "module",
        },
      },
      name: "senran/vue/rules",
      processor:
        sfcBlocks === false
          ? pluginVue.processors[".vue"]
          : mergeProcessors([
              pluginVue.processors[".vue"],
              processorVueBlocks({
                ...sfcBlocks,
                blocks: {
                  styles: true,
                  ...sfcBlocks.blocks,
                },
              }),
            ]),
      rules: {
        // --- Vue 官方推荐规则集合 + 版本差异兼容 ---
        ...(pluginVue.configs.base.rules as any),

        ...(vueVersion === 2
          ? {
              ...(pluginVue.configs["vue2-essential"].rules as any),
              ...(pluginVue.configs["vue2-strongly-recommended"].rules as any),
              ...(pluginVue.configs["vue2-recommended"].rules as any),
            }
          : {
              ...(pluginVue.configs["flat/essential"].map(c => c.rules).reduce((acc, c) => ({ ...acc, ...c }), {}) as any),
              ...(pluginVue.configs["flat/strongly-recommended"].map(c => c.rules).reduce((acc, c) => ({ ...acc, ...c }), {}) as any),
              ...(pluginVue.configs["flat/recommended"].map(c => c.rules).reduce((acc, c) => ({ ...acc, ...c }), {}) as any),
            }),

        "node/prefer-global/process": "off", // SFC 内可直接访问 process
        "ts/explicit-function-return-type": "off", // Vue 组件允许推断返回类型

        "vue/block-order": [
          "error",
          {
            order: ["script", "template", "style"],
          },
        ], // 统一 SFC 区块排列
        // 强制只允许 `<script setup>`
        "vue/component-api-style": ["error", ["script-setup"]], // 仅接受 script setup
        "vue/component-name-in-template-casing": [
          "error",
          "PascalCase",
          {
            globals: ["RouterView", "RouterLink"],
            registeredComponentsOnly: false,
          },
        ], // 模板中组件名使用 PascalCase
        "vue/component-options-name-casing": ["error", "PascalCase"], // options API 的 name 字段也用 PascalCase
        // this is deprecated
        "vue/component-tags-order": "off", // 此规则已废弃
        "vue/custom-event-name-casing": ["error", "camelCase"], // 自定义事件名使用 camelCase
        "vue/define-macros-order": [
          "error",
          {
            order: ["defineOptions", "defineProps", "defineEmits", "defineSlots"],
          },
        ], // define* 宏按顺序声明
        "vue/dot-location": ["error", "property"], // 多行链式访问点号在前
        "vue/dot-notation": ["error", { allowKeywords: true }], // Vue 代码也要求点访问
        "vue/eqeqeq": ["error", "smart"], // 同 JS：仅允许 null 宽松比较
        "vue/html-indent": ["error", indent], // template 缩进继承 indent
        "vue/html-quotes": ["error", "double"], // HTML 属性使用双引号
        "vue/max-attributes-per-line": "off", // 允许多属性同一行
        "vue/multi-word-component-names": "off", // 允许单词组件名
        "vue/no-dupe-keys": "off", // 交给 TS/JS 处理
        "vue/no-empty-pattern": "error", // 解构不可为空
        "vue/no-irregular-whitespace": "error", // 禁止异常空白
        "vue/no-loss-of-precision": "error", // 数值保持精度
        "vue/no-restricted-syntax": ["error", "DebuggerStatement", "LabeledStatement", "WithStatement"], // 同 JS 限制
        "vue/no-restricted-v-bind": ["error", "/^v-/"], // 禁止绑定以 v- 开头的属性
        "vue/no-setup-props-reactivity-loss": "off", // 允许 Props 解构
        "vue/no-sparse-arrays": "error", // 模板数组不可稀疏
        "vue/no-unused-refs": "error", // ref 必须使用
        "vue/no-useless-v-bind": "error", // 不要绑定常量
        "vue/no-v-html": "off", // 允许 v-html
        "vue/object-shorthand": [
          "error",
          "always",
          {
            avoidQuotes: true,
            ignoreConstructors: false,
          },
        ], // 对象属性使用简写
        "vue/prefer-separate-static-class": "error", // 静态 class 与动态 class 分开
        "vue/prefer-template": "error", // 使用模板字符串代替字符串拼接
        "vue/prop-name-casing": ["error", "camelCase"], // props 命名 camelCase
        "vue/require-default-prop": "off", // 可不写 prop 默认值
        "vue/require-prop-types": "off", // TypeScript 已负责
        "vue/space-infix-ops": "error", // 运算符左右留空格
        "vue/space-unary-ops": ["error", { nonwords: false, words: true }], // 一元运算符格式

        ...(stylistic
          ? {
              "vue/array-bracket-spacing": ["error", "never"],
              "vue/arrow-spacing": ["error", { after: true, before: true }], // 箭头函数空格
              "vue/block-spacing": ["error", "always"], // 块内空格
              "vue/block-tag-newline": [
                "error",
                {
                  multiline: "always",
                  singleline: "always",
                },
              ],
              "vue/brace-style": ["error", "1tbs", { allowSingleLine: false }], // 花括号风格
              "vue/comma-dangle": ["error", "always-multiline"],
              "vue/comma-spacing": ["error", { after: true, before: false }],
              "vue/comma-style": ["error", "last"],
              "vue/html-comment-content-spacing": [
                "error",
                "always",
                {
                  exceptions: ["-"],
                },
              ],
              "vue/key-spacing": ["error", { afterColon: true, beforeColon: false }],
              "vue/keyword-spacing": ["error", { after: true, before: true }],
              "vue/object-curly-newline": "off",
              "vue/object-curly-spacing": ["error", "always"],
              "vue/object-property-newline": ["error", { allowMultiplePropertiesPerLine: true }],
              "vue/operator-linebreak": ["error", "before"],
              "vue/padding-line-between-blocks": ["error", "always"],
              "vue/quote-props": ["error", "consistent-as-needed"],
              "vue/space-in-parens": ["error", "never"],
              "vue/template-curly-spacing": "error", // 模板插值内不留空格
            }
          : {}),

        ...(a11y
          ? {
              "vue-a11y/alt-text": "error", // img 必须提供 alt
              "vue-a11y/anchor-has-content": "error", // a 标签需内容
              "vue-a11y/aria-props": "error", // aria-* 属性合法
              "vue-a11y/aria-role": "error", // role 使用支持的值
              "vue-a11y/aria-unsupported-elements": "error", // 不支持 ARIA 的元素禁止使用
              "vue-a11y/click-events-have-key-events": "error", // click 需配键盘事件
              "vue-a11y/form-control-has-label": "error", // 表单控件需 label
              "vue-a11y/heading-has-content": "error", // heading 必须有内容
              "vue-a11y/iframe-has-title": "error", // iframe 需 title
              "vue-a11y/interactive-supports-focus": "error", // 交互元素需可聚焦
              "vue-a11y/label-has-for": "error", // label for 对应控件
              "vue-a11y/media-has-caption": "warn", // 视频需字幕
              "vue-a11y/mouse-events-have-key-events": "error", // 鼠标事件需键盘等价
              "vue-a11y/no-access-key": "error", // 禁用 accesskey
              "vue-a11y/no-aria-hidden-on-focusable": "error", // 可聚焦元素不可隐藏
              "vue-a11y/no-autofocus": "warn", // 避免自动聚焦
              "vue-a11y/no-distracting-elements": "error", // 禁用 marquee 等元素
              "vue-a11y/no-redundant-roles": "error", // 避免冗余 role
              "vue-a11y/no-role-presentation-on-focusable": "error", // 可聚焦元素不要 role=presentation
              "vue-a11y/no-static-element-interactions": "error", // 静态元素不应有交互事件
              "vue-a11y/role-has-required-aria-props": "error", // role 需配套 ARIA 属性
              "vue-a11y/tabindex-no-positive": "warn", // tabindex 不应为正值
            }
          : {}),

        ...overrides,
      },
    },
  ];
}
