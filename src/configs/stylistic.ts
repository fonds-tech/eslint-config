import type { StylisticConfig, OptionsOverrides, TypedFlatConfigItem } from "../types"
import { pluginFonds } from "../plugins"
import { interopDefault } from "../utils"

// 默认的代码风格配置
export const StylisticConfigDefaults: StylisticConfig = {
  indent: 2,
  jsx: true,
  quotes: "double",
  semi: false, // 默认不使用分号
}

export interface StylisticOptions extends StylisticConfig, OptionsOverrides {
  lessOpinionated?: boolean // 是否启用较少争议的模式
}

/**
 * 代码风格 (Formatting) 配置。
 * 基于 @stylistic/eslint-plugin，统一管理缩进、引号、分号等格式化规则。
 */
export async function stylistic(
  options: StylisticOptions = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    indent,
    jsx,
    lessOpinionated = false,
    overrides = {},
    quotes,
    semi,
  } = {
    ...StylisticConfigDefaults,
    ...options,
  }

  const pluginStylistic = await interopDefault(import("@stylistic/eslint-plugin"))

  // 使用 stylistic 插件的 customize 方法生成基础配置
  const config = pluginStylistic.configs.customize({
    indent,
    jsx,
    pluginName: "style",
    quotes,
    semi,
  }) as TypedFlatConfigItem

  return [
    {
      name: "fonds/stylistic/rules",
      plugins: {
        fonds: pluginFonds,
        style: pluginStylistic,
      },
      rules: {
        ...config.rules,

        // === 额外的风格规则 (Fonds 插件提供) ===
        "fonds/consistent-chaining": "error", // 强制链式调用换行的一致性 (要么都换行，要么都在一行)
        "fonds/consistent-list-newline": "error", // 强制列表/对象属性换行的一致性 (要么都换行，要么都不换)
        "fonds/style-sort": "error", // 内部辅助排序规则

        // === 强观点规则 (Opinionated Rules) ===
        // 这些规则可能具有争议性，通过 lessOpinionated 选项控制
        ...(lessOpinionated
          ? {
              curly: ["error", "all"], // 强制所有控制语句使用大括号 (即使是单行)
            }
          : {
              "fonds/curly": "error", // 智能 curly 规则 (允许特定的单行写法)
              "fonds/top-level-function": "error", // 强制顶层函数使用 function 声明而非箭头函数 (利于 Hoisting 和调试)
            }
        ),

        // === Generator 和 Yield 的空格风格 ===
        "style/generator-star-spacing": ["error", { after: true, before: false }], // function* foo()
        "style/yield-star-spacing": ["error", { after: true, before: false }], // yield* foo()

        ...overrides,
      },
    },
  ]
}
