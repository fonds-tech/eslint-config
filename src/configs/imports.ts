import type { OptionsOverrides, OptionsStylistic, TypedFlatConfigItem } from "../types"
import { pluginFonds, pluginImportLite } from "../plugins"

/**
 * 模块导入相关的配置。
 * 负责导入语句的排序、去重以及规范化。
 */
export async function imports(options: OptionsOverrides & OptionsStylistic = {}): Promise<TypedFlatConfigItem[]> {
  const {
    overrides = {},
    stylistic = true,
  } = options

  return [
    {
      name: "fonds/imports/rules",
      plugins: {
        fonds: pluginFonds,
        import: pluginImportLite,
      },
      rules: {
        // === 增强的导入规则 (fonds 插件) ===
        "fonds/import-dedupe": "error", // 自动去重导入
        "fonds/import-sort": "error", // 自动排序导入 (核心功能)
        "fonds/no-import-dist": "error", // 禁止直接导入 dist 目录中的文件 (通常是错误的引用方式)
        "fonds/no-import-node-modules-by-path": "error", // 禁止通过相对路径导入 node_modules

        // === import 插件规则 ===
        // 强制类型导入放在顶层 (TS 4.5+ 特性)
        "import/consistent-type-specifier-style": ["error", "top-level"],
        "import/first": "error", // 确保所有 import 都在文件顶部
        "import/no-duplicates": "error", // 禁止重复导入
        "import/no-mutable-exports": "error", // 禁止导出可变变量 (let/var)，应使用 const
        "import/no-named-default": "error", // 禁止命名默认导出

        // 如果启用了 stylistic (风格) 选项，则强制 import 之后空一行
        ...stylistic
          ? {
              "import/newline-after-import": ["error", { count: 1 }],
            }
          : {},

        ...overrides,
      },
    },
  ]
}
