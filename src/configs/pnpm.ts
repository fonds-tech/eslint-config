import type { TypedFlatConfigItem } from "../types"

import { interopDefault } from "../utils"

/**
 * Pnpm 相关配置。
 * 验证 package.json 中的 catalog 字段以及 pnpm-workspace.yaml 的正确性。
 */
export async function pnpm(): Promise<TypedFlatConfigItem[]> {
  const [
    pluginPnpm,
    yamlParser,
    jsoncParser,
  ] = await Promise.all([
    interopDefault(import("eslint-plugin-pnpm")),
    interopDefault(import("yaml-eslint-parser")),
    interopDefault(import("jsonc-eslint-parser")),
  ])

  return [
    {
      files: [
        "package.json",
        "**/package.json",
      ],
      languageOptions: {
        parser: jsoncParser,
      },
      name: "fonds/pnpm/package-json",
      plugins: {
        pnpm: pluginPnpm,
      },
      rules: {
        // 强制使用 catalog 协议
        "pnpm/json-enforce-catalog": "error",
        // 推荐使用 workspace: 协议
        "pnpm/json-prefer-workspace-settings": "error",
        "pnpm/json-valid-catalog": "error",
      },
    },
    {
      files: ["pnpm-workspace.yaml"],
      languageOptions: {
        parser: yamlParser,
      },
      name: "fonds/pnpm/pnpm-workspace-yaml",
      plugins: {
        pnpm: pluginPnpm,
      },
      rules: {
        "pnpm/yaml-no-duplicate-catalog-item": "error",
        "pnpm/yaml-no-unused-catalog-item": "error",
      },
    },
  ]
}
