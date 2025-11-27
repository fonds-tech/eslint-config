// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck
// 部分 ESLint 插件缺乏完整的 TypeScript 类型定义，因此在此文件中禁用类型检查

// 重新导出所有使用的插件实例
// 目的：
// 1. 集中管理插件依赖，确保版本一致性
// 2. 简化其他配置模块中的引用路径
// 3. 统一处理 ESM/CommonJS 的互操作性问题（default export）

export { default as pluginComments } from "@eslint-community/eslint-plugin-eslint-comments"
export { default as pluginFonds } from "eslint-plugin-fonds" // 本项目自有的辅助插件
export { default as pluginImportLite } from "eslint-plugin-import-lite"
export { default as pluginNode } from "eslint-plugin-n"
export { default as pluginPerfectionist } from "eslint-plugin-perfectionist"
export { default as pluginUnicorn } from "eslint-plugin-unicorn"
export { default as pluginUnusedImports } from "eslint-plugin-unused-imports"
