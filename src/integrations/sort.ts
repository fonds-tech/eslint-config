/**
 * 排序配置模块
 * 配置各种代码元素的排序和顺序规则
 */

import type { TypedFlatConfigItem } from "../types";
import { parserPlain } from "../utils";
import { pluginSenran } from "../plugins";
import { GLOB_CSS, GLOB_LESS, GLOB_SCSS } from "../globs";

/**
 * 针对 package.json 字段进行排序（依赖 jsonc 配置提供的解析器）。
 */
export async function sortPackageJson(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      files: ["**/package.json"],
      name: "senran/sort/package-json",
      rules: {
        // --- package.json 中 files/exports/依赖等字段的排序规则 ---
        "jsonc/sort-array-values": [
          "error",
          {
            order: { type: "asc" },
            pathPattern: "^files$",
          },
        ], // `files` 数组按字母排序
        "jsonc/sort-keys": [
          "error",
          {
            order: [
              "publisher",
              "name",
              "displayName",
              "type",
              "version",
              "private",
              "packageManager",
              "description",
              "author",
              "contributors",
              "license",
              "funding",
              "homepage",
              "repository",
              "bugs",
              "keywords",
              "categories",
              "sideEffects",
              "imports",
              "exports",
              "main",
              "module",
              "unpkg",
              "jsdelivr",
              "types",
              "typesVersions",
              "bin",
              "icon",
              "files",
              "engines",
              "activationEvents",
              "contributes",
              "scripts",
              "peerDependencies",
              "peerDependenciesMeta",
              "dependencies",
              "optionalDependencies",
              "devDependencies",
              "pnpm",
              "overrides",
              "resolutions",
              "husky",
              "simple-git-hooks",
              "lint-staged",
              "eslintConfig",
            ],
            pathPattern: "^$",
          },
          {
            order: { type: "asc" },
            pathPattern: "^(?:dev|peer|optional|bundled)?[Dd]ependencies(Meta)?$",
          },
          {
            order: { type: "asc" },
            pathPattern: "^(?:resolutions|overrides|pnpm.overrides)$",
          },
          {
            order: ["types", "import", "require", "default"],
            pathPattern: "^exports.*$",
          },
          {
            order: [
              // 仅在客户端执行的 Git hooks
              "pre-commit",
              "prepare-commit-msg",
              "commit-msg",
              "post-commit",
              "pre-rebase",
              "post-rewrite",
              "post-checkout",
              "post-merge",
              "pre-push",
              "pre-auto-gc",
            ],
            pathPattern: "^(?:gitHooks|husky|simple-git-hooks)$",
          },
        ], // package.json 顶层及依赖字段排序
      },
    },
  ];
}
/**
 * 统一 tsconfig*.json 的字段排序，便于在大型工程中保持一致（同样依赖 jsonc 解析）。
 */

export function sortTsconfig(): TypedFlatConfigItem[] {
  return [
    {
      files: ["**/[jt]sconfig.json", "**/[jt]sconfig.*.json"],
      name: "senran/sort/tsconfig-json",
      rules: {
        // --- tsconfig*.json 的顶层与 compilerOptions 排序 ---
        "jsonc/sort-keys": [
          "error",
          {
            order: ["extends", "compilerOptions", "references", "files", "include", "exclude"],
            pathPattern: "^$",
          },
          {
            order: [
              /* 项目引用 */
              "incremental",
              "composite",
              "tsBuildInfoFile",
              "disableSourceOfProjectReferenceRedirect",
              "disableSolutionSearching",
              "disableReferencedProjectLoad",
              /* 语言与运行环境 */
              "target",
              "jsx",
              "jsxFactory",
              "jsxFragmentFactory",
              "jsxImportSource",
              "lib",
              "moduleDetection",
              "noLib",
              "reactNamespace",
              "useDefineForClassFields",
              "emitDecoratorMetadata",
              "experimentalDecorators",
              "libReplacement",
              /* 模块解析 */
              "baseUrl",
              "rootDir",
              "rootDirs",
              "customConditions",
              "module",
              "moduleResolution",
              "moduleSuffixes",
              "noResolve",
              "paths",
              "resolveJsonModule",
              "resolvePackageJsonExports",
              "resolvePackageJsonImports",
              "typeRoots",
              "types",
              "allowArbitraryExtensions",
              "allowImportingTsExtensions",
              "allowUmdGlobalAccess",
              /* JavaScript 支持 */
              "allowJs",
              "checkJs",
              "maxNodeModuleJsDepth",
              /* 类型检查 */
              "strict",
              "strictBindCallApply",
              "strictFunctionTypes",
              "strictNullChecks",
              "strictPropertyInitialization",
              "allowUnreachableCode",
              "allowUnusedLabels",
              "alwaysStrict",
              "exactOptionalPropertyTypes",
              "noFallthroughCasesInSwitch",
              "noImplicitAny",
              "noImplicitOverride",
              "noImplicitReturns",
              "noImplicitThis",
              "noPropertyAccessFromIndexSignature",
              "noUncheckedIndexedAccess",
              "noUnusedLocals",
              "noUnusedParameters",
              "useUnknownInCatchVariables",
              /* 发射选项 */
              "declaration",
              "declarationDir",
              "declarationMap",
              "downlevelIteration",
              "emitBOM",
              "emitDeclarationOnly",
              "importHelpers",
              "importsNotUsedAsValues",
              "inlineSourceMap",
              "inlineSources",
              "mapRoot",
              "newLine",
              "noEmit",
              "noEmitHelpers",
              "noEmitOnError",
              "outDir",
              "outFile",
              "preserveConstEnums",
              "preserveValueImports",
              "removeComments",
              "sourceMap",
              "sourceRoot",
              "stripInternal",
              /* 兼容性约束 */
              "allowSyntheticDefaultImports",
              "esModuleInterop",
              "forceConsistentCasingInFileNames",
              "isolatedDeclarations",
              "isolatedModules",
              "preserveSymlinks",
              "verbatimModuleSyntax",
              "erasableSyntaxOnly",
              /* 完整性 */
              "skipDefaultLibCheck",
              "skipLibCheck",
            ],
            pathPattern: "^compilerOptions$",
          },
        ], // tsconfig 与 compilerOptions 字段排序
      },
    },
  ];
}

export function sortImports(): TypedFlatConfigItem[] {
  return [
    {
      files: [GLOB_CSS, GLOB_SCSS, GLOB_LESS],
      languageOptions: {
        parser: parserPlain,
      },
      name: "senran/sort/css-property-order",
      plugins: {
        senran: pluginSenran,
      },
      rules: {
        // --- 样式文件通过占位解析器运行自定义属性排序 ---
        "senran/css-property-order": "error",
      },
    },
    {
      name: "senran/sort/rules",
      plugins: {
        senran: pluginSenran,
      },
      rules: {
        "senran/import-length-order": "error",
      },
    },
  ];
}
