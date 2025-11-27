import type { Linter } from "eslint"
import type { RuleOptions } from "./typegen"
import type { Awaitable, ConfigNames, OptionsConfig, TypedFlatConfigItem } from "./types"

import { regexp } from "./configs/regexp"
import { formatters } from "./configs/formatters"
import { isPackageExists } from "local-pkg"
import { FlatConfigComposer } from "eslint-flat-config-utils"
import { isInEditorEnv, interopDefault } from "./utils"
import {
  jsx,
  vue,
  node,
  pnpm,
  test,
  toml,
  yaml,
  astro,
  jsdoc,
  jsonc,
  react,
  solid,
  nextjs,
  svelte,
  unocss,
  command,
  ignores,
  imports,
  unicorn,
  comments,
  disables,
  markdown,
  stylistic,
  javascript,
  typescript,
  sortTsconfig,
  perfectionist,
  sortPackageJson,
} from "./configs"

/**
 * ESLint Flat Config 的顶层属性列表。
 * 用于从用户传入的混合选项对象中，分离出标准的 Flat Config 配置项。
 */
const flatConfigProps = [
  "name",
  "languageOptions",
  "linterOptions",
  "processor",
  "plugins",
  "rules",
  "settings",
] satisfies (keyof TypedFlatConfigItem)[]

/**
 * 常见的 Vue 相关包名，用于自动检测是否启用 Vue 支持。
 */
const VuePackages = [
  "vue",
  "nuxt",
  "vitepress",
  "@slidev/cli",
]

/**
 * 默认的插件重命名映射。
 * 目的：简化插件前缀，例如将 @typescript-eslint 重命名为 ts，方便在规则中使用 ts/rule-name。
 */
export const defaultPluginRenaming = {
  "@eslint-react": "react",
  "@eslint-react/dom": "react-dom",
  "@eslint-react/hooks-extra": "react-hooks-extra",
  "@eslint-react/naming-convention": "react-naming-convention",

  "@next/next": "next",
  "@stylistic": "style",
  "@typescript-eslint": "ts",
  "import-lite": "import",
  "n": "node",
  "vitest": "test",

  "yml": "yaml",
}

/**
 * 构建 ESLint flat 配置项数组的主工厂函数。
 *
 * 采用“组合式”设计，根据传入的选项（options）按需加载各个配置模块。
 *
 * @param {OptionsConfig & TypedFlatConfigItem} options
 *  生成 ESLint 配置的选项。包含特定功能的开关（如 vue, typescript）以及全局配置。
 * @param {Awaitable<TypedFlatConfigItem | TypedFlatConfigItem[]>[]} userConfigs
 *  用户自定义的配置项，将被合并到生成的配置之后，用于覆盖默认行为。
 * @returns {Promise<TypedFlatConfigItem[]>}
 *  合并后的 ESLint 配置数组。
 */
