import fs from "node:fs/promises"
import process from "node:process"
import { join } from "node:path"
import { execa } from "execa"
import { it, expect, afterAll, beforeEach } from "vitest"

// CLI 入口文件的绝对路径，指向构建后的 bin/index.js 或源码中的相应入口
const CLI_PATH = join(__dirname, "../bin/index.js")
// 生成一个随机路径作为测试用的临时工作目录，避免不同测试间冲突
const genPath = join(__dirname, "..", ".temp", randomStr())

// 生成随机字符串的辅助函数，用于创建唯一的临时目录名
function randomStr() {
  return Math.random().toString(36).slice(2)
}

// 封装执行 CLI 命令的辅助函数
// params: 传递给 CLI 的命令行参数数组
// env: 运行命令时的环境变量，默认设置 SKIP_PROMPT 跳过交互，NO_COLOR 禁用颜色输出以便于文本断言
async function run(params: string[] = [], env = {
  SKIP_PROMPT: "1",
  NO_COLOR: "1",
}) {
  // 使用 execa 启动一个新的 Node.js 进程来运行 CLI
  return execa("node", [CLI_PATH, ...params], {
    cwd: genPath, // 设置当前工作目录为我们创建的临时目录
    env: {
      ...process.env, // 继承当前进程的环境变量
      ...env, // 覆盖或添加特定的环境变量
    },
  })
};

// 创建模拟项目环境的辅助函数
async function createMockDir() {
  // 确保临时目录是干净的：先强制递归删除
  await fs.rm(genPath, { recursive: true, force: true })
  // 重新创建临时目录
  await fs.mkdir(genPath, { recursive: true })

  // 并行创建一系列模拟文件，模拟一个真实的老旧项目环境
  await Promise.all([
    // 创建一个空的 package.json
    fs.writeFile(join(genPath, "package.json"), JSON.stringify({}, null, 2)),
    // 创建 .eslintrc.yml 模拟旧版 ESLint 配置
    fs.writeFile(join(genPath, ".eslintrc.yml"), ""),
    // 创建 .eslintignore 模拟旧版忽略文件
    fs.writeFile(join(genPath, ".eslintignore"), "some-path\nsome-file"),
    // 创建 .prettierc 模拟 Prettier 配置
    fs.writeFile(join(genPath, ".prettierc"), ""),
    // 创建 .prettierignore 模拟 Prettier 忽略文件
    fs.writeFile(join(genPath, ".prettierignore"), "some-path\nsome-file"),
  ])
};

// 在每个测试用例运行前，都重新创建干净的模拟环境
beforeEach(async () => await createMockDir())

// 在所有测试结束后，清理临时目录，保持环境整洁
afterAll(async () => await fs.rm(genPath, { recursive: true, force: true }))

it("package.json 已更新", async () => {
  // 执行 CLI 命令，不带额外参数
  const { stdout } = await run()

  // 读取 CLI 执行后的 package.json 文件内容
  const pkgContent: Record<string, any> = JSON.parse(await fs.readFile(join(genPath, "package.json"), "utf-8"))

  // 断言：package.json 的 devDependencies 中应该已经被添加了 @fonds/eslint-config 依赖
  expect(JSON.stringify(pkgContent.devDependencies)).toContain("@fonds/eslint-config")
  // 断言：CLI 的标准输出中应该包含修改了 package.json 的提示信息
  expect(stdout).toContain("Changes wrote to package.json")
})

it("生成 ESM 格式的 eslint.config.js", async () => {
  // 读取当前的 package.json
  const pkgContent = await fs.readFile("package.json", "utf-8")
  // 修改 package.json，显式设置 "type": "module"，这将告诉 CLI 生成 ESM 格式的配置
  await fs.writeFile(join(genPath, "package.json"), JSON.stringify({ ...JSON.parse(pkgContent), type: "module" }, null, 2))

  // 执行 CLI 命令
  const { stdout } = await run()

  // 读取生成的 eslint.config.js 文件
  const eslintConfigContent = await fs.readFile(join(genPath, "eslint.config.js"), "utf-8")
  // 断言：生成的文件内容应该包含 "export default"，这是 ESM 的语法特征
  expect(eslintConfigContent.includes("export default")).toBeTruthy()
  // 断言：输出中确认了创建的是 eslint.config.js 文件
  expect(stdout).toContain("Created eslint.config.js")
})

it("忽略文件已添加到 eslint.config.js", async () => {
  // 执行 CLI 命令
  const { stdout } = await run()

  // 读取生成的配置文件 (默认为 eslint.config.mjs，因为 package.json 未设为 module)
  // 这里的 replace 是为了统一路径分隔符，避免 Windows 下的反斜杠问题影响断言
  const eslintConfigContent = (await fs.readFile(join(genPath, "eslint.config.mjs"), "utf-8")).replace(/\\/g, "/")

  // 断言：确认生成了 eslint.config.mjs 文件
  expect(stdout).toContain("Created eslint.config.mjs")
  // 断言：验证生成的内容快照，确保 ignores 数组正确包含了从 .eslintignore 迁移过来的模式
  expect(eslintConfigContent)
    .toMatchInlineSnapshot(`
      "import fonds from '@fonds/eslint-config'

      export default fonds({
        ignores: ["some-path","**/some-path/**","some-file","**/some-file/**"],
      })
      "
    `)
})

it("建议移除不必要的文件", async () => {
  // 执行 CLI 命令
  const { stdout } = await run()

  // 断言：CLI 输出中应该包含建议用户手动移除旧配置文件的提示
  expect(stdout).toContain("You can now remove those files manually")
  // 断言：CLI 输出中应该列出具体的旧文件列表 (.eslintignore, .eslintrc.yml 等)
  expect(stdout).toContain(".eslintignore, .eslintrc.yml, .prettierc, .prettierignore")
})

it("cLI 模板参数", async () => {
  // 使用 --template 参数指定 react 模板运行 CLI
  const { stdout } = await run(["--template", "react"])

  // 读取生成的配置文件
  const eslintConfigContent = await fs.readFile(join(genPath, "eslint.config.mjs"), "utf-8")
  // 断言：生成的配置中应该启用了 react: true
  expect(eslintConfigContent).toContain("react: true")
  // 断言：确认配置文件已创建
  expect(stdout).toContain("Created eslint.config.mjs")
})

it("cLI 额外工具参数", async () => {
  // 使用 --extra 参数指定 unocss 工具运行 CLI
  const { stdout } = await run(["--extra", "unocss"])

  // 读取生成的配置文件
  const eslintConfigContent = await fs.readFile(join(genPath, "eslint.config.mjs"), "utf-8")
  // 断言：生成的配置中应该启用了 unocss: true
  expect(eslintConfigContent).toContain("unocss: true")
  // 断言：确认配置文件已创建
  expect(stdout).toContain("Created eslint.config.mjs")
})
