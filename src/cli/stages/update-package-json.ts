import type { PromptResult, ExtraLibrariesOption } from "../types"

import fsp from "node:fs/promises"

import path from "node:path"
import process from "node:process"
import c from "ansis"
import { version } from "../../../package.json"
import { versionsMap } from "../constants-generated"

import { dependenciesMap } from "../constants"
import * as p from "@clack/prompts"

/**
 * 更新 package.json 文件。
 *
 * 作用：
 * 1. 将本配置包 (@fonds/eslint-config) 更新到最新版本。
 * 2. 根据用户的框架选择 (Vue, React 等)，自动向 devDependencies 添加缺失的依赖插件。
 *    (依赖版本信息来源于 constants-generated.ts)
 */
export async function updatePackageJson(result: PromptResult): Promise<void> {
  const cwd = process.cwd()

  const pathPackageJSON = path.join(cwd, "package.json")

  p.log.step(c.cyan`Bumping @fonds/eslint-config to v${version}`)

  const pkgContent = await fsp.readFile(pathPackageJSON, "utf-8")
  const pkg: Record<string, any> = JSON.parse(pkgContent)

  // 确保 devDependencies 存在
  pkg.devDependencies ??= {}

  // 更新主包版本
  pkg.devDependencies["@fonds/eslint-config"] = `^${version}`
  // 确保 eslint 已安装
  pkg.devDependencies.eslint ??= versionsMap.eslint

  const addedPackages: string[] = []

  // === 处理额外工具依赖 ===
  if (result.extra.length) {
    result.extra.forEach((item: ExtraLibrariesOption) => {
      switch (item) {
        case "formatter":
          (<const>[
            ...dependenciesMap.formatter,
            // 如果启用了 Astro，还需要添加 Astro 的格式化插件
            ...(result.frameworks.includes("astro") ? dependenciesMap.formatterAstro : []),
          ]).forEach((f) => {
            if (!f)
              return
            pkg.devDependencies[f] = versionsMap[f as keyof typeof versionsMap]
            addedPackages.push(f)
          })
          break
        case "unocss":
          dependenciesMap.unocss.forEach((f) => {
            pkg.devDependencies[f] = versionsMap[f as keyof typeof versionsMap]
            addedPackages.push(f)
          })
          break
      }
    })
  }

  // === 处理框架依赖 ===
  for (const framework of result.frameworks) {
    const deps = dependenciesMap[framework]
    if (deps) {
      deps.forEach((f) => {
        pkg.devDependencies[f] = versionsMap[f as keyof typeof versionsMap]
        addedPackages.push(f)
      })
    }
  }

  if (addedPackages.length)
    p.note(c.dim(addedPackages.join(", ")), "Added packages")

  // 写入更新后的 package.json
  await fsp.writeFile(pathPackageJSON, JSON.stringify(pkg, null, 2))
  p.log.success(c.green`Changes wrote to package.json`)
}
