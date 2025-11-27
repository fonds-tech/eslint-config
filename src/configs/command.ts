import type { TypedFlatConfigItem } from "../types"

import createCommand from "eslint-plugin-command/config"

/**
 * 启用基于注释的命令功能。
 * 允许使用 /// command 形式的注释来触发特定操作（例如自动修复）。
 * 依赖于 eslint-plugin-command。
 */
export async function command(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      ...createCommand() as any,
      name: "fonds/command/rules",
    },
  ]
}
