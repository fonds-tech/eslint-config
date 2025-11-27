import type { TypedFlatConfigItem } from "../types"

import { GLOB_EXCLUDE } from "../globs"

/**
 * 构建全局忽略配置。
 *
 * @param userIgnores 用户自定义的忽略模式。可以是字符串数组，也可以是接收默认忽略列表并返回新列表的函数。
 */
export async function ignores(userIgnores: string[] | ((originals: string[]) => string[]) = []): Promise<TypedFlatConfigItem[]> {
  let ignores = [
    ...GLOB_EXCLUDE,
  ]

  if (typeof userIgnores === "function") {
    ignores = userIgnores(ignores)
  }
  else {
    ignores = [
      ...ignores,
      ...userIgnores,
    ]
  }

  return [
    {
      ignores,
      name: "fonds/ignores",
    },
  ]
}
