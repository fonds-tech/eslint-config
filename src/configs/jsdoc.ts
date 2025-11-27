import type { OptionsStylistic, TypedFlatConfigItem } from "../types"

import { interopDefault } from "../utils"

/**
 * JSDoc 注释规范配置。
 * 确保 JSDoc 的格式正确，参数、返回值描述与函数签名一致。
 * 所有规则默认为 "warn" 级别，避免在开发过程中产生过多阻断性错误。
 */
export async function jsdoc(options: OptionsStylistic = {}): Promise<TypedFlatConfigItem[]> {
  const {
    stylistic = true,
  } = options

  return [
    {
      name: "fonds/jsdoc/rules",
      plugins: {
        jsdoc: await interopDefault(import("eslint-plugin-jsdoc")),
      },
      rules: {
        "jsdoc/check-access": "warn", // 检查 @access 标签的有效性
        "jsdoc/check-param-names": "warn", // 检查 @param 名称是否与函数参数匹配
        "jsdoc/check-property-names": "warn", // 检查 @property 名称
        "jsdoc/check-types": "warn", // 检查类型定义是否有效
        "jsdoc/empty-tags": "warn", // 检查空标签
        "jsdoc/implements-on-classes": "warn", // 检查 @implements 只能用于类
        "jsdoc/no-defaults": "warn", // 禁止在 @param 中写默认值 (应在代码中定义)
        "jsdoc/no-multi-asterisks": "warn", // 防止注释行首出现多余的星号
        "jsdoc/require-param-name": "warn", // @param 必须有名称
        "jsdoc/require-property": "warn", // @typedef 中必须包含 @property
        "jsdoc/require-property-description": "warn", // @property 必须有描述
        "jsdoc/require-property-name": "warn", // @property 必须有名称
        "jsdoc/require-returns-check": "warn", // 检查 @returns 是否与函数实际返回值一致
        "jsdoc/require-returns-description": "warn", // @returns 必须有描述
        "jsdoc/require-yields-check": "warn", // 检查 @yields 是否与 generator 函数一致

        // 如果启用风格检查，则检查对齐和多行块格式
        ...stylistic
          ? {
              "jsdoc/check-alignment": "warn", // 检查星号对齐
              "jsdoc/multiline-blocks": "warn", // 强制多行注释风格
            }
          : {},
      },
    },
  ]
}
