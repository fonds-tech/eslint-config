/**
 * TypeScript 配置模块
 * 为 TypeScript 文件和功能配置 ESLint 规则
 */

import type { OptionsFiles, OptionsOverrides, OptionsProjectType, TypedFlatConfigItem, OptionsComponentExts, OptionsTypeScriptWithTypes, OptionsTypeScriptParserOptions } from "../types";

import process from "node:process";
import { renameRules, interopDefault } from "../utils";
import { GLOB_TS, GLOB_TSX, GLOB_ASTRO_TS, GLOB_MARKDOWN } from "../globs";

/**
 * TypeScript 栈的核心配置：自动挂载解析器、根据 `tsconfigPath` 区分类型感知/非感知文件，并提供 `type`、`componentExts` 等拓展选项。
 */
export async function typescript(
  options: OptionsFiles & OptionsComponentExts & OptionsOverrides & OptionsTypeScriptWithTypes & OptionsTypeScriptParserOptions & OptionsProjectType = {},
): Promise<TypedFlatConfigItem[]> {
  const { componentExts = [], overrides = {}, overridesTypeAware = {}, parserOptions = {}, type = "app" } = options;

  const files = options.files ?? [GLOB_TS, GLOB_TSX, ...componentExts.map(ext => `**/*.${ext}`)];

  const filesTypeAware = options.filesTypeAware ?? [GLOB_TS, GLOB_TSX];
  const ignoresTypeAware = options.ignoresTypeAware ?? [`${GLOB_MARKDOWN}/**`, GLOB_ASTRO_TS];
  const tsconfigPath = options?.tsconfigPath ? options.tsconfigPath : undefined;
  const isTypeAware = !!tsconfigPath;

  const typeAwareRules: TypedFlatConfigItem["rules"] = {
    "dot-notation": "off",
    "no-implied-eval": "off",
    "ts/await-thenable": "error",
    "ts/dot-notation": ["error", { allowKeywords: true }],
    "ts/no-floating-promises": "error",
    "ts/no-for-in-array": "error",
    "ts/no-implied-eval": "error",
    "ts/no-misused-promises": "error",
    "ts/no-unnecessary-type-assertion": "error",
    "ts/no-unsafe-argument": "error",
    "ts/no-unsafe-assignment": "error",
    "ts/no-unsafe-call": "error",
    "ts/no-unsafe-member-access": "error",
    "ts/no-unsafe-return": "error",
    "ts/promise-function-async": "error",
    "ts/restrict-plus-operands": "error",
    "ts/restrict-template-expressions": "error",
    "ts/return-await": ["error", "in-try-catch"],
    "ts/strict-boolean-expressions": ["error", { allowNullableBoolean: true, allowNullableObject: true }],
    "ts/switch-exhaustiveness-check": "error",
    "ts/unbound-method": "error",
  };

  const [pluginTs, parserTs] = await Promise.all([interopDefault(import("@typescript-eslint/eslint-plugin")), interopDefault(import("@typescript-eslint/parser"))] as const);

  function makeParser(typeAware: boolean, files: string[], ignores?: string[]): TypedFlatConfigItem {
    return {
      files,
      ...(ignores ? { ignores } : {}),
      languageOptions: {
        parser: parserTs,
        parserOptions: {
          extraFileExtensions: componentExts.map(ext => `.${ext}`),
          sourceType: "module",
          ...(typeAware
            ? {
                projectService: {
                  allowDefaultProject: ["./*.js"],
                  defaultProject: tsconfigPath,
                },
                tsconfigRootDir: process.cwd(),
              }
            : {}),
          ...(parserOptions as any),
        },
      },
      name: `senran/typescript/${typeAware ? "type-aware-parser" : "parser"}`,
    };
  }

  return [
    {
      // 预先安装插件但不匹配具体文件，方便下方根据不同 globs 细分配置
      name: "senran/typescript/setup",
      plugins: {
        ts: pluginTs as any,
      },
    },
    // 若提供 tsconfig，则区分类型感知与普通文件使用不同的 parser 配置
    ...(isTypeAware ? [makeParser(false, files), makeParser(true, filesTypeAware, ignoresTypeAware)] : [makeParser(false, files)]),
    {
      files,
      name: "senran/typescript/rules",
      rules: {
        // --- 基础：沿用 TS 插件推荐规则并与原生 ESLint 去重 ---
        ...renameRules(pluginTs.configs["eslint-recommended"].overrides![0].rules!, { "@typescript-eslint": "ts" }),
        ...renameRules(pluginTs.configs.strict.rules!, { "@typescript-eslint": "ts" }),
        "no-dupe-class-members": "off", // 由 ts/no-dupe-class-members 接管
        "no-redeclare": "off", // 使用 TS 版本避免误报
        "no-use-before-define": "off", // 同上
        "no-useless-constructor": "off", // 交给 TS 规则判断
        "ts/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description" }], // 允许带描述的 @ts-expect-error
        "ts/consistent-type-definitions": ["error", "interface"], // 统一使用 interface
        "ts/consistent-type-imports": [
          "error",
          {
            disallowTypeAnnotations: false,
            fixStyle: "separate-type-imports",
            prefer: "type-imports",
          },
        ], // type-only import/export

        "ts/method-signature-style": ["error", "property"], // method 使用属性式声明，便于一致性
        "ts/no-dupe-class-members": "error", // 禁止在类型系统中重复成员
        "ts/no-dynamic-delete": "off", // 允许 delete 任意属性
        "ts/no-empty-object-type": ["error", { allowInterfaces: "always" }], // 禁止 {} 作为返回类型
        "ts/no-explicit-any": "off", // 允许 any（由项目自行控制）
        "ts/no-extraneous-class": "off", // 允许空类用于模式
        "ts/no-import-type-side-effects": "error", // type import 中不得带副作用
        "ts/no-invalid-void-type": "off", // 允许 void 用于泛型
        "ts/no-non-null-assertion": "off", // 允许使用 !
        "ts/no-redeclare": ["error", { builtinGlobals: false }], // 防止类型/变量重复声明
        "ts/no-require-imports": "error", // 禁止 require，引导到 import
        "ts/no-unused-expressions": [
          "error",
          {
            allowShortCircuit: true,
            allowTaggedTemplates: true,
            allowTernary: true,
          },
        ], // 阻止类型层面的无意义表达式
        "ts/no-unused-vars": "off", // 使用 unused-imports/no-unused-vars
        "ts/no-use-before-define": ["error", { classes: false, functions: false, variables: true }], // TypeScript 版本的提前使用守护
        "ts/no-useless-constructor": "off", // 允许装饰器等场景使用空构造
        "ts/no-wrapper-object-types": "error", // 禁止使用 Wrapper 类型（String/Number）
        "ts/triple-slash-reference": "off", // 允许三斜线引用
        "ts/unified-signatures": "off", // 允许重复签名用于重载

        ...(type === "lib"
          ? {
              // --- 库模式：要求显式函数返回类型，便于对外 API ---
              "ts/explicit-function-return-type": [
                "error",
                {
                  allowExpressions: true,
                  allowHigherOrderFunctions: true,
                  allowIIFEs: true,
                },
              ],
            }
          : {}),
        ...overrides,
      },
    },
    ...(isTypeAware
      ? [
          {
            files: filesTypeAware,
            ignores: ignoresTypeAware,
            name: "senran/typescript/rules-type-aware",
            rules: {
              // --- 类型感知规则：聚焦 Promise/类型安全 ---
              ...typeAwareRules,
              ...overridesTypeAware,
            },
          },
        ]
      : []),
  ];
}
