import type { OptionsOverrides, OptionsStylistic, TypedFlatConfigItem } from "../types"
import { pluginFonds, pluginImportLite } from "../plugins"

export async function imports(options: OptionsOverrides & OptionsStylistic = {}): Promise<TypedFlatConfigItem[]> {
  const {
    overrides = {},
    stylistic = true,
  } = options

  return [
    {
      name: "fonds/imports/rules",
      plugins: {
        fonds: pluginFonds,
        import: pluginImportLite,
      },
      rules: {
        "fonds/import-dedupe": "error",
        "fonds/import-sort": "error",
        "fonds/no-import-dist": "error",
        "fonds/no-import-node-modules-by-path": "error",

        "import/consistent-type-specifier-style": ["error", "top-level"],
        "import/first": "error",
        "import/no-duplicates": "error",
        "import/no-mutable-exports": "error",
        "import/no-named-default": "error",

        ...stylistic
          ? {
              "import/newline-after-import": ["error", { count: 1 }],
            }
          : {},

        ...overrides,
      },
    },
  ]
}
