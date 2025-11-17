/**
 * Next.js 配置模块
 * 为 Next.js 项目配置 ESLint 规则
 */

import type { OptionsFiles, OptionsOverrides, TypedFlatConfigItem } from "../types";
import { GLOB_SRC } from "../globs";
import { ensurePackages, interopDefault } from "../utils";

/**
 * 将 Next.js 配置导出的简单字符串值统一成数组形式，便于与本地 overrides 合并。
 */
function normalizeRules(rules?: Record<string, any>): Record<string, any> {
  return rules ? Object.fromEntries(Object.entries(rules).map(([key, value]) => [key, typeof value === "string" ? [value] : value])) : {};
}

/**
 * 集成 `@next/eslint-plugin-next` 的 recommended 与 core-web-vitals 规则，并允许通过 `files`、`overrides` 定制。
 */
export async function nextjs(options: OptionsOverrides & OptionsFiles = {}): Promise<TypedFlatConfigItem[]> {
  const { files = [GLOB_SRC], overrides = {} } = options;

  await ensurePackages(["@next/eslint-plugin-next"]);

  const pluginNextJS = await interopDefault(import("@next/eslint-plugin-next"));
  return [
    {
      name: "senran/nextjs/setup",
      plugins: {
        next: pluginNextJS,
      },
    },
    {
      files,
      languageOptions: {
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
        sourceType: "module",
      },
      name: "senran/nextjs/rules",
      rules: {
        ...normalizeRules(pluginNextJS.configs.recommended.rules),
        ...normalizeRules(pluginNextJS.configs["core-web-vitals"].rules),
        "next/no-html-link-for-pages": "off",

        ...overrides,
      },
      settings: {
        react: {
          version: "detect",
        },
      },
    },
  ];
}
