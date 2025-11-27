import type { Linter } from "eslint"
import type {
  OptionsFiles,
  OptionsOverrides,
  OptionsProjectType,
  TypedFlatConfigItem,
  OptionsComponentExts,
  OptionsTypeScriptWithTypes,
  OptionsTypeScriptErasableOnly,
  OptionsTypeScriptParserOptions,
} from "../types"
import process from "node:process"
import { pluginFonds } from "../plugins"
import { renameRules, interopDefault } from "../utils"
import { GLOB_TS, GLOB_TSX, GLOB_ASTRO_TS, GLOB_MARKDOWN } from "../globs"

/**
 * TypeScript 配置。
 * 包含解析器设置、插件加载以及一系列针对 TS 的增强规则。
 * 支持类型感知 (Type-Aware) 的 Lint 规则。
 */
export async function typescript(
  options: OptionsFiles & OptionsComponentExts & OptionsOverrides & OptionsTypeScriptWithTypes & OptionsTypeScriptParserOptions & OptionsProjectType & OptionsTypeScriptErasableOnly = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    componentExts = [],
    erasableOnly = false,
    overrides = {},
    overridesTypeAware = {},
    parserOptions = {},
    type = "app",
  } = options

  // 默认匹配的文件
  const files = options.files ?? [
    GLOB_TS,
    GLOB_TSX,
    ...componentExts.map(ext => `**/*.${ext}`),
  ]

  // 类型感知规则适用的文件
  const filesTypeAware = options.filesTypeAware ?? [GLOB_TS, GLOB_TSX]
  const ignoresTypeAware = options.ignoresTypeAware ?? [
    `${GLOB_MARKDOWN}/**`, // Markdown 中的代码块通常无法解析类型
    GLOB_ASTRO_TS,
  ]
  const tsconfigPath = options?.tsconfigPath
    ? options.tsconfigPath
    : undefined
  const isTypeAware = !!tsconfigPath // 如果提供了 tsconfigPath，则启用类型感知规则

  // === 类型感知规则集 (Type-Aware Rules) ===
  // 这些规则需要完整的类型信息才能运行，通常更耗时但更准确
  const typeAwareRules: TypedFlatConfigItem["rules"] = {
    "dot-notation": "off", // 禁用 JS 版规则
    "no-implied-eval": "off",
    "ts/await-thenable": "error", // 禁止对非 Thenable 对象使用 await
    "ts/dot-notation": ["error", { allowKeywords: true }], // 强制使用点号访问属性 (类型安全版)
    "ts/no-floating-promises": "error", // 禁止未处理的 Promise (防止吞掉错误)
    "ts/no-for-in-array": "error", // 禁止对数组使用 for-in 循环
    "ts/no-implied-eval": "error", // 禁止隐式 eval (类型安全版)
    "ts/no-misused-promises": "error", // 防止 Promise 被误用 (例如作为 if 条件)
    "ts/no-unnecessary-type-assertion": "error", // 禁止不必要的类型断言 (类型已明确时)
    "ts/no-unsafe-argument": "error", // 禁止将 any 类型的值传给非 any 参数
    "ts/no-unsafe-assignment": "error", // 禁止将 any 类型赋值给变量
    "ts/no-unsafe-call": "error", // 禁止调用 any 类型的值
    "ts/no-unsafe-member-access": "error", // 禁止访问 any 类型对象的成员
    "ts/no-unsafe-return": "error", // 禁止返回 any 类型
    "ts/promise-function-async": "error", // 强制返回 Promise 的函数标记为 async
    "ts/restrict-plus-operands": "error", // 加号操作符的操作数必须类型兼容
    "ts/restrict-template-expressions": "error", // 模板字符串中的变量必须是字符串化安全的
    "ts/return-await": ["error", "in-try-catch"], // 强制在 try-catch 中使用 return await，其他地方禁用
    "ts/strict-boolean-expressions": ["error", { allowNullableBoolean: true, allowNullableObject: true }], // 严格的布尔值检查
    "ts/switch-exhaustiveness-check": "error", // 检查 switch 是否覆盖所有 case (配合联合类型非常有用)
    "ts/unbound-method": "error", // 方法被作为独立函数使用时必须绑定 this
  }

  const [
    pluginTs,
    parserTs,
  ] = await Promise.all([
    interopDefault(import("@typescript-eslint/eslint-plugin")),
    interopDefault(import("@typescript-eslint/parser")),
  ] as const)

  /**
   * 创建解析器配置的辅助函数。
   * 区分普通模式和类型感知模式。
   */
  function makeParser(typeAware: boolean, files: string[], ignores?: string[]): TypedFlatConfigItem {
    return {
      files,
      ...ignores ? { ignores } : {},
      languageOptions: {
        parser: parserTs,
        parserOptions: {
          extraFileExtensions: componentExts.map(ext => `.${ext}`),
          sourceType: "module",
          ...typeAware
            ? {
                // 类型感知所需的项目服务配置
                projectService: {
                  allowDefaultProject: ["./*.js"],
                  defaultProject: tsconfigPath,
                },
                tsconfigRootDir: process.cwd(),
              }
            : {},
          ...parserOptions as any,
        },
      },
      name: `fonds/typescript/${typeAware ? "type-aware-parser" : "parser"}`,
    }
  }

  return [
    {
      // 仅安装插件，不绑定文件匹配模式，以便后续灵活配置
      name: "fonds/typescript/setup",
      plugins: {
        fonds: pluginFonds,
        ts: pluginTs as any,
      },
    },
    // 分别为类型感知文件和普通文件配置解析器
    ...isTypeAware
      ? [
          makeParser(false, files),
          makeParser(true, filesTypeAware, ignoresTypeAware),
        ]
      : [
          makeParser(false, files),
        ],
    {
      files,
      name: "fonds/typescript/rules",
      rules: {
        // 继承 TS 推荐规则，并重命名插件前缀为 'ts'
        ...renameRules(
          pluginTs.configs["eslint-recommended"].overrides![0].rules!,
          { "@typescript-eslint": "ts" },
        ),
        ...renameRules(
          pluginTs.configs.strict.rules!,
          { "@typescript-eslint": "ts" },
        ),

        // === 禁用由 TS 编译器处理的 JS 规则 ===
        // 这些规则在 TS 环境下是多余的，甚至会导致误报
        "no-dupe-class-members": "off",
        "no-redeclare": "off",
        "no-use-before-define": "off",
        "no-useless-constructor": "off",

        // === TypeScript 核心规则 ===
        "ts/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description" }], // 允许 @ts-expect-error 但必须带描述
        "ts/consistent-type-definitions": ["error", "interface"], // 优先使用 interface 定义对象类型
        "ts/consistent-type-imports": ["error", { // 强制一致的类型导入风格
          disallowTypeAnnotations: false,
          fixStyle: "separate-type-imports",
          prefer: "type-imports", // 强制使用 import type
        }],

        "ts/method-signature-style": ["error", "property"], // 优先使用属性风格的方法签名 (利于类型推导)
        "ts/no-dupe-class-members": "error", // 禁止类成员重复
        "ts/no-dynamic-delete": "off", // 允许动态 delete
        "ts/no-empty-object-type": ["error", { allowInterfaces: "always" }], // 禁止空对象类型 (interface 除外)
        "ts/no-explicit-any": "off", // 允许 any (过于严格通常影响开发效率，但在 code review 中应注意)
        "ts/no-extraneous-class": "off", // 允许只有静态成员的类
        "ts/no-import-type-side-effects": "error", // 强制在类型导入中避免副作用
        "ts/no-invalid-void-type": "off", // 允许在泛型或返回值以外的地方使用 void
        "ts/no-non-null-assertion": "off", // 允许非空断言 (!)
        "ts/no-redeclare": ["error", { builtinGlobals: false }], // 禁止重复声明
        "ts/no-require-imports": "error", // 禁止 require (应使用 import)
        "ts/no-unused-expressions": ["error", {
          allowShortCircuit: true,
          allowTaggedTemplates: true,
          allowTernary: true,
        }],
        "ts/no-unused-vars": "off", // 由 unused-imports 插件处理
        "ts/no-use-before-define": "off", // 允许定义前使用 (TS 处理得很好)
        "ts/no-useless-constructor": "off", // 允许“无用”构造函数 (有时为了依赖注入或框架要求)
        "ts/no-wrapper-object-types": "error", // 禁止使用包装对象类型 (如 Number, String, Boolean)
        "ts/triple-slash-reference": "off", // 允许三斜杠指令
        "ts/unified-signatures": "off", // 不强制统一重载签名

        // === 库模式特定规则 ===
        ...(type === "lib"
          ? {
              "ts/explicit-function-return-type": ["error", { // 库的公开函数必须显式声明返回类型
                allowExpressions: true,
                allowHigherOrderFunctions: true,
                allowIIFEs: true,
              }],
            }
          : {}
        ),
        ...overrides,
      },
    },
    // 应用类型感知规则
    ...isTypeAware
      ? [{
          files: filesTypeAware,
          ignores: ignoresTypeAware,
          name: "fonds/typescript/rules-type-aware",
          rules: {
            ...typeAwareRules,
            ...overridesTypeAware,
          },
        }]
      : [],
    // === 仅可擦除语法 (Erasable Syntax Only) ===
    // 确保代码可以被简单的转译器 (如 esbuild, swc) 直接移除类型后运行，不依赖复杂的编译逻辑
    ...erasableOnly
      ? [
          {
            name: "fonds/typescript/erasable-syntax-only",
            plugins: {
              "erasable-syntax-only": await interopDefault(import("eslint-plugin-erasable-syntax-only")),
            },
            rules: {
              "erasable-syntax-only/enums": "error", // 禁止 enum (运行时有开销)
              "erasable-syntax-only/import-aliases": "error",
              "erasable-syntax-only/namespaces": "error", // 禁止 namespace
              "erasable-syntax-only/parameter-properties": "error", // 禁止构造函数参数属性 (public constructor(public x: number))
            } as Record<string, Linter.RuleEntry>,
          },
        ]
      : [],
  ]
}
