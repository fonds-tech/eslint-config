# @fonds/eslint-config

一个面向团队的 ESLint v9 扁平配置预设，内置 React/Vue/Svelte/Solid/Next.js、JSONC/YAML/TOML、Markdown 代码片段、UnoCSS、正则等常用集成，并提供 `css-property-order`、`import-length-order` 两个自定义规则以统一样式与导入顺序。

## 特性

- 覆盖 Web/Node/测试 等常见场景，按需启用各框架集成
- TypeScript（含 typed rules）、JSX 无障碍、正则等最佳实践
- JSONC/YAML/TOML 支持与 `package.json`、`tsconfig.json`、`imports` 排序
- 外部格式化器支持（Prettier / dprint）用于 CSS/HTML/XML/Markdown/Astro
- 在编辑器环境下自动放宽若干规则，提升开发体验
- 自动重命名插件前缀，规则名更简洁一致

## 安装

- 在你的项目中使用：

```bash
pnpm add -D @fonds/eslint-config eslint
# 按需安装对应集成的 peer 依赖：
# React: @eslint-react/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-refresh
# Next:  @next/eslint-plugin-next
# Vue 无障碍（可选）: eslint-plugin-vuejs-accessibility
# Solid: eslint-plugin-solid
# Svelte: eslint-plugin-svelte svelte-eslint-parser
# UnoCSS: @unocss/eslint-plugin
# Astro:  eslint-plugin-astro（格式化需 prettier-plugin-astro）
# JSX 无障碍（可选）: eslint-plugin-jsx-a11y
# 外部格式化器: eslint-plugin-format
```

- 本仓库开发：

```bash
pnpm install
```

## 快速开始

在项目根目录创建 `eslint.config.ts` 或 `eslint.config.js`：

```ts
import eslint from "@fonds/eslint-config";

export default eslint({
  typescript: true,
  react: true,
  // 其他集成按需开启
});
```

说明：`vue` 会根据依赖自动检测开启；`typescript` 默认按依赖自动开启，也可显式传参。

## 选项示例

```ts
import eslint from "@fonds/eslint-config";

export default eslint({
  // 开启 typed rules（需项目存在 tsconfig）
  typescript: { tsconfigPath: "./tsconfig.json" },

  // React + JSX 无障碍
  react: true,
  jsx: { a11y: true },

  // Vue 单文件块 + 无障碍
  vue: { sfcBlocks: true, a11y: true },

  // UnoCSS（按需）
  unocss: { attributify: true },

  // Markdown 代码片段 + 使用 Prettier 格式化 Markdown
  markdown: true,
  formatters: { markdown: "prettier" },

  // Astro（需要 `eslint-plugin-astro`，格式化需 `prettier-plugin-astro`）
  astro: true,
  formatters: { astro: "prettier" },

  // 覆盖某集成的规则（推荐使用各集成下的 overrides）
  stylistic: {
    overrides: {
      "style/semi": "off",
    },
  },
});
```

更多可用选项与默认值参考源码：`src/types/index.ts` 与 `src/integration.ts`。

## 自定义规则

- `senran/css-property-order`：统一 CSS 属性分组与顺序，保持样式一致性
- `senran/import-length-order`：导入分组内按路径长度排序，减少 diff 噪音

## 常用命令

- `pnpm build`：生成类型并使用 Rollup 打包
- `pnpm build:inspector`：打包后生成 Config Inspector 构建产物
- `pnpm test`：运行所有规则与集成测试（Vitest）
- `pnpm typecheck`：TypeScript 类型检查
- `pnpm lint` / `pnpm lint:fix`：仓库 ESLint 检查 / 自动修复
- `pnpm gen`：运行 `scripts/typegen.ts` 生成类型定义

## 测试

- 规则级单元测试：位于 `test/rules/*`，读取 `test/fixtures/rules/...` 验证逻辑与修复
- 集成级端到端测试：位于 `test/integrations/*`，针对 `src/integrations/*` 的场景进行断言

运行示例：

```bash
pnpm vitest test/integrations
pnpm vitest test/rules
```

## 参与贡献

1. Fork & clone 仓库，执行 `pnpm install`
2. 修改代码并确保 `pnpm test` 全部通过
3. 提交 PR，说明变更内容与动机

如需新增集成：

1. 在 `src/integrations` 中实现逻辑
2. 在 `test/fixtures/integrations/<name>` 添加夹具（`options.json`、`files/`、`expect.json`）
3. 在 `test/integrations/<name>.test.ts` 使用 `lintIntegrationFixture` 断言

## 许可证

[MIT](LICENSE)
