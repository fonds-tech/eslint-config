/**
 * Perfectionist 配置模块
 * 配置属性、导入和其他元素的排序规则
 */

import type { TypedFlatConfigItem } from "../types";

import { pluginPerfectionist } from "../plugins";

/**
 * 使用 `eslint-plugin-perfectionist` 统一排序导入导出、命名符号，避免因顺序差异造成噪声。
 *
 * @see https://github.com/azat-io/eslint-plugin-perfectionist
 */
export async function perfectionist(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      name: "senran/perfectionist/setup",
      plugins: {
        perfectionist: pluginPerfectionist,
      },
      rules: {},
    },
  ];
}
