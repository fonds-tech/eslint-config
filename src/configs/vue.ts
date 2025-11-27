import type {
  OptionsVue,
  OptionsFiles,
  OptionsOverrides,
  OptionsStylistic,
  TypedFlatConfigItem,
  OptionsHasTypeScript,
} from "../types"

import { GLOB_VUE } from "../globs"
import { mergeProcessors } from "eslint-merge-processors"
import { ensurePackages, interopDefault } from "../utils"

/**
 * Vue.js 配置。
 * 包含 Vue SFC 解析、特有的模板规则、可访问性检查 (a11y) 以及代码风格规则。
 */
export async function vue(
  options: OptionsVue & OptionsHasTypeScript & OptionsOverrides & OptionsStylistic & OptionsFiles = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    a11y = false, // 是否启用可访问性检查
    files = [GLOB_VUE],
    overrides = {},
    stylistic = true,
    vueVersion = 3, // 默认为 Vue 3
  } = options

  // SFC 块处理选项 (如 <i18n>)
  const sfcBlocks = options.sfcBlocks === true
    ? {}
    : options.sfcBlocks ?? {}

  const {
    indent = 2,
  } = typeof stylistic === "boolean" ? {} : stylistic

  // 如果启用了 a11y，确保安装了相关插件
  if (a11y) {
    await ensurePackages([
      "eslint-plugin-vuejs-accessibility",
    ])
  }

  const [
    pluginVue,
    parserVue,
    processorVueBlocks,
    pluginVueA11y,
  ] = await Promise.all([
    interopDefault(import("eslint-plugin-vue")),
    interopDefault(import("vue-eslint-parser")),
    interopDefault(import("eslint-processor-vue-blocks")),
    ...a11y ? [interopDefault(import("eslint-plugin-vuejs-accessibility"))] : [],
  ] as const)

  return [
    {
      // 初始化 Vue 插件并配置全局变量
      // 解决自动导入 (Auto Imports) 导致的未定义变量报错
      // https://github.com/vuejs/eslint-plugin-vue/pull/2422
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
      name: "fonds/vue/setup",
      plugins: {
        vue: pluginVue,
        ...a11y ? { "vue-a11y": pluginVueA11y } : {},
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
          // 如果启用了 TypeScript，则使用 TS 解析器解析 <script> 内容
          parser: options.typescript
            ? await interopDefault(import("@typescript-eslint/parser")) as any
            : null,
          sourceType: "module",
        },
      },
      name: "fonds/vue/rules",
      // 配置处理器，支持自定义块
      processor: sfcBlocks === false
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
        ...pluginVue.configs.base.rules as any,

        // 根据 Vue 版本加载推荐规则
        ...vueVersion === 2
          ? {
              ...pluginVue.configs["vue2-essential"].rules as any,
              ...pluginVue.configs["vue2-strongly-recommended"].rules as any,
              ...pluginVue.configs["vue2-recommended"].rules as any,
            }
          : {
              ...pluginVue.configs["flat/essential"].map(c => c.rules).reduce((acc, c) => ({ ...acc, ...c }), {}) as any,
              ...pluginVue.configs["flat/strongly-recommended"].map(c => c.rules).reduce((acc, c) => ({ ...acc, ...c }), {}) as any,
              ...pluginVue.configs["flat/recommended"].map(c => c.rules).reduce((acc, c) => ({ ...acc, ...c }), {}) as any,
            },

        // 禁用部分冲突规则
        "fonds/no-top-level-await": "off", // Vue SFC 中支持顶层 await
        "node/prefer-global/process": "off",
        "ts/explicit-function-return-type": "off",

        // === Vue 风格指南规则 ===
        "vue/attribute-hyphenation": ["error", "always"], // 属性名使用连字符 (v-bind:my-prop)
        "vue/block-order": ["error", {
          order: ["template", "script", "style"], // 统一 SFC 块顺序
        }],
        "vue/component-definition-name-casing": ["error", "kebab-case"], // 组件定义文件名使用 kebab-case
        "vue/component-name-in-template-casing": ["error", "kebab-case"], // 模板中使用组件也强制 kebab-case (HTML 标准)
        "vue/component-options-name-casing": ["error", "kebab-case"], // 组件选项名称使用 kebab-case
        // 已废弃规则
        "vue/component-tags-order": "off",
        "vue/custom-event-name-casing": ["error", "camelCase"], // 自定义事件名使用 camelCase
        "vue/define-macros-order": ["error", { // define 宏的顺序
          order: ["defineOptions", "defineProps", "defineEmits", "defineSlots"],
        }],
        "vue/dot-location": ["error", "property"], // 点号操作符应与属性在同一行
        "vue/dot-notation": ["error", { allowKeywords: true }], // 优先使用点号访问
        "vue/eqeqeq": ["error", "smart"], // 智能全等检查
        "vue/html-indent": ["error", indent], // HTML 缩进
        "vue/html-quotes": ["error", "double"], // HTML 属性使用双引号
        "vue/html-self-closing": "off", // 不强制自闭合 (配合 Prettier)
        "vue/max-attributes-per-line": "off", // 不强制每行属性数，交由 Prettier 处理
        "vue/multi-word-component-names": "off", // 不强制多词组件名 (有时简单的组件名更清晰)
        "vue/no-dupe-keys": "off", // 允许重复键 (TS 会处理)
        "vue/no-empty-pattern": "error", // 禁止空解构模式
        "vue/no-irregular-whitespace": "error", // 禁止不规则空白
        "vue/no-loss-of-precision": "error",
        "vue/no-restricted-syntax": [ // 禁止特定语法
          "error",
          "DebuggerStatement",
          "LabeledStatement",
          "WithStatement",
        ],
        "vue/no-restricted-v-bind": ["error", "/^v-/"], // 禁止 v-bind 使用 v- 前缀的属性 (防止 v-bind:v-if)
        "vue/no-setup-props-reactivity-loss": "off", // 允许解构 props (Vue 3.3+ destructure props 宏支持)
        "vue/no-sparse-arrays": "error",
        "vue/no-unused-refs": "error", // 禁止未使用的 ref
        "vue/no-useless-v-bind": "error", // 禁止无用的 v-bind
        "vue/no-v-html": "off", // 允许 v-html (需开发者自行注意 XSS)
        "vue/object-shorthand": [ // 对象简写
          "error",
          "always",
          {
            avoidQuotes: true,
            ignoreConstructors: false,
          },
        ],
        "vue/prefer-separate-static-class": "error", // 静态 class 应独立于 :class
        "vue/prefer-template": "error", // 优先使用模板字符串
        "vue/prop-name-casing": ["error", "camelCase"], // Prop 名称使用 camelCase
        "vue/require-default-prop": "off", // 不强制默认属性 (TS 环境下类型更重要)
        "vue/require-prop-types": "off", // 不强制 prop-types (使用 TS 类型)
        "vue/space-infix-ops": "error", // 操作符周围要有空格
        "vue/space-unary-ops": ["error", { nonwords: false, words: true }], // 一元操作符空格规范

        // === 风格规则 (如果启用) ===
        ...stylistic
          ? {
              "vue/array-bracket-spacing": ["error", "never"],
              "vue/arrow-spacing": ["error", { after: true, before: true }],
              "vue/block-spacing": ["error", "always"],
              "vue/block-tag-newline": ["error", {
                multiline: "always",
                singleline: "always",
              }],
              "vue/brace-style": ["error", "stroustrup", { allowSingleLine: true }],
              "vue/comma-dangle": ["error", "always-multiline"],
              "vue/comma-spacing": ["error", { after: true, before: false }],
              "vue/comma-style": ["error", "last"],
              "vue/html-comment-content-spacing": ["error", "always", {
                exceptions: ["-"],
              }],
              "vue/key-spacing": ["error", { afterColon: true, beforeColon: false }],
              "vue/keyword-spacing": ["error", { after: true, before: true }],
              "vue/object-curly-newline": "off",
              "vue/object-curly-spacing": ["error", "always"],
              "vue/object-property-newline": ["error", { allowAllPropertiesOnSameLine: true }],
              "vue/operator-linebreak": ["error", "before"],
              "vue/padding-line-between-blocks": ["error", "always"],
              "vue/quote-props": ["error", "consistent-as-needed"],
              "vue/space-in-parens": ["error", "never"],
              "vue/template-curly-spacing": "error",
            }
          : {},

        // === 可访问性规则 (如果启用) ===
        ...a11y
          ? {
              "vue-a11y/alt-text": "error", // 图像必须有 alt
              "vue-a11y/anchor-has-content": "error", // 链接必须有内容
              "vue-a11y/aria-props": "error", // ARIA 属性必须有效
              "vue-a11y/aria-role": "error", // ARIA 角色必须有效
              "vue-a11y/aria-unsupported-elements": "error", // 元素必须支持 ARIA
              "vue-a11y/click-events-have-key-events": "error", // 点击事件必须伴随键盘事件
              "vue-a11y/form-control-has-label": "error", // 表单控件必须有标签
              "vue-a11y/heading-has-content": "error", // 标题必须有内容
              "vue-a11y/iframe-has-title": "error", // iframe 必须有 title
              "vue-a11y/interactive-supports-focus": "error", // 交互元素必须可聚焦
              "vue-a11y/label-has-for": "error", // Label 必须指向控件
              "vue-a11y/media-has-caption": "warn", // 媒体元素应有字幕
              "vue-a11y/mouse-events-have-key-events": "error", // 鼠标事件必须伴随键盘事件
              "vue-a11y/no-access-key": "error", // 禁止 accesskey
              "vue-a11y/no-aria-hidden-on-focusable": "error", // 可聚焦元素不能 aria-hidden
              "vue-a11y/no-autofocus": "warn", // 警告 autofocus (影响用户体验)
              "vue-a11y/no-distracting-elements": "error", // 禁止 <marquee> 等干扰元素
              "vue-a11y/no-redundant-roles": "error", // 禁止冗余角色
              "vue-a11y/no-role-presentation-on-focusable": "error", // 可聚焦元素不能设为 presentation
              "vue-a11y/no-static-element-interactions": "error", // 静态元素不应交互
              "vue-a11y/role-has-required-aria-props": "error", // 角色必须包含必要的 ARIA 属性
              "vue-a11y/tabindex-no-positive": "warn", // 避免正值 tabindex
            }
          : {},

        ...overrides,
      },
    },
  ]
}
