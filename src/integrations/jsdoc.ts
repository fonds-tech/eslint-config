/**
 * JSDoc 配置模块
 * 配置 JSDoc 注释文档标准的规则
 */

import type { OptionsStylistic, TypedFlatConfigItem } from "../types";
import { interopDefault } from "../utils";

/**
 * 保证 JSDoc 注释的结构与类型说明符合规范，可根据 `stylistic` 选项控制格式相关规则。
 */
export async function jsdoc(options: OptionsStylistic = {}): Promise<TypedFlatConfigItem[]> {
  const { stylistic = true } = options;

  return [
    {
      name: "senran/jsdoc/rules",
      plugins: {
        jsdoc: await interopDefault(import("eslint-plugin-jsdoc")),
      },
      rules: {
        // --- 保证 JSDoc 顺序、必填字段与类型描述齐全 ---
        "jsdoc/check-access": "warn", // 校验 @access 标签
        "jsdoc/check-param-names": "warn", // 参数名需与函数一致
        "jsdoc/check-property-names": "warn", // @property 名称合法
        "jsdoc/check-types": "warn", // 类型语法正确
        "jsdoc/empty-tags": "warn", // 禁止空标签
        "jsdoc/implements-on-classes": "warn", // @implements 仅限 class
        "jsdoc/no-defaults": "warn", // @default 需与实际默认同步
        "jsdoc/no-multi-asterisks": "warn", // 注释边界只保留一个 *
        "jsdoc/require-param-name": "warn", // 必须提供参数名
        "jsdoc/require-property": "warn", // 要求属性说明完整
        "jsdoc/require-property-description": "warn", // 属性需描述
        "jsdoc/require-property-name": "warn", // 属性需命名
        "jsdoc/require-returns-check": "warn", // 有返回值时需 @returns
        "jsdoc/require-returns-description": "warn", // 返回值添加描述
        "jsdoc/require-yields-check": "warn", // generator 需 @yields

        ...(stylistic
          ? {
              // --- 可选：控制注释对齐与多行格式 ---
              "jsdoc/check-alignment": "warn", // 星号列齐
              "jsdoc/multiline-blocks": "warn", // 多行注释保留空行
            }
          : {}),
      },
    },
  ];
}
