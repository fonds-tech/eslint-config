/**
 * JSX 配置模块
 * 为 JSX/React 文件配置 ESLint 规则，支持可选的无障碍（a11y）检查
 */

import type { OptionsJSX, TypedFlatConfigItem } from "../types";
import { GLOB_JSX, GLOB_TSX } from "../globs";
import { ensurePackages, interopDefault } from "../utils";

/**
 * 为 JSX/TSX 文件启用基础语法支持，可选开启 `a11y` 规则覆盖来对接 `eslint-plugin-jsx-a11y`。
 */
export async function jsx(options: OptionsJSX = {}): Promise<TypedFlatConfigItem[]> {
  const { a11y } = options;

  // 仅提供 JSX 语法解析的基础配置
  const baseConfig: TypedFlatConfigItem = {
    files: [GLOB_JSX, GLOB_TSX],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    name: "senran/jsx/setup",
    plugins: {},
    rules: {},
  };

  // 未开启无障碍校验时直接返回基础配置
  if (!a11y) {
    return [baseConfig];
  }

  await ensurePackages(["eslint-plugin-jsx-a11y"]);
  const jsxA11yPlugin = await interopDefault(import("eslint-plugin-jsx-a11y"));
  const a11yConfig = jsxA11yPlugin.flatConfigs.recommended;

  const a11yRules = {
    ...(a11yConfig.rules || {}),
    ...(typeof a11y === "object" && a11y.overrides ? a11y.overrides : {}),
  };

  // 将基础 JSX 解析能力与 a11y 规则合并
  return [
    {
      ...baseConfig,
      ...a11yConfig,
      files: baseConfig.files,
      languageOptions: {
        ...baseConfig.languageOptions,
        ...a11yConfig.languageOptions,
      },
      name: baseConfig.name,
      plugins: {
        ...baseConfig.plugins,
        "jsx-a11y": jsxA11yPlugin,
      },
      rules: {
        // --- 合并基础 JSX 行为与无障碍增强规则 ---
        ...baseConfig.rules,
        ...a11yRules,
      },
    },
  ];
}
