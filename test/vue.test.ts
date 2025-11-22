import type { OptionsConfig, TypedFlatConfigItem } from "../src"
import { fonds } from "../src"
import { ESLint } from "eslint"
import { it, expect, describe } from "vitest"

// 类型定义
type FondsFlatOptions = OptionsConfig & Omit<TypedFlatConfigItem, "files">

describe("vue 特定规则", () => {
  // 创建 ESLint 实例的辅助函数
  const createESLint = async (options?: FondsFlatOptions) => {
    // 生成启用 Vue 和 TypeScript 支持的配置
    const configs = await fonds({
      vue: true,
      typescript: true,
      ...options,
    } as FondsFlatOptions)

    return new ESLint({
      overrideConfigFile: true,
      overrideConfig: configs as any,
    })
  }

  it("应验证 Vue 特定语法", async () => {
    const eslint = await createESLint()
    // 构造一段 Vue SFC 代码，其中使用了 v-html 指令
    // v-html 容易导致 XSS 攻击，通常是一个被禁止或警告的做法
    const code = `
<template>
  <div v-html="userProvidedContent"></div>
</template>
<script setup>
const userProvidedContent = '<p>Malicious</p>'
</script>
`
    // 执行 Lint
    const results = await eslint.lintText(code, { filePath: "test.vue" })
    // 检查 vue/no-v-html 规则的触发情况
    const warnings = results[0].messages.filter(msg => msg.ruleId === "vue/no-v-html")

    // 断言：在我们的配置中，这个规则是被有意关闭的 (Opinionated Choice)，因此不应该报错
    expect(warnings.length).toBe(0)
  })

  it("应验证 Vue SFC 中的 TypeScript", async () => {
    const eslint = await createESLint()
    // 构造一段包含 TypeScript 语法的 Vue SFC 代码
    // <script setup lang="ts"> 声明了使用 TS
    // const count: number = "string"; 包含一个明显的类型赋值错误
    const code = `
<template>
  <div>{{ count }}</div>
</template>
<script setup lang="ts">
const count: number = "string"; // 类型错误
</script>
`
    // 执行 Lint
    // 注意：即使代码中有 TS 类型错误，ESLint 本身（如果不使用类型感知解析器或特定规则）通常不会直接把 TS 类型错误当作 Lint 错误报告出来
    // 除非启用了像 @typescript-eslint/no-unsafe-assignment 这样的规则
    const results = await eslint.lintText(code, { filePath: "test.vue" })

    // 这个测试的主要目的是验证 vue-eslint-parser 是否能够正确委派给 @typescript-eslint/parser 来解析 <script lang="ts"> 块
    // 如果解析配置不正确，ESLint 可能会在解析阶段就崩溃（抛出 Fatal Error），因为它无法理解 TS 语法（如类型注解）

    // 断言：没有致命错误 (Fatal Error)，说明解析器配置正确，Vue + TS 集成正常
    expect(results[0].fatalErrorCount).toBe(0)
  })
})
