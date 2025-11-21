---
title: 配置项参考
outline: deep
---

# 配置项参考

`fonds()` 的全局选项遵循 `src/types.ts` 中的 `OptionsConfig` 定义。下表按类别梳理常用字段及默认值，便于快速查阅。

## 框架与语言

| 选项                                            | 默认     | 说明                                                                                               |
| ----------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `typescript`                                    | 自动检测 | 接受布尔或对象，可设置 `tsconfigPath`、`filesTypeAware`、`erasableOnly`、`overridesTypeAware` 等。 |
| `vue`                                           | 自动检测 | `OptionsVue` 可切换 Vue2/3、SFC blocks、无障碍插件。                                               |
| `jsx` / `react` / `nextjs` / `solid` / `svelte` | `false`  | 按需开启相应框架规则，别忘安装 peer 依赖。                                                         |
| `astro`                                         | `false`  | 搭配 `eslint-plugin-astro`，如需格式化再配 `formatters.astro`。                                    |
| `unocss`                                        | `false`  | `OptionsUnoCSS` 控制 attributify、strict 等行为。                                                  |

## 行为开关

| 选项                | 默认    | 说明                                                               |
| ------------------- | ------- | ------------------------------------------------------------------ |
| `formatters`        | `false` | 启用外部格式化器，详见 [格式化器指南](./formatters.md)。           |
| `pnpm`              | `false` | 实验功能，感知 pnpm catalog 与工作区。                             |
| `autoRenamePlugins` | `true`  | 将插件名重命名为短别名，利于阅读与禁用。                           |
| `lessOpinionated`   | `false` | 关闭 `antfu/if-newline` 等较主观的 stylistic 规则。                |
| `isInEditor`        | 自动    | 覆盖编辑器检测（默认为 `VSCODE_PID`/`JETBRAINS_IDE` 等环境变量）。 |

## 项目模式与执行环境

- `type: "app" | "lib"`：默认为 `app`；当设为 `lib` 时会启用更严格的导出与依赖检查。
- `test`：布尔或对象，默认 `true`。如果不需要内置的 vitest/jest 规则，可以设置为 `false` 或传入自定义 overrides。
- `jsx`、`react`、`nextjs` 等框架选项都支持 `overrides` 字段，可用来关闭部分规则或注入额外 ones。
- `pnpm: true` 会让配置自动感知 workspace 目录与 catalog 依赖，便于 monorepo 使用。
- `isInEditor` 若未显式设置，会根据环境变量自动判断；在 CI 中强烈建议保持 `false` 以避免 fixer 降级。

## Stylistic 选项

`stylistic` 接受布尔或对象 `{ indent, quotes, jsx, semi }`，默认值见 `src/configs/stylistic.ts`：

- `indent`: 数字或 `"tab"`，默认 `2`。
- `quotes`: `"double"`（默认）或 `"single"`。
- `jsx`: `true`，可关闭 JSX 特定规则。
- `semi`: `false`。

这些值也会传入 formatter 默认配置（未显式填写 `formatters.prettierOptions` 时会沿用）。

## Overrides 钩子

几乎每个集成都提供 `overrides` 字段以覆写规则：

```ts
fonds({
  typescript: {
    overrides: {
      "ts/consistent-type-definitions": ["error", "type"],
    },
  },
  markdown: {
    overrides: {
      "md/remark": "off",
    },
  },
})
```

旧版总入口 `options.overrides` 仍可用，但官方推荐直接在各集成（`typescript`、`vue`、`stylistic` 等）下传递。

## 组合范式示例

```ts
fonds({
  type: "lib",
  jsx: {
    a11y: true,
  },
  react: {
    fastRefresh: true,
  },
  pnpm: true,
  autoRenamePlugins: true,
  stylistic: {
    indent: 2,
    quotes: "single",
  },
})
```

::: tip 查看完整定义若需了解更细粒度的字段（如 `jsx.componentExts`、`markdown.componentExts`、`react.fastRefresh` 等），请直接查阅 `src/types.ts`。该文件是所有配置的权威来源。:::
