import type { TSESTree } from "@typescript-eslint/utils";
import { createEslintRule } from "../utils";

/**
 * 配置选项类型
 * @property {boolean} [groupType=true] - 是否将 type-only 导入分组到最前面
 * @property {string[]} [ignoreNames=[]] - 忽略的模块名称列表
 * @property {number} [maxLines=50] - 导入块最大行数，超过则不自动排序
 */
type Options = [
  {
    groupType?: boolean;
    ignoreNames?: string[];
    maxLines?: number;
  }?,
];

type MessageIds = "shouldSort" | "shouldSortSpecifiers";

type SortableNode
  = | TSESTree.ImportDeclaration
    | TSESTree.ExportAllDeclaration
    | (TSESTree.ExportNamedDeclaration & { source: TSESTree.StringLiteral });

/**
 * 类型守卫函数：判断语句是否为可排序的导入/导出语句
 */
function isSortableStatement(statement: TSESTree.Statement): statement is SortableNode {
  if (statement.type === "ImportDeclaration") {
    return true;
  }
  if (statement.type === "ExportAllDeclaration") {
    return true;
  }
  return statement.type === "ExportNamedDeclaration" && !!statement.source;
}

/**
 * 从导入/导出节点中获取模块名称
 */
function getModuleName(node: SortableNode): string {
  if (node.type === "ImportDeclaration") {
    return node.source.value;
  }
  if (node.type === "ExportAllDeclaration") {
    return node.source.value;
  }
  if (node.type === "ExportNamedDeclaration" && node.source) {
    return node.source.value;
  }
  return "";
}

/**
 * ESLint 自定义规则：按长度排序导入语句
 *
 * 功能特性：
 * - 自动排序文件顶部的导入/导出语句
 * - 优先级：type-only 导入 > 常规导入
 * - 相同优先级：按长度从短到长排序
 * - 支持单个导入内的 specifier 排序
 * - 支持忽略特定模块名称
 * - 支持限制导入块大小
 *
 * 示例：
 * ❌ 修改前：
 *   import { veryLongName } from "module";
 *   import type { T } from "types";
 *   import { a } from "lib";
 *
 * ✅ 修改后：
 *   import type { T } from "types";      // type-only 优先
 *   import { a } from "lib";              // 最短优先
 *   import { veryLongName } from "module";  // 最长
 */
