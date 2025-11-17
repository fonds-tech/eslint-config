/**
 * 导入语句配置模块
 * 配置导入/导出语句和导入顺序的规则
 */

import type { OptionsOverrides, OptionsStylistic, TypedFlatConfigItem } from "../types";
import { pluginImportLite } from "../plugins";

/**
 * Best practices for constraining module imports/exports, with optional style rules.
 */
export async function imports(options: OptionsOverrides & OptionsStylistic = {}): Promise<TypedFlatConfigItem[]> {
  const { overrides = {}, stylistic = true } = options;

  return [
    {
      name: "senran/imports/rules",
      plugins: {
        import: pluginImportLite,
      },
      rules: {
        // --- import/export 基础健壮性，防止重复或默认导出滥用 ---
        "import/consistent-type-specifier-style": ["error", "top-level"], // type 导入统一写在顶层
        "import/no-duplicates": "error", // 禁止重复导入同一模块

        "import/no-mutable-exports": "error", // export 的引用应不可变
        "import/no-named-default": "error", // 禁止 `import { default as foo }`

        ...(stylistic
          ? {
              // --- 保证 import 后留出空行，提升可读性 ---
              "import/newline-after-import": ["error", { count: 1 }], // import 之后留一空行
            }
          : {}),

        ...overrides,
      },
    },
  ];
}
