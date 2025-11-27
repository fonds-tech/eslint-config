import { fonds } from "./src"

export default fonds(
  {
    vue: {
      a11y: true,
    },
    react: true,
    solid: true,
    svelte: true,
    astro: true,
    nextjs: false,
    typescript: {
      erasableOnly: true,
    },
    markdown: {
      overrides: {
        "no-dupe-keys": "off",
      },
    },
    formatters: {
      prettierOptions: {
        arrowParens: "always",
        bracketSameLine: false,
        bracketSpacing: true,
        endOfLine: "auto",
        printWidth: 180,
        proseWrap: "always",
        semi: false,
        singleAttributePerLine: false,
        singleQuote: false,
        tabWidth: 2,
        trailingComma: "all",
        useTabs: false,
        vueIndentScriptAndStyle: false,
        jsxBracketSameLine: false,
        jsxSingleQuote: false,
      },
    },
    pnpm: true,
    type: "lib",
    jsx: {
      a11y: true,
    },
  },
  {
    ignores: [
      "fixtures",
      "_fixtures",
      "**/constants-generated.ts",
    ],
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "perfectionist/sort-objects": "error",
    },
  },
)
