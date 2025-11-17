/**
 * ESLint 规则开发相关工具，包括 RuleCreator、占位解析器与通用辅助函数。
 */

import type { Rule } from "eslint";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";
import type { RuleListener, RuleWithMeta, RuleWithMetaAndName } from "@typescript-eslint/utils/eslint-utils";

/**
 * 伪造的“空解析器”，在不需要 AST 的场景用于绕过 ESLint 的解析逻辑。
 * 通过返回空的 AST 结构和标记 `services.isPlain = true`，告知调用方这是一个占位解析结果。
 */
export const parserPlain = {
  meta: { name: "parser-plain" },
  parseForESLint: (code: string) => ({
    ast: {
      body: [],
      comments: [],
      loc: { end: code.length, start: 0 },
      range: [0, code.length],
      tokens: [],
      type: "Program",
    },
    scopeManager: null,
    services: { isPlain: true },
    visitorKeys: { Program: [] },
  }),
};

// @keep-sorted
/**
 * 记录已经撰写独立文档的规则名称，便于自动拼装链接。
 */
const hasDocs = [
  "css-property-order",
  "import-length-order",
] as const;

/**
 * 根据规则是否存在文档构造链接；默认指向仓库的 src/rules 目录。
 * 可按需修改为你的实际 GitHub 项目地址。
 */
const blobUrl = "https://github.com/senran/eslint-config/blob/main/src/rules/";

export interface RuleModule<T extends readonly unknown[]> extends Rule.RuleModule {
  defaultOptions: T;
}

/**
 * 构建一个可复用的 RuleCreator，自动挂载默认配置和文档链接。
 */
function RuleCreator(urlCreator: (name: string) => string) {
  return function createNamedRule<TOptions extends readonly unknown[], TMessageIds extends string>({
    meta,
    name,
    ...rule
  }: Readonly<RuleWithMetaAndName<TOptions, TMessageIds>>): RuleModule<TOptions> {
    return createRule<TOptions, TMessageIds>({
      meta: {
        ...meta,
        docs: {
          ...meta.docs,
          url: urlCreator(name),
        },
      },
      ...rule,
    });
  };
}

/**
 * 生成一个带默认配置合并逻辑的规则定义，便于在 create 函数中直接读取。
 */
function createRule<TOptions extends readonly unknown[], TMessageIds extends string>({
  create,
  defaultOptions,
  meta,
}: Readonly<RuleWithMeta<TOptions, TMessageIds>>): RuleModule<TOptions> {
  return {
    create: ((
      context: Readonly<RuleContext<TMessageIds, TOptions>>,
    ): RuleListener => {
      const optionsWithDefault = context.options.map((options, index) => {
        const fallback = defaultOptions[index] || {};
        return {
          ...fallback,
          ...options || {},
        };
      }) as unknown as TOptions;
      return create(context, optionsWithDefault);
    }) as any,
    defaultOptions,
    meta: meta as any,
  };
}

export const createEslintRule = RuleCreator(
  ruleName => hasDocs.includes(ruleName as (typeof hasDocs)[number])
    ? `${blobUrl}${ruleName}.md`
    : `${blobUrl}${ruleName}.test.ts`,
) as any as <TOptions extends readonly unknown[], TMessageIds extends string>(options: Readonly<RuleWithMetaAndName<TOptions, TMessageIds>>) => RuleModule<TOptions>;

const warned = new Set<string>();

/**
 * 只在第一次触发时打印警告，避免重复噪音。
 */
export function warnOnce(message: string): void {
  if (warned.has(message)) {
    return;
  }
  warned.add(message);
  console.warn(message);
}

const reFullWhitespace = /^\s*$/;

/**
 * 去除模板字符串共有的前置缩进，并裁剪首尾空行，方便在规则中比较原始缩进。
 */
export function unindent(str: TemplateStringsArray | string): string {
  const lines = (typeof str === "string" ? str : str[0]).split("\n");
  const whitespaceLines = lines.map(line => reFullWhitespace.test(line));

  const commonIndent = lines.reduce((min, line, idx) => {
    if (whitespaceLines[idx]) {
      return min;
    }
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    return Math.min(min, indent);
  }, Number.POSITIVE_INFINITY);

  let emptyLinesHead = 0;
  while (emptyLinesHead < lines.length && whitespaceLines[emptyLinesHead]) {
    emptyLinesHead++;
  }
  let emptyLinesTail = 0;
  while (emptyLinesTail < lines.length && whitespaceLines[lines.length - emptyLinesTail - 1]) {
    emptyLinesTail++;
  }

  return lines
    .slice(emptyLinesHead, lines.length - emptyLinesTail)
    .map(line => line.slice(commonIndent))
    .join("\n");
}
