/**
 * Node.js 配置模块
 * 为 Node.js 环境配置 ESLint 规则
 */

import type { TypedFlatConfigItem } from "../types";

import { pluginNode } from "../plugins";

/**
 * Node.js 运行时相关的安全规则，覆盖回调错误处理、API 废弃提示等。
 */
export async function node(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      name: "senran/node/rules",
      plugins: {
        node: pluginNode,
      },
      rules: {
        // --- Node.js 特有的 API 安全校验 ---
        "node/handle-callback-err": ["error", "^(err|error)$"], // 回调错误参数需命名为 err
        "node/no-deprecated-api": "error", // 不使用已废弃 API
        "node/no-exports-assign": "error", // 禁止给 module.exports 重新赋值为非对象
        "node/no-new-require": "error", // 禁止 new require
        "node/no-path-concat": "error", // 避免 __dirname + 字符串
        "node/prefer-global/buffer": ["error", "never"], // 使用局部 Buffer 而非全局
        "node/prefer-global/process": ["error", "never"], // 不直接用全局 process
        "node/process-exit-as-throw": "error", // 禁止直接 process.exit
      },
    },
  ];
}
