import process from "node:process"
import c from "ansis"
import { run } from "./run"
import { cac } from "cac"
import { version } from "../../package.json"
import * as p from "@clack/prompts"

// 打印 CLI 头部欢迎信息
function header(): void {
  console.log("\n")
  p.intro(`${c.green`@fonds/eslint-config `}${c.dim`v${version}`}`)
}

const cli = cac("@fonds/eslint-config")

// 定义 CLI 命令与参数
cli
  .command("", "Run the initialization or migration") // 默认命令
  .option("--yes, -y", "Skip prompts and use default values", { default: false }) // 跳过交互，使用默认值
  .option("--template, -t <template>", "Use the framework template for optimal customization: vue / react / svelte / astro", { type: [] }) // 指定框架模板
  .option("--extra, -e <extra>", "Use the extra utils: formatter / perfectionist / unocss", { type: [] }) // 指定额外组件
  .action(async (args) => {
    header()
    try {
      // 执行主逻辑
      await run({ ...args, frameworks: args.template })
    }
    catch (error) {
      p.log.error(c.inverse.red(" Failed to migrate "))
      p.log.error(c.red`✘ ${String(error)}`)
      process.exit(1)
    }
  })

cli.help()
cli.version(version)
cli.parse()
