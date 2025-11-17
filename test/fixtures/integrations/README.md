# 集成夹具说明

每个子目录都代表一个集成测试场景，`options.json` 指定启用的集成配置，`files/` 放置需要 lint 的示例代码，`expect.json` 描述期望的诊断结果。可查看 `test/integrations/<name>.test.ts` 获取对应的测试入口。

| 夹具目录              | 场景说明                                   | 重点验证的规则/特性                                                               |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| `basic-javascript`    | 纯 JavaScript 项目                         | `eqeqeq`、`no-var`、`no-console` 等核心规则                                       |
| `comments-directive`  | ESLint 指令注释的合规性                    | `eslint-comments/no-unlimited-disable`                                            |
| `disables-scripts`    | scripts 目录下的宽松策略                   | `no-console`、`ts/explicit-function-return-type` 禁用策略                         |
| `typescript-strict`   | 启用 `tsconfig` 的严格模式 TypeScript 库   | `ts/consistent-type-imports`、`ts/consistent-type-definitions` 等 type-aware 规则 |
| `react-jsx`           | React + JSX a11y 场景                      | `react-hooks/rules-of-hooks`、`jsx-a11y/*`                                        |
| `vue-sfc`             | Vue SFC + a11y 场景                        | `vue/require-v-for-key`、`vue-a11y/alt-text`、`vue/block-order`                   |
| `svelte-component`    | Svelte 模板安全/响应式                     | `svelte/no-reactive-literals`、`svelte/no-at-html-tags`                           |
| `solid-component`     | Solid.js 组件                              | `solid/no-destructure` 等 Solid 专属规则                                          |
| `nextjs-app`          | Next.js 页面                               | `next/no-img-element` 等 Next 专属规则                                            |
| `node-runtime`        | Node.js 运行时 API                          | `node/no-path-concat` 等 node 插件规则                                            |
| `vitest-only`         | 测试文件（Vitest）                         | `test/no-only-tests`                                                              |
| `jsonc-toml-yaml`     | JSONC / YAML / TOML 配置                   | `jsonc/no-dupe-keys`、`yaml/no-empty-key`、`toml/no-space-dots`                   |
| `sort-structures`     | `package.json`/`tsconfig` 键排序           | `jsonc/sort-keys`、`jsonc/sort-array-values`                                      |
| `markdown-snippets`   | Markdown 代码块                            | 核心 JS 规则在 Markdown 虚拟文件中的行为（如 `eqeqeq`）                           |
| `jsdoc-docs`          | JSDoc 注释参数契合                         | `jsdoc/check-param-names`                                                         |
| `regexp-safety`       | 正则表达式安全                             | `regexp/no-dupe-characters-character-class`                                       |
| `unocss-order`        | UnoCSS blocklist/排序示例                  | `unocss/blocklist`（strict 模式）                                                 |
| `imports-unicorn`     | imports + unicorn 插件联动                 | `import/no-duplicates`、`unicorn/prefer-includes`                                 |
| `pnpm-catalog`        | pnpm catalog 使用                          | `pnpm/json-enforce-catalog`                                                       |
| `formatters-css`      | 格式化器（Prettier）集成                   | `format/prettier`                                                                 |
| `stylistic-curly`     | Stylistic 样式规则                         | `curly`                                                                           |
| `ignores-dist`        | 默认忽略构建产物                           | 倚赖 `ignores` 配置，捕获 ignored warning                                        |

如需新增场景，建议复制现有文件结构并补充说明，保持 `README` 与测试一致。
