import { fonds } from "./factory"

// 导出所有具体的配置工厂函数 (如 javascript, typescript, vue 等)
export * from "./configs"
// 导出核心工厂函数
export * from "./factory"
// 导出全局文件匹配模式 (Globs)
export * from "./globs"
// 导出类型定义
export * from "./types"
// 导出通用工具函数
export * from "./utils"

// 默认导出核心工厂函数，这是用户使用的主要入口
export default fonds