export function fonds(
  options: OptionsConfig & Omit<TypedFlatConfigItem, "files"> = {},
  ...userConfigs: Awaitable<TypedFlatConfigItem | TypedFlatConfigItem[] | FlatConfigComposer<any, any> | Linter.Config[]>[]
): FlatConfigComposer<TypedFlatConfigItem, ConfigNames> {
  // 解构并设置默认选项
  // 大部分功能默认关闭，通过自动检测 (isPackageExists) 或显式开启
  const {
    astro: enableAstro = false,
    autoRenamePlugins = true,
    componentExts = [],
    gitignore: enableGitignore = true,
    ignores: userIgnores = [],
    imports: enableImports = true,
    jsx: enableJsx = true,
    nextjs: enableNextjs = false,
    pnpm: enableCatalogs = false, // TODO: 智能检测 pnpm catalogs 使用情况
    react: enableReact = false,
    regexp: enableRegexp = true,
    solid: enableSolid = false,
    svelte: enableSvelte = false,
    typescript: enableTypeScript = isPackageExists("typescript"),
    unicorn: enableUnicorn = true,
    unocss: enableUnoCSS = false,
    vue: enableVue = VuePackages.some(i => isPackageExists(i)),
  } = options

  // 检测是否在编辑器环境中运行
  // 如果没有显式传入，则自动检测。在编辑器中通常会禁用某些“干扰性”较强的规则（如 unused-imports）。
  let isInEditor = options.isInEditor
  if (isInEditor == null) {
    isInEditor = isInEditorEnv()
    if (isInEditor)
      console.log("[@fonds/eslint-config] Detected running in editor, some rules are disabled.")
  }

  // 规范化 stylistic 选项
  // stylistic 负责代码风格（空格、缩进等），如果不为 false 则启用
  const stylisticOptions = options.stylistic === false
    ? false
    : typeof options.stylistic === "object"
      ? options.stylistic
      : {}

  // 如果启用了 JSX 且 stylistic 未显式配置 jsx 选项，则同步启用 stylistic 的 jsx 支持
  if (stylisticOptions && !("jsx" in stylisticOptions))
    stylisticOptions.jsx = typeof enableJsx === "object" ? true : enableJsx

  // 初始化配置数组
  const configs: Awaitable<TypedFlatConfigItem[]>[] = []

  // 1. 处理 .gitignore
  // 使用 eslint-config-flat-gitignore 将 .gitignore 文件内容转换为 ESLint 的 ignore patterns
  if (enableGitignore) {
    if (typeof enableGitignore !== "boolean") {
      configs.push(interopDefault(import("eslint-config-flat-gitignore")).then(r => [r({
        name: "fonds/gitignore",
        ...enableGitignore,
      })]))
    }
    else {
      configs.push(interopDefault(import("eslint-config-flat-gitignore")).then(r => [r({
        name: "fonds/gitignore",
        strict: false,
      })]))
    }
  }

  // 解析 TypeScript 选项，获取 tsconfig 路径等
  const typescriptOptions = resolveSubOptions(options, "typescript")
  const tsconfigPath = "tsconfigPath" in typescriptOptions ? typescriptOptions.tsconfigPath : undefined

  // 2. 加载基础配置 (Base Configs)
  // 这些是所有项目通用的基础规则
  configs.push(
    ignores(userIgnores),
    javascript({
      isInEditor,
      overrides: getOverrides(options, "javascript"),
    }),
    comments(),
    node(),
    jsdoc({
      stylistic: stylisticOptions,
    }),
    imports({
      stylistic: stylisticOptions,
    }),
    command(),

    // 可选插件 (默认安装但需按需启用)
    perfectionist(),
  )

  // 3. 增强功能配置
  if (enableImports) {
    configs.push(
      imports(enableImports === true
        ? {
            stylistic: stylisticOptions,
          }
        : {
            stylistic: stylisticOptions,
            ...enableImports,
          }),
    )
  }

  if (enableUnicorn) {
    // Unicorn 插件提供了大量实用的强力规则
    configs.push(unicorn(enableUnicorn === true ? {} : enableUnicorn))
  }

  // 如果启用了 Vue，将 .vue 添加到组件扩展名列表中，以便 TypeScript 解析
  if (enableVue) {
    componentExts.push("vue")
  }

  if (enableJsx) {
    configs.push(jsx(enableJsx === true ? {} : enableJsx))
  }

  // 4. 语言与框架特定配置
  if (enableTypeScript) {
    configs.push(typescript({
      ...typescriptOptions,
      componentExts,
      overrides: getOverrides(options, "typescript"),
      type: options.type,
    }))
  }

  if (stylisticOptions) {
    configs.push(stylistic({
      ...stylisticOptions,
      lessOpinionated: options.lessOpinionated,
      overrides: getOverrides(options, "stylistic"),
    }))
  }

  if (enableRegexp) {
    configs.push(regexp(typeof enableRegexp === "boolean" ? {} : enableRegexp))
  }

  if (options.test ?? true) {
    configs.push(test({
      isInEditor,
      overrides: getOverrides(options, "test"),
    }))
  }

  if (enableVue) {
    configs.push(vue({
      ...resolveSubOptions(options, "vue"),
      overrides: getOverrides(options, "vue"),
      stylistic: stylisticOptions,
      typescript: !!enableTypeScript,
    }))
  }

  if (enableReact) {
    configs.push(react({
      ...typescriptOptions,
      overrides: getOverrides(options, "react"),
      tsconfigPath,
    }))
  }

  if (enableNextjs) {
    configs.push(nextjs({
      overrides: getOverrides(options, "nextjs"),
    }))
  }

  if (enableSolid) {
    configs.push(solid({
      overrides: getOverrides(options, "solid"),
      tsconfigPath,
      typescript: !!enableTypeScript,
    }))
  }

  if (enableSvelte) {
    configs.push(svelte({
      overrides: getOverrides(options, "svelte"),
      stylistic: stylisticOptions,
      typescript: !!enableTypeScript,
    }))
  }

  if (enableUnoCSS) {
    configs.push(unocss({
      ...resolveSubOptions(options, "unocss"),
      overrides: getOverrides(options, "unocss"),
    }))
  }

  if (enableAstro) {
    configs.push(astro({
      overrides: getOverrides(options, "astro"),
      stylistic: stylisticOptions,
    }))
  }

  // 5. 文件格式配置 (JSON, YAML, TOML, Markdown)
  if (options.jsonc ?? true) {
    configs.push(
      jsonc({
        overrides: getOverrides(options, "jsonc"),
        stylistic: stylisticOptions,
      }),
      sortPackageJson(),
      sortTsconfig(),
    )
  }

  if (enableCatalogs) {
    configs.push(
      pnpm(),
    )
  }

  if (options.yaml ?? true) {
    configs.push(yaml({
      overrides: getOverrides(options, "yaml"),
      stylistic: stylisticOptions,
    }))
  }

  if (options.toml ?? true) {
    configs.push(toml({
      overrides: getOverrides(options, "toml"),
      stylistic: stylisticOptions,
    }))
  }

  if (options.markdown ?? true) {
    configs.push(
      markdown(
        {
          componentExts,
          overrides: getOverrides(options, "markdown"),
        },
      ),
    )
  }

  // 6. 格式化工具 (Prettier 替代方案)
  if (options.formatters) {
    configs.push(formatters(
      options.formatters,
      typeof stylisticOptions === "boolean" ? {} : stylisticOptions,
    ))
  }

  // 7. 添加禁用规则 (作为最后一道防线)
  configs.push(
    disables(),
  )

  // 检查参数正确性：files 属性不应出现在第一个参数（全局选项）中
  if ("files" in options) {
    throw new Error("[@fonds/eslint-config] The first argument should not contain the \"files\" property as the options are supposed to be global. Place it in the second or later config instead.")
  }

  // 允许用户在第一个参数中直接传入 Flat Config 项
  // 我们提取已知的 Flat Config 属性，因为 ESLint 会进行 Schema 验证，多余的属性会导致报错
  const fusedConfig = flatConfigProps.reduce((acc, key) => {
    if (key in options)
      acc[key] = options[key] as any
    return acc
  }, {} as TypedFlatConfigItem)
  if (Object.keys(fusedConfig).length)
    configs.push([fusedConfig])

  // 使用 eslint-flat-config-utils 的 Composer 进行组合
  // Composer 提供了方便的链式调用方法来管理配置数组
  let composer = new FlatConfigComposer<TypedFlatConfigItem, ConfigNames>()

  composer = composer
    .append(
      ...configs,
      ...userConfigs as any,
    )

  // 自动重命名插件前缀 (如 @typescript-eslint -> ts)
  if (autoRenamePlugins) {
    composer = composer
      .renamePlugins(defaultPluginRenaming)
  }

  // 如果在编辑器中，移除那些在开发过程中可能造成干扰的“自动修复”或“严格”规则
  if (isInEditor) {
    composer = composer
      .disableRulesFix([
        "unused-imports/no-unused-imports",
        "test/no-only-tests",
        "prefer-const",
      ], {
        builtinRules: () => import(["eslint", "use-at-your-own-risk"].join("/")).then(r => r.builtinRules),
      })
  }

  return composer
}

// 辅助类型：如果是 boolean 则排除，否则返回非空类型
export type ResolvedOptions<T> = T extends boolean
  ? never
  : NonNullable<T>

/**
 * 解析子选项的辅助函数。
 * 处理 `boolean | object` 的情况：如果是 boolean，返回空对象；如果是 object，返回该对象。
 */
export function resolveSubOptions<K extends keyof OptionsConfig>(
  options: OptionsConfig,
  key: K,
): ResolvedOptions<OptionsConfig[K]> {
  return typeof options[key] === "boolean"
    ? {} as any
    : options[key] || {} as any
}

/**
 * 获取特定配置项的 overrides（覆盖规则）。
 * 允许从 options.overrides[key] 或 options[key].overrides 中获取。
 */
export function getOverrides<K extends keyof OptionsConfig>(
  options: OptionsConfig,
  key: K,
): Partial<Linter.RulesRecord & RuleOptions> {
  const sub = resolveSubOptions(options, key)
  return {
    ...(options.overrides as any)?.[key],
    ..."overrides" in sub
      ? sub.overrides
      : {},
  }
}
