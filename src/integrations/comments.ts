/**
 * ESLint 注释配置模块
 * 配置处理 ESLint 指令注释（eslint-disable 等）的规则
 */

import type { TypedFlatConfigItem } from "../types";
import { pluginComments } from "../plugins";

/**
 * 约束 ESLint 相关指令的使用，避免随意禁用规则或留下失效的启停注释。
 */
export async function comments(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      name: "senran/eslint-comments/rules",
      plugins: {
        "eslint-comments": pluginComments,
      },
      rules: {
        // --- 防止滥用 ESLint 指令，确保禁用范围受控 ---
        "eslint-comments/no-aggregating-enable": "error", // 禁止单个 enable 指令覆盖大量规则
        "eslint-comments/no-duplicate-disable": "error", // 不重复写 disable，同一行只允许一次
        "eslint-comments/no-unlimited-disable": "error", // 禁止不指定规则的 disable
        "eslint-comments/no-unused-enable": "error", // 未配对的 enable 将报错
      },
    },
  ];
}
