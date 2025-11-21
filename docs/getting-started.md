---
title: 快速上手
outline: deep
---

# 快速上手

::: info 前置要求

- Node.js ≥ 18（推荐使用 `corepack enable` 一次性开启 `pnpm`）。
- 推荐包管理器：pnpm；若使用 npm/yarn，可将命令替换为对应语法。
- 项目中若已使用 Prettier、Vue、React 等，请先确认 peerDependencies 是否齐全。:::

## 1. 安装依赖

```bash
# 安装配置与核心 peer 依赖
pnpm add -D @fonds/eslint-config eslint eslint-plugin-antfu eslint-plugin-import-lite eslint-plugin-unused-imports eslint-plugin-unicorn

# 按需追加框架插件
pnpm add -D typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D vue eslint-plugin-vue eslint-processor-vue-blocks
pnpm add -D @eslint-react/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-refresh
```

> 完整的 peerDependencies/可选依赖列表位于 `package.json`；启用 Astro、Svelte、UnoCSS、formatters 等功能时务必补齐。

## 2. 生成或编辑 `eslint.config.ts`

### 使用 CLI 迁移

```bash
npx @fonds/eslint-config
```

常用参数：

- `--yes/-y`：全部使用默认回答。
- `--template <vue|react|svelte|astro>`：预装框架场景。
- `--extra <formatter|perfectionist|unocss>`：附加工具集。

CLI 会检查是否已存在 `eslint.config.js`，若存在会终止以避免覆盖；成功后会写入 `eslint.config.ts`、补齐 `package.json` 脚本并可选生成 `.vscode/settings.json`。

### 手动创建示例

```ts
// eslint.config.ts
import fonds from "@fonds/eslint-config"

export default fonds(
  {
    typescript: {
      tsconfigPath: "./tsconfig.json",
    },
    vue: {
      sfcBlocks: true,
    },
    react: false,
    formatters: {
      markdown: "prettier",
    },
    lessOpinionated: true,
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "ts/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "import/order": "off",
    },
  },
)
```

- 第一个参数接受全局选项（禁止包含 `files`）。
- 后续参数可放任意 flat config 项或额外插件。
- 可以继续传入 `fonds(options, userConfigA, userConfigB)` 的形式叠加细分规则。

## 3. 验证与运行脚本

```bash
pnpm lint -- --fix        # 运行 ESLint 并尝试自动修复
pnpm test                 # 使用 Vitest 验证 config 行为
pnpm docs:dev             # 本地预览 VitePress 文档
```

在 CI 环境中执行 `pnpm test` 时建议显式设置 `CI=1`，确保 IDE 专用降级规则不会影响快照结果。

## 4. 将格式化器与编辑器对齐

1. 若需要 Prettier 行宽/缩进等行为，请参考 [格式化器指南](/formatters)，在 `formatters.prettierOptions` 中覆写。
2. VS Code 中安装官方 ESLint 扩展并指向 `eslint.config.ts` 即可获得实时诊断；如需启用“只在保存时自动修复”，可在 `.vscode/settings.json` 中加入：

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

3. 编辑器内若遇到 `prefer-const` 之类 fixer 耗时，可利用 `isInEditor` 手动控制“编辑器模式”。传入 `fonds({ isInEditor: false })` 可强制保持完整修复逻辑。

## 5. 常见问题速览

- **CLI 报缺依赖**：根据提示安装对等依赖（例如 `eslint-plugin-vue`、`prettier-plugin-astro`）。
- **测试在本地失败、CI 通过**：大概率是 `isInEditor` 自动开启导致快照差异。执行 `CI=1 pnpm test` 或设置 `IS_IN_EDITOR=false` 再运行。
- **想部分禁用预设**：使用 `fonds(options, { files, rules })` 追加自定义 flat config，或在对应集成下的 `overrides` 中覆写。

更多脚本（`pnpm build`、`pnpm gen`、`pnpm docs:build` 等）详见仓库 README。
