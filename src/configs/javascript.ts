import type { OptionsOverrides, OptionsIsInEditor, TypedFlatConfigItem } from "../types"

import globals from "globals"

import { pluginFonds, pluginUnusedImports } from "../plugins"

/**
 * 基础 JavaScript 配置。
 * 包含所有项目通用的核心规则，定义了语言环境、全局变量和基本代码质量标准。
 */
export async function javascript(
  options: OptionsIsInEditor & OptionsOverrides = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    isInEditor = false,
    overrides = {},
  } = options

  return [
    {
      // 语言选项设置
      languageOptions: {
        ecmaVersion: "latest", // 使用最新的 ECMAScript 解析器
        globals: {
          ...globals.browser,
          ...globals.es2021,
          ...globals.node,
          // 明确将常用全局变量设为只读，防止意外覆盖
          document: "readonly",
          navigator: "readonly",
          window: "readonly",
        },
        parserOptions: {
          ecmaFeatures: {
            jsx: true, // 默认支持 JSX
          },
          ecmaVersion: "latest",
          sourceType: "module", // 默认使用 ESM 模块
        },
        sourceType: "module",
      },
      // Linter 选项
      linterOptions: {
        reportUnusedDisableDirectives: true, // 报告未使用的 eslint-disable 注释，保持代码整洁
      },
      name: "fonds/javascript/setup",
    },
    {
      name: "fonds/javascript/rules",
      plugins: {
        "fonds": pluginFonds,
        "unused-imports": pluginUnusedImports,
      },
      rules: {
        // === 访问器与回调 ===
        "accessor-pairs": ["error", { enforceForClassMembers: true, setWithoutGet: true }], // 强制 getter/setter 成对出现
        "array-callback-return": "error", // 强制数组方法的回调函数有返回值

        // === 作用域与变量 ===
        "block-scoped-var": "error", // 强制将变量使用限制在块级作用域内
        "constructor-super": "error", // 验证构造函数中 super() 的调用
        "default-case-last": "error", // switch 语句中 default 必须在最后
        "dot-notation": ["error", { allowKeywords: true }], // 优先使用点号访问属性，而非 []
        "eqeqeq": ["error", "smart"], // 强制使用 === (智能模式：允许 null 比较等少数情况)
        "fonds/no-top-level-await": "error", // 默认禁止顶层 await (避免副作用和打包问题)，可在脚本中豁免
        "new-cap": ["error", { capIsNew: false, newIsCap: true, properties: true }], // 构造函数必须首字母大写
        "no-alert": "error", // 禁止使用 alert, confirm, prompt
        "no-array-constructor": "error", // 禁止使用 Array 构造函数
        "no-async-promise-executor": "error", // 禁止使用异步函数作为 Promise executor
        "no-caller": "error", // 禁止使用 arguments.caller 或 arguments.callee
        "no-case-declarations": "error", // 禁止在 case 子句中声明变量 (需用大括号包围)
        "no-class-assign": "error", // 禁止修改类声明的变量
        "no-compare-neg-zero": "error", // 禁止与 -0 进行比较
        "no-cond-assign": ["error", "always"], // 禁止在条件判断中赋值，防止误写
        "no-const-assign": "error", // 禁止修改 const 声明的变量
        "no-control-regex": "error", // 禁止在正则表达式中使用控制字符
        "no-debugger": "error", // 禁止使用 debugger
        "no-delete-var": "error", // 禁止删除变量 (仅允许删除属性)
        "no-dupe-args": "error", // 禁止函数参数重名
        "no-dupe-class-members": "error", // 禁止类成员重名
        "no-dupe-keys": "error", // 禁止对象键名重复
        "no-duplicate-case": "error", // 禁止 switch 中重复的 case 标签
        "no-empty": ["error", { allowEmptyCatch: true }], // 禁止空块语句 (允许空的 catch 块)
        "no-empty-character-class": "error", // 禁止正则表达式中的空字符类
        "no-empty-pattern": "error", // 禁止空的解构模式
        "no-eval": "error", // 禁用 eval
        "no-ex-assign": "error", // 禁止在 catch 子句中重新分配异常变量
        "no-extend-native": "error", // 禁止扩展原生对象
        "no-extra-bind": "error", // 禁止不必要的 .bind() 调用
        "no-extra-boolean-cast": "error", // 禁止不必要的布尔转换 (如 !!true)
        "no-fallthrough": "error", // 禁止 switch case 落空 (除非有注释)
        "no-func-assign": "error", // 禁止重写函数声明
        "no-global-assign": "error", // 禁止对原生对象或只读全局变量进行赋值
        "no-implied-eval": "error", // 禁止隐式 eval (如 setTimeout("alert(1)"))
        "no-import-assign": "error", // 禁止对导入的模块进行赋值
        "no-invalid-regexp": "error", // 禁止无效的正则表达式
        "no-irregular-whitespace": "error", // 禁止不规则的空白符
        "no-iterator": "error", // 禁止使用 __iterator__ 属性
        "no-labels": ["error", { allowLoop: false, allowSwitch: false }], // 禁用标签语句
        "no-lone-blocks": "error", // 禁止不必要的嵌套块
        "no-loss-of-precision": "error", // 禁止数字字面量精度丢失
        "no-misleading-character-class": "error", // 禁止正则表达式中可能产生误解的字符类
        "no-multi-str": "error", // 禁止多行字符串 (使用 \ 连接)
        "no-new": "error", // 禁止使用 new 为了副作用 (不赋值)
        "no-new-func": "error", // 禁止使用 Function 构造函数
        "no-new-native-nonconstructor": "error", // 禁止将原生非构造函数当作构造函数使用 (如 Symbol)
        "no-new-wrappers": "error", // 禁止使用原始包装实例 (如 new String)
        "no-obj-calls": "error", // 禁止将 Math, JSON 等作为函数调用
        "no-octal": "error", // 禁止八进制字面量
        "no-octal-escape": "error", // 禁止八进制转义序列
        "no-proto": "error", // 禁用 __proto__
        "no-prototype-builtins": "error", // 禁止直接调用 Object.prototype 的方法
        "no-redeclare": ["error", { builtinGlobals: false }], // 禁止重新声明变量
        "no-regex-spaces": "error", // 禁止正则表达式中出现多个连续空格

        // === 全局变量限制 ===
        // 限制使用特定的全局变量，推荐使用标准化的替代品
        "no-restricted-globals": [
          "error",
          { message: "Use `globalThis` instead.", name: "global" },
          { message: "Use `globalThis` instead.", name: "self" },
        ],
        "no-restricted-properties": [
          "error",
          { message: "Use `Object.getPrototypeOf` or `Object.setPrototypeOf` instead.", property: "__proto__" },
          { message: "Use `Object.defineProperty` instead.", property: "__defineGetter__" },
          { message: "Use `Object.defineProperty` instead.", property: "__defineSetter__" },
          { message: "Use `Object.getOwnPropertyDescriptor` instead.", property: "__lookupGetter__" },
          { message: "Use `Object.getOwnPropertyDescriptor` instead.", property: "__lookupSetter__" },
        ],

        // === 语法限制 ===
        // 禁止某些特定语法
        "no-restricted-syntax": [
          "error",
          "TSEnumDeclaration[const=true]", // 禁止 const enum (构建工具兼容性差)
          "TSExportAssignment", // 禁止 export = (推荐 ESM)
        ],
        "no-self-assign": ["error", { props: true }], // 禁止自我赋值
        "no-self-compare": "error", // 禁止自身比较
        "no-sequences": "error", // 禁用逗号操作符
        "no-shadow-restricted-names": "error", // 禁止覆盖受限制的标识符 (如 arguments)
        "no-sparse-arrays": "error", // 禁止稀疏数组
        "no-template-curly-in-string": "error", // 防止在常规字符串中误用模板字符串语法
        "no-this-before-super": "error", // 禁止在 super() 之前使用 this
        "no-throw-literal": "error", // 禁止抛出字面量错误 (应抛出 Error 对象)
        "no-undef": "error", // 禁止使用未定义的变量
        "no-undef-init": "error", // 禁止将变量初始化为 undefined
        "no-unexpected-multiline": "error", // 禁止令人困惑的多行表达式
        "no-unmodified-loop-condition": "error", // 禁用未修改的循环条件
        "no-unneeded-ternary": ["error", { defaultAssignment: false }], // 禁止不必要的三元表达式
        "no-unreachable": "error", // 禁止无法执行的代码
        "no-unreachable-loop": "error", // 禁止只有一次迭代的循环
        "no-unsafe-finally": "error", // 禁止在 finally 块中使用控制流语句
        "no-unsafe-negation": "error", // 禁止对关系操作符的左操作数使用否定操作符
        "no-unused-expressions": ["error", { // 禁止未使用的表达式
          allowShortCircuit: true,
          allowTaggedTemplates: true,
          allowTernary: true,
        }],
        "no-unused-vars": ["error", { // 禁止未使用的变量
          args: "none",
          caughtErrors: "none",
          ignoreRestSiblings: true,
          vars: "all",
        }],
        "no-use-before-define": ["error", { classes: false, functions: false, variables: true }], // 禁止在定义前使用变量
        "no-useless-backreference": "error", // 禁止正则表达式中无用的反向引用
        "no-useless-call": "error", // 禁止不必要的 .call() 和 .apply()
        "no-useless-catch": "error", // 禁止不必要的 catch 子句
        "no-useless-computed-key": "error", // 禁止对象中不必要的计算属性键
        "no-useless-constructor": "error", // 禁止不必要的构造函数
        "no-useless-rename": "error", // 禁止在 import/export 中进行同名重命名
        "no-useless-return": "error", // 禁止多余的 return 语句
        "no-var": "error", // 强制使用 let/const，禁止 var
        "no-with": "error", // 禁用 with 语句
        "object-shorthand": [ // 强制对象字面量简写语法
          "error",
          "always",
          {
            avoidQuotes: true,
            ignoreConstructors: false,
          },
        ],
        "one-var": ["error", { initialized: "never" }], // 强制变量声明分开写
        "prefer-arrow-callback": [ // 优先使用箭头函数作为回调
          "error",
          {
            allowNamedFunctions: false,
            allowUnboundThis: true,
          },
        ],
        // 优先使用 const
        // 在编辑器模式下仅作为警告，避免编码过程中频繁报错干扰
        "prefer-const": [
          isInEditor ? "warn" : "error",
          {
            destructuring: "all",
            ignoreReadBeforeAssign: true,
          },
        ],
        "prefer-exponentiation-operator": "error", // 优先使用 ** 操作符
        "prefer-promise-reject-errors": "error", // 强制 Promise.reject() 传递 Error 对象
        "prefer-regex-literals": ["error", { disallowRedundantWrapping: true }], // 优先使用正则字面量
        "prefer-rest-params": "error", // 优先使用剩余参数 (...args) 而非 arguments
        "prefer-spread": "error", // 优先使用扩展运算符 (...) 而非 .apply()
        "prefer-template": "error", // 优先使用模板字符串而非字符串拼接
        "symbol-description": "error", // Symbol 创建时必须带描述
        "unicode-bom": ["error", "never"], // 禁止 Unicode BOM

        // === 插件规则 ===
        // 未使用的导入：在编辑器中作为警告，CLI中报错
        "unused-imports/no-unused-imports": isInEditor ? "warn" : "error",
        "unused-imports/no-unused-vars": [
          "error",
          {
            args: "after-used",
            argsIgnorePattern: "^_", // 忽略以 _ 开头的变量
            ignoreRestSiblings: true,
            vars: "all",
            varsIgnorePattern: "^_",
          },
        ],
        "use-isnan": ["error", { enforceForIndexOf: true, enforceForSwitchCase: true }], // 强制使用 isNaN() 检查 NaN
        "valid-typeof": ["error", { requireStringLiterals: true }], // 强制 typeof 表达式与有效字符串比较
        "vars-on-top": "error", // 要求 var 声明在作用域顶部
        "yoda": ["error", "never"], // 禁止 Yoda 条件 (变量在前，字面量在后)

        ...overrides,
      },
    },
  ]
}
