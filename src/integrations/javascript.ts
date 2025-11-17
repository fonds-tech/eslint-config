/**
 * JavaScript 配置模块
 * 为 JavaScript 环境（包括浏览器、Node、ES2021 全局）配置核心规则
 */

import type { OptionsOverrides, OptionsIsInEditor, TypedFlatConfigItem } from "../types";
import globals from "globals";
import { pluginUnusedImports } from "../plugins";

/**
 * 提供纯 JavaScript 环境（含浏览器、Node、ES2021 全局）的核心规则，并允许在编辑器模式下降级部分提示。
 */
export async function javascript(options: OptionsIsInEditor & OptionsOverrides = {}): Promise<TypedFlatConfigItem[]> {
  const { isInEditor = false, overrides = {} } = options;

  return [
    {
      languageOptions: {
        ecmaVersion: 2022,
        globals: {
          ...globals.browser,
          ...globals.es2021,
          ...globals.node,
          document: "readonly",
          navigator: "readonly",
          window: "readonly",
        },
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
          ecmaVersion: 2022,
          sourceType: "module",
        },
        sourceType: "module",
      },
      linterOptions: {
        reportUnusedDisableDirectives: true,
      },
      name: "senran/javascript/setup",
    },
    {
      name: "senran/javascript/rules",
      plugins: {
        "unused-imports": pluginUnusedImports,
      },
      rules: {
        // --- 语法/运行时安全：杜绝易出错的写法 ---
        "accessor-pairs": ["error", { enforceForClassMembers: true, setWithoutGet: true }], // getter/setter 必须配对，防止数据不一致
        "array-callback-return": "error", // Array.prototype 回调必须返回值，避免隐式 undefined
        "block-scoped-var": "error", // var 必须在函数顶部定义，防止块级作用域误解
        "constructor-super": "error", // 派生类必须调用 super，避免原型链失效
        "default-case-last": "error", // switch 的 default 要放在最后，便于阅读
        "dot-notation": ["error", { allowKeywords: true }], // 尽量使用点号访问属性，避免引号
        "eqeqeq": ["error", "smart"], // 禁止 ==，仅允许 null 与 undefined 宽松比较
        "new-cap": ["error", { capIsNew: false, newIsCap: true, properties: true }], // 构造函数需以大写开头，普通函数不要 new
        "no-alert": "error", // 禁止 alert/confirm/prompt
        "no-array-constructor": "error", // 禁止 new Array，改用字面量
        "no-async-promise-executor": "error", // Promise executor 不可 async，防止隐式错误
        "no-caller": "error", // 禁止 arguments.callee/caller
        "no-case-declarations": "error", // switch case 内定义需包裹块，避免 TDZ
        "no-class-assign": "error", // 禁止修改类名绑定
        "no-compare-neg-zero": "error", // 避免比较 -0 与 0
        "no-cond-assign": ["error", "always"], // 条件判断内禁止赋值
        "no-console": ["error", { allow: ["warn", "error"] }], // 默认禁止 console，仅允许 warn/error
        "no-const-assign": "error", // const 不可重新赋值
        "no-control-regex": "error", // 禁止正则包含控制字符
        "no-debugger": "error", // 禁止 debugger
        "no-delete-var": "error", // 禁止 delete 变量
        "no-dupe-args": "error", // 函数参数不可重名
        "no-dupe-class-members": "error", // 类成员不可重复定义
        "no-dupe-keys": "error", // 对象属性不可重复
        "no-duplicate-case": "error", // switch case 不可重复
        "no-empty": ["error", { allowEmptyCatch: true }], // 禁止空块，允许空 catch
        "no-empty-character-class": "error", // 正则字符集不可为空
        "no-empty-pattern": "error", // 解构目标不可为空
        "no-eval": "error", // 禁用 eval
        "no-ex-assign": "error", // catch 参数不可重新赋值
        "no-extend-native": "error", // 禁止扩展内建对象
        "no-extra-bind": "error", // 无意义的 bind
        "no-extra-boolean-cast": "error", // 冗余布尔转换
        "no-fallthrough": "error", // switch case 必须 break
        "no-func-assign": "error", // 函数声明不可重新赋值
        "no-global-assign": "error", // 不允许给全局对象重新赋值
        "no-implied-eval": "error", // 禁止 setTimeout('code')
        "no-import-assign": "error", // 不可重新赋值 import
        "no-invalid-regexp": "error", // 正则语法合法
        "no-irregular-whitespace": "error", // 禁用零宽空格等
        "no-iterator": "error", // 禁用 __iterator__
        "no-labels": ["error", { allowLoop: false, allowSwitch: false }], // 禁用 label，防止 goto
        "no-lone-blocks": "error", // 禁用无用块
        "no-loss-of-precision": "error", // 数字字面量不能丢精度
        "no-misleading-character-class": "error", // 正则字符集不允许混用不同字符类别
        "no-multi-str": "error", // 禁用 \ 换行字符串
        "no-new": "error", // 禁止 new 无副作用构造
        "no-new-func": "error", // 禁止 new Function
        "no-new-native-nonconstructor": "error", // 禁用 new Math 等
        "no-new-wrappers": "error", // 禁止 new String/Number/Boolean
        "no-obj-calls": "error", // Math/JSON 不可当函数
        "no-octal": "error", // 禁用八进制字面量
        "no-octal-escape": "error", // 禁止八进制转义
        "no-proto": "error", // 禁止 __proto__ 属性
        "no-prototype-builtins": "error", // 不直接调用原型方法
        "no-redeclare": ["error", { builtinGlobals: false }], // 禁止重复声明
        "no-regex-spaces": "error", // 正则字面量不允许多空格
        "no-restricted-globals": ["error", { message: "Use `globalThis` instead.", name: "global" }, { message: "Use `globalThis` instead.", name: "self" }], // 鼓励使用 globalThis
        "no-restricted-properties": [
          "error",
          { message: "Use `Object.getPrototypeOf` or `Object.setPrototypeOf` instead.", property: "__proto__" }, // 避免魔法属性
          { message: "Use `Object.defineProperty` instead.", property: "__defineGetter__" },
          { message: "Use `Object.defineProperty` instead.", property: "__defineSetter__" },
          { message: "Use `Object.getOwnPropertyDescriptor` instead.", property: "__lookupGetter__" },
          { message: "Use `Object.getOwnPropertyDescriptor` instead.", property: "__lookupSetter__" },
        ],
        "no-restricted-syntax": ["error", "TSEnumDeclaration[const=true]", "TSExportAssignment"], // 禁用部分 TS 语法
        "no-self-assign": ["error", { props: true }], // 禁止 a = a
        "no-self-compare": "error", // 禁止 a === a
        "no-sequences": "error", // 禁止逗号表达式
        "no-shadow-restricted-names": "error", // 不可覆盖 eval/arguments 等
        "no-sparse-arrays": "error", // 禁用稀疏数组
        "no-template-curly-in-string": "error", // 普通字符串不允许 ${}
        "no-this-before-super": "error", // super 之前不能访问 this
        "no-throw-literal": "error", // 需抛出 Error
        "no-undef": "error", // 禁止未声明变量
        "no-undef-init": "error", // 不要显式赋 undefined
        "no-unexpected-multiline": "error", // 避免自动插入分号带来的歧义
        "no-unmodified-loop-condition": "error", // 循环条件必须修改
        "no-unneeded-ternary": ["error", { defaultAssignment: false }], // 禁止冗余三元
        "no-unreachable": "error", // return 后不能有代码
        "no-unreachable-loop": "error", // 永远无法到达的循环
        "no-unsafe-finally": "error", // finally 中禁止控制流语句
        "no-unsafe-negation": "error", // 禁止 !a in obj 等
        // --- 表达式与变量使用的最佳实践 ---
        "no-unused-expressions": [
          "error",
          {
            allowShortCircuit: true,
            allowTaggedTemplates: true,
            allowTernary: true,
          },
        ], // 禁止单独的表达式语句（除短路/模板/三元）
        "no-unused-vars": [
          "error",
          {
            args: "none",
            caughtErrors: "none",
            ignoreRestSiblings: true,
            vars: "all",
          },
        ], // 禁止声明未使用变量/参数
        "no-use-before-define": ["error", { classes: false, functions: false, variables: true }], // 使用前必须先声明
        "no-useless-backreference": "error", // 正则中不允许无效回溯
        "no-useless-call": "error", // Function.prototype.call/apply 不应传自身
        "no-useless-catch": "error", // 不处理的 catch 直接抛出
        "no-useless-computed-key": "error", // 对象属性不需要计算属性名时禁止使用 []
        "no-useless-constructor": "error", // 空构造函数无意义
        "no-useless-rename": "error", // import/export 重命名不能与原名一致
        "no-useless-return": "error", // 函数末尾不应多余 return
        "no-var": "error", // 禁用 var
        "no-with": "error", // 禁用 with
        // --- 语法糖与可读性偏好 ---
        "object-shorthand": [
          "error",
          "always",
          {
            avoidQuotes: true,
            ignoreConstructors: false,
          },
        ], // 优先使用对象属性简写
        "one-var": ["error", { initialized: "never" }], // 同一声明只定义一个变量
        "prefer-arrow-callback": [
          "error",
          {
            allowNamedFunctions: false,
            allowUnboundThis: true,
          },
        ], // 更偏好箭头函数回调
        "prefer-const": [
          isInEditor ? "warn" : "error",
          {
            destructuring: "all",
            ignoreReadBeforeAssign: true,
          },
        ], // 能 const 的即使用 const
        "prefer-exponentiation-operator": "error", // 使用 ** 替代 Math.pow
        "prefer-promise-reject-errors": "error", // reject 需 Error 对象
        "prefer-regex-literals": ["error", { disallowRedundantWrapping: true }], // 直接使用正则字面量
        "prefer-rest-params": "error", // 使用 ...args 取代 arguments
        "prefer-spread": "error", // 扩展运算符替代 apply
        "prefer-template": "error", // 使用模板字符串
        "symbol-description": "error", // new Symbol 需描述
        "unicode-bom": ["error", "never"], // 禁止写入 BOM
        // --- 未使用导入/变量的专项处理 ---
        "unused-imports/no-unused-imports": isInEditor ? "warn" : "error", // 删除未使用 import
        "unused-imports/no-unused-vars": [
          "error",
          {
            args: "after-used",
            argsIgnorePattern: "^_",
            ignoreRestSiblings: true,
            vars: "all",
            varsIgnorePattern: "^_",
          },
        ], // 允许使用 `_` 前缀忽略变量
        "use-isnan": ["error", { enforceForIndexOf: true, enforceForSwitchCase: true }], // 判断 NaN 必须用 isNaN
        "valid-typeof": ["error", { requireStringLiterals: true }], // typeof 比较必须是字符串
        "vars-on-top": "error", // var 必须在函数顶部
        "yoda": ["error", "never"], // 禁止 Yoda 条件写法

        // --- 外部输入的额外 overrides ---
        ...overrides,
      },
    },
  ];
}
