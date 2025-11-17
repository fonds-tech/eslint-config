/**
 * Flat Config 相关工具函数，集中处理配置组合与规则重命名逻辑。
 */

import type { Awaitable, TypedFlatConfigItem } from "../types";

/**
 * 将可能为单个配置或配置数组的参数统一展平为一个数组，便于批量处理。
 */
export async function combine(...configs: Awaitable<TypedFlatConfigItem | TypedFlatConfigItem[]>[]): Promise<TypedFlatConfigItem[]> {
  const resolved = await Promise.all(configs);
  return resolved.flat();
}

/**
 * 根据映射表替换规则名称中的插件前缀，用于兼容不同命名空间。
 */
export function renameRules(rules: Record<string, any>, map: Record<string, string>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(rules).map(([key, value]) => {
      for (const [from, to] of Object.entries(map)) {
        if (key.startsWith(`${from}/`)) {
          return [to + key.slice(from.length), value];
        }
      }
      return [key, value];
    }),
  );
}

/**
 * 批量重命名 Flat Config 中的插件名，保证规则与插件引用保持一致。
 */
export function renamePluginInConfigs(configs: TypedFlatConfigItem[], map: Record<string, string>): TypedFlatConfigItem[] {
  return configs.map((i) => {
    const clone = { ...i };
    if (clone.rules) {
      clone.rules = renameRules(clone.rules, map);
    }
    if (clone.plugins) {
      clone.plugins = Object.fromEntries(
        Object.entries(clone.plugins).map(([key, value]) => {
          if (key in map) {
            return [map[key], value];
          }
          return [key, value];
        }),
      );
    }
    return clone;
  });
}

/**
 * 将输入统一包装为数组，便于对外部传参提供灵活写法。
 */
export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
