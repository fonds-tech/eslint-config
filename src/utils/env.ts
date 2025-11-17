/**
 * 运行环境探测工具，用于根据执行上下文调整 ESLint 行为。
 */

import process from "node:process";

/**
 * 判断当前执行是否源自 Git Hooks 或 lint-staged，避免与编辑器环境混淆。
 */
export function isInGitHooksOrLintStaged(): boolean {
  return !!(false || process.env.GIT_PARAMS || process.env.VSCODE_GIT_COMMAND || process.env.npm_lifecycle_script?.startsWith("lint-staged"));
}

/**
 * 判断当前是否处于编辑器触发的 ESLint 运行环境，用于决定是否启用一些特定优化。
 */
export function isInEditorEnv(): boolean {
  if (process.env.CI) {
    return false;
  }
  if (isInGitHooksOrLintStaged()) {
    return false;
  }
  return !!(false || process.env.VSCODE_PID || process.env.VSCODE_CWD || process.env.JETBRAINS_IDE || process.env.VIM || process.env.NVIM);
}
