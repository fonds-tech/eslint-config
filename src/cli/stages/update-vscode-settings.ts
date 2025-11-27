import type { PromptResult } from "../types"
import fs from "node:fs"

import fsp from "node:fs/promises"

import path from "node:path"
import process from "node:process"
import { green } from "ansis"

import { vscodeSettingsString } from "../constants"
import * as p from "@clack/prompts"

/**
 * 更新 VS Code 配置 (.vscode/settings.json)。
 *
 * 作用：
 * 自动配置 VS Code 以支持 ESLint Flat Config，并优化保存时的自动修复体验。
 *
 * 逻辑：
 * 1. 检查 .vscode 目录是否存在，不存在则创建。
 * 2. 如果 settings.json 不存在，直接创建并写入默认配置。
 * 3. 如果存在，则尝试将新的 ESLint 配置追加到现有 JSON 对象的末尾。
 *    注意：这里采用了简单的字符串追加方式 (append)，而非解析 JSON 后合并，
 *    这是一种为了保留用户原有注释和格式的折衷方案，但假设了 JSON 结尾是大括号。
 */
export async function updateVscodeSettings(result: PromptResult): Promise<void> {
  const cwd = process.cwd()

  if (!result.updateVscodeSettings)
    return

  const dotVscodePath: string = path.join(cwd, ".vscode")
  const settingsPath: string = path.join(dotVscodePath, "settings.json")

  if (!fs.existsSync(dotVscodePath))
    await fsp.mkdir(dotVscodePath, { recursive: true })

  if (!fs.existsSync(settingsPath)) {
    await fsp.writeFile(settingsPath, `{${vscodeSettingsString}}\n`, "utf-8")
    p.log.success(green`Created .vscode/settings.json`)
  }
  else {
    let settingsContent = await fsp.readFile(settingsPath, "utf8")

    settingsContent = settingsContent.trim().replace(/\s*\}$/, "")
    settingsContent += settingsContent.endsWith(",") || settingsContent.endsWith("{") ? "" : ","
    settingsContent += `${vscodeSettingsString}}\n`

    await fsp.writeFile(settingsPath, settingsContent, "utf-8")
    p.log.success(green`Updated .vscode/settings.json`)
  }
}
