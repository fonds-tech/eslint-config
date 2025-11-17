/**
 * 禁用规则配置模块
 * 在特定环境下禁用特定规则的配置
 */

import type { TypedFlatConfigItem } from "../types";
import { GLOB_SRC, GLOB_SRC_EXT } from "../globs";

/**
 * 针对脚本、CLI、声明文件等特殊文件类型放宽部分规则，避免工具类场景频繁手动禁用。
 */
export async function disables(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      // 脚本工具通常需要输出日志或动态返回值
      files: [`**/scripts/${GLOB_SRC}`],
      name: "senran/disables/scripts",
      rules: {
        "no-console": "off", // CLI/脚本需要输出日志
        "ts/explicit-function-return-type": "off", // util 函数灵活返回值
      },
    },
    {
      // CLI 入口运行期依赖 stdout，放开 console
      files: [`**/cli/${GLOB_SRC}`, `**/cli.${GLOB_SRC_EXT}`],
      name: "senran/disables/cli",
      rules: {
        "no-console": "off", // CLI 交互依赖 stdout
      },
    },
    {
      // d.ts 文件只承载类型，不参与执行，跳过部分语法限制
      files: ["**/*.d.?([cm])ts"],
      name: "senran/disables/dts",
      rules: {
        "eslint-comments/no-unlimited-disable": "off", // 允许通过注释批量禁用
        "no-restricted-syntax": "off", // 声明文件需兼容扩展语法
        "unused-imports/no-unused-vars": "off", // 类型导出无需执行
      },
    },
    {
      // CommonJS 文件可能需要 require 语法
      files: ["**/*.js", "**/*.cjs"],
      name: "senran/disables/cjs",
      rules: {
        "ts/no-require-imports": "off", // CommonJS 允许 require
      },
    },
    {
      // 配置文件多为工具脚本，这里同样宽松处理
      files: [`**/*.config.${GLOB_SRC_EXT}`, `**/*.config.*.${GLOB_SRC_EXT}`],
      name: "senran/disables/config-files",
      rules: {
        "no-console": "off", // 构建配置常打印提示
        "ts/explicit-function-return-type": "off", // 配置函数更灵活
      },
    },
  ];
}
