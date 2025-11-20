# @fonds/eslint-config

<div align='left'>
<a href="./README.en.md">English</a> | <b>简体中文</b>
<br>
</div>

`@fonds/eslint-config` 由 Fonds Tech 团队维护，提供名为 `fonds()` 的工厂函数，结合类型完备的工具函数，目标是在 Flat Config 时代给出「开箱即用、可组合、可扩展」的 ESLint 配置：

- 自动侦测 TypeScript、Vue、React、Svelte、Astro 等框架依赖，按需启用规则。
- 使用 `FlatConfigComposer` 将默认规则、用户 overrides 以及额外 flat config 合并在一起。
- 提供 CLI 迁移向导，自动生成 `eslint.config.ts`、调整 `package.json`、改善 VS Code 体验。

## 主要特性

- **可组合工厂**：通过 `fonds(options, ...userConfigs)` 将官方预设与自定义 flat config 串联起来。
- **插件自动重命名**：把 `@typescript-eslint` 等插件重命名为 `ts` 等短名，便于阅读和禁用规则。
- **编辑器友好模式**：在 IDE 中运行时自动关闭耗时 fixer（例如 `unused-imports/no-unused-imports`）。
- **多格式支持**：`formatters` 配置块可启用 Prettier/dprint 处理 CSS、Markdown、Astro 等文本。
- **生态覆盖广**：内置 pnpm catalog、UnoCSS、Astro、Markdown 代码块、TOML/YAML/JSONC 等支持。
- **交互式 CLI**：运行 `npx @fonds/eslint-config`，通过问答选择框架和额外工具，并安全迁移。

## 安装

```bash
# 安装本配置
pnpm add -D @fonds/eslint-config

# 安装核心 peer 依赖（ESLint 及常用插件）
pnpm add -D eslint eslint-plugin-antfu eslint-plugin-import-lite eslint-plugin-unused-imports eslint-plugin-unicorn

# 按需安装框架相关依赖（示例）
pnpm add -D typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D vue eslint-plugin-vue eslint-processor-vue-blocks
pnpm add -D @eslint-react/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-refresh
```

> 完整依赖列表请参考 `package.json` 下的 `peerDependencies`，启用 Astro、Svelte、UnoCSS 或 formatter 时尤其需要补齐对应插件。

## 快速上手

```ts
// eslint.config.ts
import fonds from "@fonds/eslint-config"

export default fonds(
  {
    typescript: {
      tsconfigPath: "./tsconfig.json", // 让 TypeScript 规则具备类型感知能力。
    },
    vue: {
      sfcBlocks: true, // 为 <script setup> 等分块生成虚拟文件，提高 lint 覆盖率。
    },
    react: false, // 不使用的框架务必关闭，避免额外 peer 依赖。
    formatters: {
      markdown: "prettier", // 通过 eslint-plugin-format 把 Markdown 格式化交给 Prettier。
    },
    lessOpinionated: true, // 关闭预设里更强势的个性化规则。
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "ts/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "import/order": "off", // 示范：在组合完成后继续覆写特定规则。
    },
  },
)
```

- 第一个参数只能放全局选项（禁止包含 `files`）；后续参数可放任意 flat config 项或自定义插件。
- 可结合 `FlatConfigComposer` 的能力继续 append/rename/disable 规则。

## 配置项速览

| 选项                                            | 默认值            | 说明                                                                                     |
| ----------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `typescript`                                    | 自动检测          | 设为 `true` 或对象以自定 parserOptions、类型感知文件、`tsconfigPath`、erasable-only 等。 |
| `jsx` / `react` / `nextjs` / `solid` / `svelte` | `false`           | 需要时开启对应框架规则，别忘安装相应 peer 依赖。                                         |
| `vue`                                           | 自动检测 Vue 依赖 | 通过 `OptionsVue` 配置 Vue 2/3、SFC blocks、无障碍规则等细节。                           |
| `astro`                                         | `false`           | 依赖 `eslint-plugin-astro`；如需格式化可配 `formatters.astro`。                          |
| `unocss`                                        | `false`           | `OptionsUnoCSS` 可控制 attributify、strict 模式。                                        |
| `formatters`                                    | `false`           | 借助 `eslint-plugin-format` 调用 Prettier/dprint 处理 CSS/Markdown/Astro。               |
| `pnpm`                                          | `false`           | 实验特性，感知 pnpm catalog 与工作区。                                                   |
| `autoRenamePlugins`                             | `true`            | 将插件名统一成短别名。                                                                   |
| `lessOpinionated`                               | `false`           | 关闭 `antfu/if-newline` 等个性化规则。                                                   |
| `isInEditor`                                    | 自动              | 手动控制 IDE 模式，必要时可强制开启/关闭。                                               |

更多细节可查阅 `src/types.ts`，其中定义了所有 `OptionsConfig` 接口。

## CLI 用法

```bash
npx @fonds/eslint-config
```

常用参数：

- `--yes / -y`：跳过全部提问，使用默认选项。
- `--template <vue|react|svelte|astro>`：按框架载入推荐模板。
- `--extra <formatter|perfectionist|unocss>`：安装额外工具集。

CLI 会在检测到已有 `eslint.config.js` 时终止，以防覆盖既有配置；正常流程会按需修改 `package.json`、生成/更新 `eslint.config.ts`，并可选更新 `.vscode/settings.json`。

## 开发脚本

- `pnpm build`：运行 `nr gen`（类型、版本生成）并使用 `tsdown --clean --dts` 构建产物。
- `pnpm watch` / `pnpm dev`：保持 `tsdown` watch 模式，便于开发调试。
- `pnpm test`：执行 Vitest，验证 config 工具的运行情况。
- `pnpm lint`：用本项目的 ESLint 规则自检源码。
- `pnpm gen`：手动刷新类型和版本信息。

## 致谢

本项目基于 [@antfu/eslint-config](https://github.com/antfu/eslint-config) 的优秀实践，并在此基础上进行了定制与扩展，特此感谢。

## 许可证与维护者

- 许可证：MIT（详见 `LICENSE`）
- 维护者：[fonds-tech](https://github.com/fonds-tech)
