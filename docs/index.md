---
layout: home
title: "@fonds/eslint-config"
hero:
  name: "@fonds/eslint-config"
  text: "可组合的 ESLint Flat Config 工厂"
  tagline: "自动侦测框架依赖，联动格式化器与 CLI，开箱即可守护多框架代码库。"
  actions:
    - theme: brand
      text: 立即开始
      link: /getting-started
    - theme: alt
      text: 配置速查
      link: /options
    - theme: alt
      text: GitHub
      link: https://github.com/fonds-tech/eslint-config
features:
  - title: 可组合的工厂
    details: 用 `fonds(options, ...userConfigs)` 串联默认 preset、用户 overrides 与额外 flat config，插件别名自动对齐。
  - title: 智能检测
    details: 自动识别 TypeScript、Vue、React、Svelte、Astro、UnoCSS、pnpm 场景，按需启用规则与处理器。
  - title: Formatter 与 CLI
    details: 基于 `eslint-plugin-format` 与 VitePress 文档，配合交互式 CLI 在项目中快速落地并迁移旧配置。
---

## 文档地图

| 模块                         | 说明                                                                 |
| ---------------------------- | -------------------------------------------------------------------- |
| [快速上手](/getting-started) | 安装依赖、运行 CLI、编写 `eslint.config.ts`、常用脚本、CI 建议。     |
| [配置项参考](/options)       | 逐项解释 `OptionsConfig`、常见组合范式与 overrides 用法。            |
| [格式化器指南](/formatters)  | 讲解 `formatters` 开关、Prettier/dprint 自定义、依赖准备与场景技巧。 |

## 支持范围一览

- TypeScript、Vue、React、Svelte、Astro、Solid、UnoCSS、pnpm、JSX A11y、RegExp、Markdown/TOML/YAML/JSONC 等。
- 格式化器链路覆盖 CSS、Markdown、Slidev、Astro、GraphQL、XML/SVG，可复用 Prettier 行宽/缩进设置。
- CLI 迁移、`FlatConfigComposer` 合并工具、编辑器友好模式（IDE 中自动降级昂贵 fixer）。

::: tip 与 README 的关系此文档聚焦操作指南与参考手册，配合仓库根目录的 README 可以获得完整的背景介绍与示例。:::
