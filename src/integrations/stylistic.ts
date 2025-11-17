/**
 * Stylistic 风格配置模块
 * 配置 ESLint Stylistic 插件的代码风格和格式化规则
 */

import type { StylisticConfig, OptionsOverrides, TypedFlatConfigItem } from "../types";
import { interopDefault } from "../utils";

export const StylisticConfigDefaults: StylisticConfig = {
  indent: 2,
  jsx: true,
  quotes: "double",
  semi: true,
};

export interface StylisticOptions extends StylisticConfig, OptionsOverrides {
  lessOpinionated?: boolean;
}

/**
 * 基于 `@stylistic/eslint-plugin` 的格式化规则，可覆盖缩进/引号/分号等风格，并注入额外的团队规范。
 */
export async function stylistic(options: StylisticOptions = {}): Promise<TypedFlatConfigItem[]> {
  const {
    indent,
    jsx,
    overrides = {},
    quotes,
    semi,
  } = {
    ...StylisticConfigDefaults,
    ...options,
  };

  const pluginStylistic = await interopDefault(import("@stylistic/eslint-plugin"));

  const config = pluginStylistic.configs.customize({
    indent,
    jsx,
    pluginName: "style",
    quotes,
    semi,
  }) as TypedFlatConfigItem;

  return [
    {
      name: "senran/stylistic/rules",
      plugins: {
        style: pluginStylistic,
      },
      rules: {
        // --- 基于 Stylistic 的统一风格设置 ---
        ...config.rules,

        "curly": ["error", "all"], // 所有控制语句必须使用花括号
        // --- 额外补充团队常用风格 ---
        "style/brace-style": ["error", "1tbs", { allowSingleLine: false }], // 花括号 1TBS 风格
        "style/generator-star-spacing": ["error", { after: true, before: false }], // function* 星号贴 function
        "style/member-delimiter-style": ["error", { multiline: { delimiter: "semi" } }], // 接口成员以分号结尾
        "style/yield-star-spacing": ["error", { after: true, before: false }], // yield* 星号靠前

        ...overrides,
      },
    },
  ];
}
