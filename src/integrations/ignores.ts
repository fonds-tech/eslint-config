import type { TypedFlatConfigItem } from "../types";
/**
 * 忽略文件配置模块
 * 定义 ESLint 应忽略的文件和目录
 */

import { GLOB_EXCLUDE } from "../globs";

/**
 * 聚合默认忽略目录（构建产物、缓存等）并允许用户补充自定义忽略项。
 */
export async function ignores(userIgnores: string[] = []): Promise<TypedFlatConfigItem[]> {
  return [
    {
      ignores: [...GLOB_EXCLUDE, ...userIgnores],
      name: "senran/ignores",
    },
  ];
}
