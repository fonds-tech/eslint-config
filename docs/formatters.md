---
title: 格式化器指南
outline: deep
---

# 格式化器指南

`formatters` 选项让 `fonds()` 借助 `eslint-plugin-format` 调用 Prettier 或 dprint 处理 CSS、Markdown、Astro 等文本文件。

## 支持语言与依赖

| 语言/文件                   | 默认处理器                | 额外依赖                                       |
| --------------------------- | ------------------------- | ---------------------------------------------- |
| CSS / PostCSS / Less / SCSS | Prettier                  | 无                                             |
| HTML                        | Prettier                  | 无                                             |
| Markdown                    | Prettier（可切换 dprint） | `eslint-plugin-format`（已在 peer 中）         |
| Slidev Markdown             | Prettier                  | `prettier-plugin-slidev`（仅当 `slidev` 为真） |
| Astro                       | Prettier                  | `prettier-plugin-astro`                        |
| GraphQL                     | Prettier                  | 无                                             |
| XML / SVG                   | Prettier                  | `@prettier/plugin-xml`                         |

::: warning JS/TS 文件 JavaScript / TypeScript 仍由 ESLint 规则负责。若想让 Prettier 处理 JS，可以在用户 config 额外添加 `format/prettier` 规则，但这超出默认预设范围。:::

## 启用方式

- `formatters: true`：自动检测可用的 formatter（CSS/HTML/Markdown/XML/SVG/GraphQL/Astro，并感知 `prettier-plugin-astro`、`@prettier/plugin-xml`、`prettier-plugin-slidev`）。
- `formatters: { markdown: true }`：仅启用显式列出的语言，其余保持关闭。
- `formatters: { astro: true, markdown: "dprint" }`：可为不同语言选择不同实现。

当对象中没有任何“语言开关”时，会继承 `formatters: true` 的默认启用列表；一旦写出 `css: true/false`、`astro: true` 等字段，就只会启用显式声明的部分。

## 自定义 Prettier 选项

`formatters.prettierOptions` 会被合并进所有启用的 Prettier formatter，可直观控制行宽、缩进等：

```ts
const config = {
  formatters: {
    prettierOptions: {
      printWidth: 180,
      arrowParens: "always",
      proseWrap: "always",
      trailingComma: "all",
      semi: false,
      singleQuote: false,
      bracketSpacing: true,
      bracketSameLine: false,
      jsxBracketSameLine: false,
      jsxSingleQuote: false,
      tabWidth: 2,
      useTabs: false,
      endOfLine: "auto",
      vueIndentScriptAndStyle: false,
      singleAttributePerLine: false,
    },
  },
}
```

若 `formatters` 对象中没有显式的语言开关，则仍会继承 `formatters: true` 的自动启用行为（以及 `slidev`/`astro` 的依赖检测）。一旦声明了某个开关，只会启用那些字段。

## Markdown + Slidev

- `markdown: true | "prettier" | "dprint"`：控制处理器。
- `slidev: true | { files: string[] }`：同时启用 `prettier-plugin-slidev` 处理演示文稿文件，默认匹配 `**/slides.md`。
- 若想关闭 Markdown formatter 但保留 Slidev，需要明确写 `markdown: true` 并通过 `ignores` 处理（`slidev` 只能在 Markdown 为 Prettier 时使用）。

## dprint 配置

需要时可通过 `dprintOptions` 传入自定义参数：

```ts
const config = {
  formatters: {
    markdown: "dprint",
    dprintOptions: {
      indentWidth: 2,
      lineWidth: 120,
    },
  },
}
```

## 依赖准备

`formatters` 内部会调用 `ensurePackages()` 提示安装所需插件。在 CI 或无交互环境下不会自动安装，因此请提前在 `devDependencies` 中加入：

- `eslint-plugin-format`
- `prettier` 以及按需的 `prettier-plugin-astro` / `@prettier/plugin-xml` / `prettier-plugin-slidev`

启用 XML/SVG 或 Astro 时，没有对应插件会导致 formatter 报错。

## 与 JS/TS 规则协作

- Stylistic 配置（`indent`、`quotes`、`semi`）会被同步为 formatter 默认值，确保 ESLint 与 Prettier 行为一致。
- 对于 Markdown 中的代码块，`format/prettier` 会默认关闭嵌入语言的再次格式化，避免和 ESLint 冲突；若需要，可在 `prettierOptions` 中设置 `embeddedLanguageFormatting: "auto"`。
- 想对 JS/TS 使用 Prettier，可在自定义 flat config 内手动添加：

```ts
const config = {
  files: ["src/**/*.{ts,tsx,js,jsx}"],
  rules: {
    "format/prettier": ["error", { parser: "typescript" }],
  },
}
```

## 常见问题

- **为何本地 lint 时提示安装依赖，CI 不提示？** 在 CI、非 TTY 环境或 repo 不在 workspace scope 时，我们会跳过 `ensurePackages()` 提示，避免阻塞。请提前在 `package.json`
  中声明需要的插件。
- **如何仅格式化部分文件夹？** 在 `formatters` 对象里使用布尔或 glob 形式的 `files/ignores` 即可（参考 `markdown` 里的 `slidev.files` 范式）。
- **dprint 可以同时应用于其它语言吗？** 目前仅支持 Markdown；若需要 CSS/HTML 的 dprint 支持，欢迎在 issue 中提出需求。
