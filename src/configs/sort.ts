import type { TypedFlatConfigItem } from "../types"

/**
 * Package.json 排序规则。
 * 定义了 package.json 中各个字段的标准顺序，保持项目配置的一致性。
 *
 * 需要依赖 `jsonc` 配置。
 */
export async function sortPackageJson(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      files: ["**/package.json"],
      name: "fonds/sort/package-json",
      rules: {
        // 数组值排序 (例如 files 字段)
        "jsonc/sort-array-values": [
          "error",
          {
            order: { type: "asc" },
            pathPattern: "^files$",
          },
        ],
        // 键名排序
        "jsonc/sort-keys": [
          "error",
          // 顶层字段顺序 (按标准 npm 包结构排序)
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
          // 依赖项排序 (dependencies, devDependencies 等内部按字母排序)
          {
            order: { type: "asc" },
            pathPattern: "^(?:dev|peer|optional|bundled)?[Dd]ependencies(Meta)?$",
          },
          // 覆盖配置排序
          {
            order: { type: "asc" },
            pathPattern: "^(?:resolutions|overrides|pnpm.overrides)$",
          },
          // Workspace catalogs
          {
            order: { type: "asc" },
            pathPattern: "^workspaces\.catalog$",
          },
          {
            order: { type: "asc" },
            pathPattern: "^workspaces\.catalogs\.[^.]+$",
          },
          // Exports 字段排序 (types 优先，然后是 import/require/default)
          {
            order: [
              "types",
              "import",
              "require",
              "default",
            ],
            pathPattern: "^exports.*$",
          },
          // Git Hooks 排序 (按生命周期顺序)
          {
            order: [
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
        ],
      },
    },
  ]
}

/**
 * tsconfig.json 排序规则。
 * 保持 TS 配置文件整洁有序。
 */
export function sortTsconfig(): TypedFlatConfigItem[] {
  return [
    {
      files: ["**/[jt]sconfig.json", "**/[jt]sconfig.*.json"],
      name: "fonds/sort/tsconfig-json",
      rules: {
        "jsonc/sort-keys": [
          "error",
          // 顶层字段
          {
            order: [
              "extends",
              "compilerOptions",
              "references",
              "files",
              "include",
              "exclude",
            ],
            pathPattern: "^$",
          },
          // compilerOptions 内部排序 (逻辑分组)
          {
            order: [
              /* Projects (项目配置) */
              "incremental",
              "composite",
              "tsBuildInfoFile",
              "disableSourceOfProjectReferenceRedirect",
              "disableSolutionSearching",
              "disableReferencedProjectLoad",
              /* Language and Environment (语言与环境) */
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
              /* Modules (模块解析) */
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
              /* JavaScript Support (JS 支持) */
              "allowJs",
              "checkJs",
              "maxNodeModuleJsDepth",
              /* Type Checking (类型检查严格度) */
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
              /* Emit (输出) */
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
              /* Interop Constraints (互操作性) */
              "allowSyntheticDefaultImports",
              "esModuleInterop",
              "forceConsistentCasingInFileNames",
              "isolatedDeclarations",
              "isolatedModules",
              "preserveSymlinks",
              "verbatimModuleSyntax",
              "erasableSyntaxOnly",
              /* Completeness (完整性) */
              "skipDefaultLibCheck",
              "skipLibCheck",
            ],
            pathPattern: "^compilerOptions$",
          },
        ],
      },
    },
  ]
}
