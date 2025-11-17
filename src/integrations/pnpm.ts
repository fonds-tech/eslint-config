/**
 * PNPM 配置模块
 * 为 PNPM 包管理器项目配置 ESLint 规则
 */

import type { TypedFlatConfigItem } from "../types";

import { interopDefault } from "../utils";

/**
 * 对 pnpm 生态文件（package.json、pnpm-workspace.yaml）执行专有校验，确保 Catalog 与 workspace 配置合法。
 */
export async function pnpm(): Promise<TypedFlatConfigItem[]> {
  const [pluginPnpm, yamlParser, jsoncParser] = await Promise.all([
    interopDefault(import("eslint-plugin-pnpm")),
    interopDefault(import("yaml-eslint-parser")),
    interopDefault(import("jsonc-eslint-parser")),
  ]);

  return [
    {
      files: ["package.json", "**/package.json"],
      languageOptions: {
        parser: jsoncParser,
      },
      name: "senran/pnpm/package-json",
      plugins: {
        pnpm: pluginPnpm,
      },
      rules: {
        // --- 校验 package.json 中 pnpm catalog 配置 ---
        "pnpm/json-enforce-catalog": "error", // catalog 必须启用
        "pnpm/json-prefer-workspace-settings": "error", // 工作区设置写到 workspace
        "pnpm/json-valid-catalog": "error", // catalog 格式合法
      },
    },
    {
      files: ["pnpm-workspace.yaml"],
      languageOptions: {
        parser: yamlParser,
      },
      name: "senran/pnpm/pnpm-workspace-yaml",
      plugins: {
        pnpm: pluginPnpm,
      },
      rules: {
        // --- pnpm-workspace.yaml 的 catalog/依赖引用检查 ---
        "pnpm/yaml-no-duplicate-catalog-item": "error", // catalog 项不可重复
        "pnpm/yaml-no-unused-catalog-item": "error", // catalog 引用必须被使用
      },
    },
  ];
}
