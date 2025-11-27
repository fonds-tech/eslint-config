import type { TypedFlatConfigItem } from "../types"

import { GLOB_SRC, GLOB_SRC_EXT } from "../globs"

/**
 * 特定文件类型的规则禁用配置。
 * 针对脚本、CLI 工具、声明文件等特殊场景，放宽某些限制。
 */
export async function disables(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      // 脚本文件 (scripts 目录)
      files: [`**/scripts/${GLOB_SRC}`],
      name: "fonds/disables/scripts",
      rules: {
        "fonds/no-top-level-await": "off", // 脚本中允许顶层 await
        "no-console": "off", // 脚本通常需要输出日志
        "ts/explicit-function-return-type": "off", // 脚本通常不需要显式返回类型
      },
    },
    {
      // CLI 相关文件
      files: [`**/cli/${GLOB_SRC}`, `**/cli.${GLOB_SRC_EXT}`],
      name: "fonds/disables/cli",
      rules: {
        "fonds/no-top-level-await": "off",
        "no-console": "off",
      },
    },
    {
      // 二进制执行入口文件 (bin)
      files: ["**/bin/**/*", `**/bin.${GLOB_SRC_EXT}`],
      name: "fonds/disables/bin",
      rules: {
        "fonds/no-import-dist": "off", // bin 文件可能需要引用 dist 产物
        "fonds/no-import-node-modules-by-path": "off",
      },
    },
    {
      // 类型声明文件 (.d.ts)
      files: ["**/*.d.?([cm])ts"],
      name: "fonds/disables/dts",
      rules: {
        "eslint-comments/no-unlimited-disable": "off",
        "no-restricted-syntax": "off",
        "unused-imports/no-unused-vars": "off", // 声明文件中参数未使用是常态
      },
    },
    {
      // CommonJS 文件
      files: ["**/*.js", "**/*.cjs"],
      name: "fonds/disables/cjs",
      rules: {
        "ts/no-require-imports": "off", // CJS 必须使用 require
      },
    },
    {
      // 配置文件
      files: [`**/*.config.${GLOB_SRC_EXT}`, `**/*.config.*.${GLOB_SRC_EXT}`],
      name: "fonds/disables/config-files",
      rules: {
        "fonds/no-top-level-await": "off",
        "no-console": "off",
        "ts/explicit-function-return-type": "off",
      },
    },
  ]
}
