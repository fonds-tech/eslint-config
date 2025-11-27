import type { OptionsUnicorn, TypedFlatConfigItem } from "../types"

import { pluginUnicorn } from "../plugins"

/**
 * Unicorn 插件配置。
 * eslint-plugin-unicorn 提供了大量强力的、独特的规则，涵盖了文件系统、数组方法、正则等多方面。
 */
export async function unicorn(options: OptionsUnicorn = {}): Promise<TypedFlatConfigItem[]> {
  const {
    allRecommended = false,
    overrides = {},
  } = options
  return [
    {
      name: "fonds/unicorn/rules",
      plugins: {
        unicorn: pluginUnicorn,
      },
      rules: {
        ...(allRecommended
          ? pluginUnicorn.configs.recommended.rules as any
          : {
              // === 精选 Unicorn 规则 ===
              // 默认不启用所有规则，因为部分规则过于激进或有争议

              "unicorn/consistent-empty-array-spread": "error", // 统一空数组展开风格
              "unicorn/error-message": "error", // new Error() 必须带消息 (防止抛出空错误)
              "unicorn/escape-case": "error", // 强制十六进制转义使用大写 (例如 \xA9)
              "unicorn/new-for-builtins": "error", // 强制内置构造函数 (Array, Object 等) 使用 new 关键字
              "unicorn/no-instanceof-builtins": "error", // 禁止对内置类型使用 instanceof (例如 arr instanceof Array -> Array.isArray(arr))
              "unicorn/no-new-array": "error", // 禁止 new Array(10) 这种易混淆的写法
              "unicorn/no-new-buffer": "error", // 禁止 new Buffer() (已废弃，应使用 Buffer.from)
              "unicorn/number-literal-case": "error", // 强制数字字面量格式 (0X1a -> 0x1A)
              "unicorn/prefer-dom-node-text-content": "error", // 优先使用 textContent 而非 innerText
              "unicorn/prefer-includes": "error", // 优先使用 .includes() 而非 .indexOf() !== -1
              "unicorn/prefer-node-protocol": "error", // 强制 Node.js 内置模块使用 node: 前缀 (如 import fs from 'node:fs')
              "unicorn/prefer-number-properties": "error", // 优先使用 Number.parseInt 等静态方法而非全局 parseInt
              "unicorn/prefer-string-starts-ends-with": "error", // 优先使用 startsWith/endsWith 而非正则
              "unicorn/prefer-type-error": "error", // 类型检查失败时优先抛出 TypeError
              "unicorn/throw-new-error": "error", // throw 后面必须跟 Error 对象 (禁止 throw "error")
            }),
        ...overrides,
      },
    },
  ]
}