export const importLengthOrderRule = createEslintRule<Options, MessageIds>({
  name: "import-length-order",
  meta: {
    docs: {
      description: "按长度对导入/导出语句排序，type-only 导入优先，短语句优先",
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          groupType: {
            type: "boolean",
            description: "是否将 type-only 导入分组到最前面（默认：true）",
            default: true,
          },
          ignoreNames: {
            type: "array",
            items: { type: "string" },
            description: "要从排序中忽略的模块名称列表",
            default: [],
          },
          maxLines: {
            type: "number",
            description: "导入块的最大行数，超过则不自动排序（默认：50）",
            default: 50,
          },
        },
        additionalProperties: false,
      },
    ],
    type: "suggestion",
    messages: {
      shouldSort: "应该按长度排序导入/导出语句。type-only 导入应放在最前面，其次是较短的语句。",
      shouldSortSpecifiers: "应该按长度排序导入括号内的 specifiers，从最短到最长。",
    },
  },
  defaultOptions: [{ groupType: true, ignoreNames: [], maxLines: 50 }],
  create(context) {
    const sourceCode = context.getSourceCode();
    const [options = {}] = context.options;
    const { groupType = true, ignoreNames = [], maxLines = 50 } = options;

    /**
     * 收集文件顶部的连续 import/export 语句块
     * 遇到其他语句类型则停止收集
     */
    function collectSortableBlock(programNode: TSESTree.Program): SortableNode[] {
      const result: SortableNode[] = [];
      let hasStartedCollecting = false;

      for (const statement of programNode.body) {
        if (!hasStartedCollecting) {
          // 跳过文件头部的指令声明（如 "use strict"）
          if (statement.type === "ExpressionStatement" && typeof statement.directive === "string") {
            continue;
          }
          if (isSortableStatement(statement)) {
            hasStartedCollecting = true;
            result.push(statement);
            continue;
          }
          // 顶部遇到非导入语句说明文件并未以 import/export 块开头，停止收集
          break;
        }

        if (isSortableStatement(statement)) {
          result.push(statement);
          continue;
        }

        // 导入块被中断，停止收集
        break;
      }

      return result;
    }

    /**
     * 对单个 import 语句的 specifiers 进行排序
     * 在大括号内部按长度从短到长排序
     * 仅当 import 语句有具体的 specifiers（不是 default/namespace import）时才处理
     */
    function enforceSpecifierOrder(node: TSESTree.ImportDeclaration): void {
      // 只处理具体的 specifiers，跳过 default 和 namespace imports
      // ImportDefaultSpecifier: import { a } from "x"
      // ImportNamespaceSpecifier: import * as x from "y"
      // ImportSpecifier: 大括号内的具体导入项
      const specifiers = node.specifiers.filter(
        (specifier): specifier is TSESTree.ImportSpecifier => specifier.type === "ImportSpecifier",
      );
      if (specifiers.length < 2) {
        return;
      }

      // 获取大括号位置
      const closeBrace = node.source
        ? sourceCode.getTokenBefore(node.source, (token): token is TSESTree.Token => token.value === "}")
        : null;
      const openBrace = sourceCode.getTokenBefore(
        specifiers[0],
        (token): token is TSESTree.Token => token.value === "{",
      );
      if (!closeBrace || !openBrace) {
        return;
      }

      // 构建 specifier 排序项
      const specifierItems = specifiers.map((specifier, index) => ({
        length: getSpecifierComparableLength(specifier),
        originalIndex: index,
        specifier,
      }));

      // 按长度排序
      const sorted = [...specifierItems].sort((a, b) => {
        if (a.length !== b.length) {
          return a.length - b.length;
        }
        return a.originalIndex - b.originalIndex;
      });

      // 检查是否已排序
      const isOrdered = specifierItems.every((item, idx) => item.originalIndex === sorted[idx].originalIndex);
      if (isOrdered) {
        return;
      }

      const eol = sourceCode.text.includes("\r\n") ? "\r\n" : "\n";
      const innerText = sourceCode.text.slice(openBrace.range[1], closeBrace.range[0]);
      const hasLineBreak = /\r?\n/.test(innerText);
      const beforeFirstSpecifier = sourceCode.text.slice(openBrace.range[1], specifiers[0].range[0]);
      const afterLastSpecifier = sourceCode.text.slice(specifiers[specifiers.length - 1].range[1], closeBrace.range[0]);

      // 检测缩进以保持原有格式
      const indent = hasLineBreak ? detectIndent(innerText, beforeFirstSpecifier) : "";
      const head = beforeFirstSpecifier.length > 0 ? beforeFirstSpecifier : hasLineBreak ? `${eol}${indent}` : " ";
      const tailBase = afterLastSpecifier.length > 0 ? afterLastSpecifier : hasLineBreak ? eol : "";
      const between = hasLineBreak ? `${eol}${indent}` : " ";
      const trailingCommaPreferred = /,\s*$/.test(
        sourceCode.text.slice(specifiers[specifiers.length - 1].range[0], closeBrace.range[0]),
      );

      context.report({
        messageId: "shouldSortSpecifiers",
        node,
        fix(fixer) {
          // 重新排列 specifiers
          const sortedTexts = sorted.map((item, idx) => {
            const text = sourceCode.getText(item.specifier);
            const needsComma = idx < sorted.length - 1 || trailingCommaPreferred;
            return `${text}${needsComma ? "," : ""}`;
          });

          // 构建新的 specifier 列表
          const rewrittenInner = sortedTexts.reduce((acc, text, idx) => {
            if (idx === 0) {
              return `${head}${text}`;
            }
            return `${acc}${between}${text}`;
          }, "");

          const tail = trailingCommaPreferred ? removeLeadingComma(tailBase) : tailBase;
          return fixer.replaceTextRange([openBrace.range[1], closeBrace.range[0]], `${rewrittenInner}${tail}`);
        },
      });
    }

    /**
     * 计算语句的可比较长度（只计算 from 关键字前的部分）
     * 这样可以降低导入路径长度对排序的影响
     */
    function getComparableLength(node: SortableNode): number {
      const fullLength = sourceCode.getText(node).length;
      if (!("source" in node) || !node.source) {
        return fullLength;
      }

      // 找到 from 关键字的位置
      const fromToken = sourceCode.getTokenBefore(node.source, (token): token is TSESTree.Token => token.value === "from");
      const comparableEnd = fromToken ? fromToken.range[0] : node.source.range[0];
      return Math.max(0, comparableEnd - node.range[0]);
    }

    /**
     * 计算单个 specifier 的长度（基于导入名称）
     */
    function getSpecifierComparableLength(specifier: TSESTree.ImportSpecifier): number {
      const importedName = specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value;
      return importedName.length;
    }

    /**
     * 检测 import 大括号内的缩进格式
     * 用于排序后保持原有的缩进风格
     */
    function detectIndent(innerText: string, beforeFirstSpecifier: string): string {
      // 查找第一行缩进
      const match = /\n([ \t]*)\S/.exec(innerText);
      if (match && match[1] !== undefined) {
        return match[1];
      }

      // 查找开括号后的缩进
      const lastNewline = Math.max(beforeFirstSpecifier.lastIndexOf("\n"), beforeFirstSpecifier.lastIndexOf("\r"));
      if (lastNewline >= 0) {
        return beforeFirstSpecifier.slice(lastNewline + 1) || "  ";
      }

      return "  ";
    }

    /**
     * 移除字符串开头的逗号
     * 用于处理尾部逗号的调整
     */
    function removeLeadingComma(tail: string): string {
      const firstNonWhitespace = tail.search(/\S/);
      if (firstNonWhitespace === -1) {
        return tail;
      }
      if (tail[firstNonWhitespace] !== ",") {
        return tail;
      }
      return `${tail.slice(0, firstNonWhitespace)}${tail.slice(firstNonWhitespace + 1)}`;
    }

    /**
     * 获取导入/导出语句的优先级
     * type-only 导入/导出优先级最高（0），普通导入/导出优先级较低（1）
     * 这样可以确保 type-only 导入始终排在最前面
     */
    function getTypePriority(node: SortableNode): number {
      if (node.type === "ImportDeclaration") {
        // 整条导入语句标记为 type
        if (node.importKind === "type") {
          return 0;
        }
        // 所有 specifier 都标记为 type
        if (
          node.specifiers.length > 0
          && node.specifiers.every(
            specifier => specifier.type === "ImportSpecifier" && specifier.importKind === "type",
          )
        ) {
          return 0;
        }
        return 1;
      }

      if (node.type === "ExportAllDeclaration") {
        // export * 不能标记为 type-only，始终返回 1
        return 1;
      }

      if (node.type === "ExportNamedDeclaration") {
        // 整条导出语句标记为 type
        if (node.exportKind === "type") {
          return 0;
        }
        // 所有 specifier 都标记为 type
        if (
          node.specifiers
          && node.specifiers.length > 0
          && node.specifiers.every(specifier => specifier.exportKind === "type")
        ) {
          return 0;
        }
      }

      return 1;
    }

    return {
      Program(programNode) {
        // 收集文件顶部的 import/export 语句块
        const sortableNodes = collectSortableBlock(programNode);
        if (sortableNodes.length < 1) {
          return;
        }

        // 检查行数限制：超过 maxLines 则不自动排序
        const totalLines
          = sortableNodes[sortableNodes.length - 1].loc!.end.line - sortableNodes[0].loc!.start.line + 1;
        if (totalLines > maxLines) {
          return;
        }

        // 如果只有单个导入，检查其 specifier 排序
        if (sortableNodes.length === 1) {
          const node = sortableNodes[0];
          if (node.type === "ImportDeclaration") {
            enforceSpecifierOrder(node);
          }
          return;
        }

        // 构建排序项，保留原始段落信息以支持注释保留
        const items = sortableNodes.map((node, index) => {
          const next = sortableNodes[index + 1];
          const nodeText = sourceCode.getText(node);
          const endPos = node.range[1];
          // 获取到下一个导入节点之间的间隔内容（包括换行和注释）
          const trailingPos = next ? next.range[0] : node.range[1];
          const trailing = sourceCode.text.slice(endPos, trailingPos);

          // 检查是否应该忽略此导入（用户配置了忽略列表）
          const moduleName = getModuleName(node);
          const shouldIgnore = ignoreNames.includes(moduleName);

          return {
            length: shouldIgnore ? 0 : getComparableLength(node),
            node,
            nodeText,
            trailing,
            originalIndex: index,
            priority: groupType ? getTypePriority(node) : 1,
            shouldIgnore,
          };
        });

        // 按优先级和长度排序
        const sorted = [...items].sort((a, b) => {
          // 忽略列表中的模块保持原位置
          if (a.shouldIgnore || b.shouldIgnore) {
            return a.originalIndex - b.originalIndex;
          }
          // 按优先级排序（type-only 优先）
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          // 按长度排序（从短到长）
          if (a.length !== b.length) {
            return a.length - b.length;
          }
          // 保持原有相对顺序
          return a.originalIndex - b.originalIndex;
        });

        // 检查是否已排序
        const isAlreadySorted = items.every((item, idx) => item.originalIndex === sorted[idx].originalIndex);
        if (isAlreadySorted) {
          // ✅ 只有在导入块已排序时，才检查 specifier 排序
          // 避免与导入块排序的 fix 冲突，导致代码被重复复制
          sortableNodes.forEach((node) => {
            if (node.type === "ImportDeclaration") {
              enforceSpecifierOrder(node);
            }
          });
          return;
        }

        // 找到第一个不匹配的位置用于报错
        const firstMismatchIndex = items.findIndex((item, idx) => item.originalIndex !== sorted[idx].originalIndex);
        const replaceStart = sortableNodes[0].range[0];
        const replaceEnd = sortableNodes[sortableNodes.length - 1].range[1];

        context.report({
          messageId: "shouldSort",
          node: sortableNodes[firstMismatchIndex],
          fix(fixer) {
            // 重新组织排序后的导入块
            // 从原始最后一个导入后获取尾部内容（如换行符或注释）
            const lastOriginalTrailing = items[items.length - 1].trailing;

            const rewritten = sorted
              .map((item, idx) => {
                const isLast = idx === sorted.length - 1;
                if (isLast) {
                  // 最后一项：使用原始最后一个节点的 trailing，如果为空则添加换行
                  const trailingToUse = lastOriginalTrailing || "\n";
                  return `${item.nodeText}${trailingToUse}`;
                }
                // 非最后一项：查找其原始位置后的第一个换行
                const itemOriginalTrailing = items[item.originalIndex].trailing;
                // 如果原始 trailing 中有换行，保留它；否则添加一个换行
                if (itemOriginalTrailing && itemOriginalTrailing.trim() === "") {
                  // trailing 是纯空白（包含换行），保留
                  return `${item.nodeText}${itemOriginalTrailing}`;
                }
                // trailing 为空或包含非空白内容，添加换行
                return `${item.nodeText}\n`;
              })
              .join("");
            return fixer.replaceTextRange([replaceStart, replaceEnd], rewritten);
          },
        });
      },
    };
  },
});
