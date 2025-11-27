import { execSync } from "node:child_process"

/**
 * 检查当前 Git 仓库是否干净（无未提交的更改）。
 * 用于防止自动迁移覆盖用户未保存的工作。
 */
export function isGitClean(): boolean {
  try {
    execSync("git diff-index --quiet HEAD --")
    return true
  }
  catch {
    return false
  }
}

/**
 * 生成 eslint.config.js 文件内容。
 * @param mainConfig 主配置对象字符串
 * @param additionalConfigs 额外的配置对象字符串数组
 */
export function getEslintConfigContent(
  mainConfig: string,
  additionalConfigs?: string[],
): string {
  return `
import fonds from '@fonds/eslint-config'

export default fonds({
${mainConfig}
}${additionalConfigs?.map(config => `,{
${config}
}`)})
`.trimStart()
}
