/**
 * UnoCSS 配置模块
 * 为 UnoCSS 原子化 CSS 框架配置 ESLint 规则
 */

import type { OptionsUnoCSS, TypedFlatConfigItem } from "../types";

import { ensurePackages, interopDefault } from "../utils";

/**
 * 针对 UnoCSS 原子化样式的 ESLint 规则，支持 `attributify` 顺序和 `strict` 黑名单校验。
 */
export async function unocss(options: OptionsUnoCSS = {}): Promise<TypedFlatConfigItem[]> {
  const { attributify = true, strict = false } = options;

  await ensurePackages(["@unocss/eslint-plugin"]);

  const [pluginUnoCSS] = await Promise.all([interopDefault(import("@unocss/eslint-plugin"))] as const);

  return [
    {
      name: "senran/unocss",
      plugins: {
        unocss: pluginUnoCSS,
      },
      rules: {
        // --- UnoCSS utility 排序及可选黑名单 ---
        "unocss/order": "warn", // UnoCSS 类名按原子顺序排列
        ...(attributify
          ? {
              "unocss/order-attributify": "warn", // attr 模式的属性顺序
            }
          : {}),
        ...(strict
          ? {
              "unocss/blocklist": "error", // 启用黑名单
            }
          : {}),
      },
    },
  ];
}
