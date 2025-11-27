import type { PromptResult } from "../types"

import fs from "node:fs"
import fsp from "node:fs/promises"

import path from "node:path"
import process from "node:process"
import c from "ansis"
// @ts-expect-error missing types
import parse from "parse-gitignore"
import { getEslintConfigContent } from "../utils"
import * as p from "@clack/prompts"

/**
 * 更新或创建 ESLint 配置文件。
 *
 * 主要任务：
 * 1. 检测项目是 CJS 还是 ESM，决定生成 `eslint.config.js` 还是 `eslint.config.mjs`。
 * 2. 迁移旧的 `.eslintignore` 文件内容到新配置的 `ignores` 属性中。
 * 3. 根据用户选择的框架和工具，生成配置文件的内容。
 * 4. 提示用户清理旧的 ESLint/Prettier 配置文件。
 */
export async function updateEslintFiles(result: PromptResult): Promise<void> {
  const cwd = process.cwd()
  const pathESLintIgnore = path.join(cwd, ".eslintignore")
  const pathPackageJSON = path.join(cwd, "package.json")

  const pkgContent = await fsp.readFile(pathPackageJSON, "utf-8")
  const pkg: Record<string, any> = JSON.parse(pkgContent)

  // 根据 package.json 的 type 字段决定配置文件扩展名
  const configFileName = pkg.type === "module" ? "eslint.config.js" : "eslint.config.mjs"
  const pathFlatConfig = path.join(cwd, configFileName)

  // === 迁移 .eslintignore ===
  const eslintIgnores: string[] = []
  if (fs.existsSync(pathESLintIgnore)) {
    p.log.step(c.cyan`Migrating existing .eslintignore`)
    const content = await fsp.readFile(pathESLintIgnore, "utf-8")
    const parsed = parse(content)
    const globs = parsed.globs()

    // 将 gitignore 风格的 glob 转换为 ESLint 配置中的 ignores
    for (const glob of globs) {
      if (glob.type === "ignore")
        eslintIgnores.push(...glob.patterns)
      else if (glob.type === "unignore")
        eslintIgnores.push(...glob.patterns.map((pattern: string) => `!${pattern}`))
    }
  }

  // === 构建配置内容 ===
  const configLines: string[] = []

  // 添加 ignores
  if (eslintIgnores.length)
    configLines.push(`ignores: ${JSON.stringify(eslintIgnores)},`)

  // 添加 extra 工具
  if (result.extra.includes("formatter"))
    configLines.push(`formatters: true,`)

  if (result.extra.includes("unocss"))
    configLines.push(`unocss: true,`)

  // 添加框架支持
  for (const framework of result.frameworks)
    configLines.push(`${framework}: true,`)

  const mainConfig = configLines.map(i => `  ${i}`).join("\n")
  const additionalConfig: string[] = []

  const eslintConfigContent: string = getEslintConfigContent(mainConfig, additionalConfig)

  // 写入文件
  await fsp.writeFile(pathFlatConfig, eslintConfigContent)
  p.log.success(c.green`Created ${configFileName}`)

  // === 检查并提示清理旧文件 ===
  const files = fs.readdirSync(cwd)
  const legacyConfig: string[] = []
  files.forEach((file) => {
    // 匹配 .eslintrc.*, .prettierrc.* 等旧配置文件
    if (/eslint|prettier/.test(file) && !/eslint\.config\./.test(file))
      legacyConfig.push(file)
  })

  if (legacyConfig.length)
    p.note(c.dim(legacyConfig.join(", ")), "You can now remove those files manually")
}
