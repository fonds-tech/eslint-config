import type { TypedFlatConfigItem } from "../types"

import { pluginNode } from "../plugins"

/**
 * Node.js 环境相关规则。
 */
export async function node(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      name: "fonds/node/rules",
      plugins: {
        node: pluginNode,
      },
      rules: {
        // 强制回调错误处理 (error 参数必须被处理)
        "node/handle-callback-err": ["error", "^(err|error)$"],
        "node/no-deprecated-api": "error",
        "node/no-exports-assign": "error",
        "node/no-new-require": "error",
        "node/no-path-concat": "error",
        // 推荐显式 import buffer 而不是使用全局 Buffer
        "node/prefer-global/buffer": ["error", "never"],
        // 推荐显式 import process 而不是使用全局 process
        "node/prefer-global/process": ["error", "never"],
        "node/process-exit-as-throw": "error",
      },
    },
  ]
}
