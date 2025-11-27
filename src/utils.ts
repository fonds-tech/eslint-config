import type { Awaitable, TypedFlatConfigItem } from "./types"
import process from "node:process"

import { fileURLToPath } from "node:url"
import { isPackageExists } from "local-pkg"

// 获取当前模块所在的目录路径，用于后续确定包的查找范围
const scopeUrl = fileURLToPath(new URL(".", import.meta.url))
// 检查当前工作目录中是否安装了本配置包 (@fonds/eslint-config)
// 用于判断是否在消费者的项目中运行，从而决定是否执行自动安装依赖等交互逻辑
const isCwdInScope = isPackageExists("@fonds/eslint-config")

/**
 * 一个简易的“纯文本”解析器。
 * 用于处理那些不需要生成 AST 的文件（如 HTML, CSS 等），
 * 仅仅为了让 ESLint 能够读取文件内容并传递给插件（如 eslint-plugin-format）。
 *
 * 它返回一个空的 AST Program 节点。
 */
export const parserPlain = {
  meta: {
    name: "parser-plain",
  },
  parseForESLint: (code: string) => ({
    ast: {
      body: [],
      comments: [],
      loc: { end: code.length, start: 0 },
      range: [0, code.length],
      tokens: [],
      type: "Program",
    },
    scopeManager: null,
    services: { isPlain: true },
    visitorKeys: {
      Program: [],
    },
  }),
}

/**
 * 将配置项数组（可能包含 Promise 或嵌套数组）扁平化并等待解析完成。
 *
 * @param configs - 配置项数组，每一项可以是单个配置、数组或 Promise
 * @returns 解析后的扁平化配置数组
 */
export async function combine(...configs: Awaitable<TypedFlatConfigItem | TypedFlatConfigItem[]>[]): Promise<TypedFlatConfigItem[]> {
  const resolved = await Promise.all(configs)
  return resolved.flat()
}

/**
 * 重命名规则对象中的插件前缀。
 *
 * 例如：将 `@typescript-eslint/rule` 重命名为 `ts/rule`。
 * 这使得配置更加简洁，并且可以统一不同插件的命名风格。
 *
 * @param rules - 原始规则对象 { "prefix/rule": "error" }
 * @param map - 映射关系 { "prefix": "new-prefix" }
 */
export function renameRules(
  rules: Record<string, any>,
  map: Record<string, string>,
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(rules)
      .map(([key, value]) => {
        for (const [from, to] of Object.entries(map)) {
          if (key.startsWith(`${from}/`))
            return [to + key.slice(from.length), value]
        }
        return [key, value]
      }),
  )
}

/**
 * 在 Flat Config 数组中全局重命名插件。
 *
 * 不仅重命名 `plugins` 对象中的键，还会递归重命名 `rules` 中使用该插件的所有规则。
 */
export function renamePluginInConfigs(configs: TypedFlatConfigItem[], map: Record<string, string>): TypedFlatConfigItem[] {
  return configs.map((i) => {
    const clone = { ...i }
    if (clone.rules)
      clone.rules = renameRules(clone.rules, map)
    if (clone.plugins) {
      clone.plugins = Object.fromEntries(
        Object.entries(clone.plugins)
          .map(([key, value]) => {
            if (key in map)
              return [map[key], value]
            return [key, value]
          }),
      )
    }
    return clone
  })
}

/**
 * 强制将值转换为数组。
 */
export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

/**
 * 处理 ESM 和 CommonJS 的默认导出互操作性。
 *
 * 很多 npm 包在 ESM 环境下 import() 后，内容挂在 default 属性上；
 * 而在 CJS 环境下可能直接就是导出对象。此函数统一了获取逻辑。
 */
export async function interopDefault<T>(m: Awaitable<T>): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await m
  return (resolved as any).default || resolved
}

/**
 * 检查某个包是否存在于当前作用域（本项目依赖中）。
 */
export function isPackageInScope(name: string): boolean {
  return isPackageExists(name, { paths: [scopeUrl] })
}

/**
 * 确保所需的依赖包已安装。
 *
 * 如果检测到缺失的包，且处于交互式终端环境中（非 CI），
 * 会提示用户自动安装这些包。
 * 这对于按需加载的插件（如 UnoCSS, Vue, React 插件）非常有用。
 */
export async function ensurePackages(packages: (string | undefined)[]): Promise<void> {
  // 如果在 CI 环境、非 TTY 环境或本包作为依赖安装时，跳过检查
  if (process.env.CI || process.stdout.isTTY === false || isCwdInScope === false)
    return

  const nonExistingPackages = packages.filter(i => i && !isPackageInScope(i)) as string[]
  if (nonExistingPackages.length === 0)
    return

  const p = await import("@clack/prompts")
  const result = await p.confirm({
    message: `${nonExistingPackages.length === 1 ? "Package is" : "Packages are"} required for this config: ${nonExistingPackages.join(", ")}. Do you want to install them?`,
  })
  if (result)
    await import("@antfu/install-pkg").then(i => i.installPackage(nonExistingPackages, { dev: true }))
}

/**
 * 检测当前是否在编辑器环境（VS Code, JetBrains 等）中运行。
 *
 * 用于区分 CLI 运行（如 lint-staged, CI）和编辑器实时检查。
 * 在编辑器中，通常会放宽一些严格规则（如 unused-vars 设为 warn），以免干扰开发。
 */
export function isInEditorEnv(): boolean {
  if (process.env.CI)
    return false
  // 如果正在运行 Git Hooks 或 Lint Staged，视为非编辑器环境（需要严格检查）
  if (isInGitHooksOrLintStaged())
    return false
  return !!(false
    || process.env.VSCODE_PID
    || process.env.VSCODE_CWD
    || process.env.JETBRAINS_IDE
    || process.env.VIM
    || process.env.NVIM
  )
}

/**
 * 检测是否在 Git Hooks 或 Lint Staged 环境中运行。
 */
export function isInGitHooksOrLintStaged(): boolean {
  return !!(false
    || process.env.GIT_PARAMS
    || process.env.VSCODE_GIT_COMMAND
    || process.env.npm_lifecycle_script?.startsWith("lint-staged")
  )
}
