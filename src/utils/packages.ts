/**
 * 包管理与动态加载相关工具，负责检测依赖可用性与按需导入模块。
 */

import type { Awaitable } from "../types";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isPackageExists } from "local-pkg";

// 将当前模块的 URL 转成文件系统路径，便于在不同运行环境中定位包
const scopeUrl = fileURLToPath(new URL(".", import.meta.url));
// 判断当前工作目录所处的 Node 模块查找范围内是否存在本包
const isCwdInScope = isPackageExists("@senran/eslint-config");

/**
 * 兼容 CommonJS 与 ESM 的默认导出，优先返回 `default` 字段，否则回退到模块本身。
 */
export async function interopDefault<T>(m: Awaitable<T>): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await m;
  return (resolved as any).default || resolved;
}

/**
 * 判断指定包名是否在当前模块范围内可解析，底层依赖 `local-pkg` 的路径解析。
 */
export function isPackageInScope(name: string): boolean {
  return isPackageExists(name, { paths: [scopeUrl] });
}

/**
 * 确认给定依赖是否已安装；在本地交互环境中可提示用户安装缺失依赖。
 * - CI 环境或非交互终端直接跳过，避免阻塞流水线。
 * - 仅在缺失依赖时通过 @clack/prompts 提示安装，提升开发体验。
 */
export async function ensurePackages(packages: (string | undefined)[]): Promise<void> {
  if (process.env.CI || process.stdout.isTTY === false || isCwdInScope === false) {
    return;
  }

  const nonExistingPackages = packages.filter(i => i && !isPackageInScope(i)) as string[];
  if (nonExistingPackages.length === 0) {
    return;
  }

  const p = await import("@clack/prompts");
  // 通过交互式确认，统一处理单个和多个依赖的提示语句
  const result = await p.confirm({
    message: `${nonExistingPackages.length === 1 ? "Package is" : "Packages are"} required for this config: ${nonExistingPackages.join(", ")}. Do you want to install them?`,
  });
  if (result) {
    // 动态引入安装工具，避免在无需安装时增加启动开销
    await import("@antfu/install-pkg").then(i => i.installPackage(nonExistingPackages, { dev: true }));
  }
}
