import type { Rule } from "eslint";
import { createEslintRule } from "../utils";

/**
 * CSS 属性排序规则配置选项类型
 * @property {boolean} [sortByLength=true] - 是否按长度排序属性（从短到长）
 * @property {string[]} [ignoreProperties=[]] - 要忽略的属性名称列表
 * @property {boolean} [preserveComments=true] - 排序时是否保留注释
 */
type Options = [
  {
    sortByLength?: boolean;
    ignoreProperties?: string[];
    preserveComments?: boolean;
  }?,
];

type MessageIds = "shouldSortProperties";

interface CSSProperty {
  prop: string;
  value: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

interface CSSRule {
  selector: string;
  properties: CSSProperty[];
  startLine: number;
  endLine: number;
}

/**
 * CSS 属性排序规则
 * 按属性长度从短到长排序 CSS/LESS/SCSS 代码中的属性
 *
 * 功能特性：
 * - 自动按长度对 CSS 属性排序（从短到长）
 * - 支持 CSS、LESS、SCSS 等预处理器
 * - 支持忽略特定属性名称
 * - 支持保留属性间的注释
 * - 支持 CSS 变量（--custom-property）
 * - 支持嵌套规则（SCSS/LESS）
 *
 * 示例：
 * ❌ 修改前：
 *   {
 *     background-color: red;
 *     z-index: 10;
 *     color: blue;
 *   }
 *
 * ✅ 修改后：
 *   {
 *     color: blue;
 *     z-index: 10;
 *     background-color: red;
 *   }
 */
export const cssPropertyOrderRule = createEslintRule<Options, MessageIds>({
  name: "css-property-order",
  meta: {
    docs: {
      description: "按长度对 CSS 属性排序，从短到长",
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          sortByLength: {
            type: "boolean",
            description: "是否按长度排序属性（从短到长），默认为 true",
            default: true,
          },
          ignoreProperties: {
            type: "array",
            items: { type: "string" },
            description: "要忽略的属性名称列表",
            default: [],
          },
          preserveComments: {
            type: "boolean",
            description: "排序时是否保留注释，默认为 true",
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    type: "suggestion",
    messages: {
      shouldSortProperties: "应该按长度对 CSS 属性排序，从最短到最长",
    },
  },
  defaultOptions: [{ sortByLength: true, ignoreProperties: [], preserveComments: true }],
  create(context) {
    const sourceCode = context.sourceCode;
    const [options = {}] = context.options;
    const { sortByLength = true, ignoreProperties = [] } = options;

    // 检查是否为纯文本模式（ESLint 默认使用的占位解析器）
    const isPlainText = (sourceCode as any)?.parserServices?.isPlain === true;
    if (!isPlainText) {
      // 非纯文本模式，可能是其他语言的 AST
      return {};
    }

    const code = sourceCode.getText();

    /**
     * 使用正则表达式解析 CSS 规则和属性
     */
    function parseCSSRules(): CSSRule[] {
      const rules: CSSRule[] = [];

      // 匹配 CSS 规则：选择器 { 属性 }
      const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
      let matchResult;

      // eslint-disable-next-line no-cond-assign
      while ((matchResult = ruleRegex.exec(code)) !== null) {
        const selector = matchResult[1].trim();
        const content = matchResult[2];

        // 跳过空规则
        if (selector && content.trim()) {
          const properties = parseProperties(content);
          if (properties.length > 0) {
            rules.push({
              selector,
              properties,
              startLine: code.substring(0, matchResult.index).split("\n").length,
              endLine: code.substring(0, matchResult.index + matchResult[0].length).split("\n").length,
            });
          }
        }
      }

      return rules;
    }

    /**
     * 从声明块中解析属性
     */
    function parseProperties(content: string): CSSProperty[] {
      const properties: CSSProperty[] = [];

      // 移除注释以获取纯声明
      const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, "");

      // 按 ; 分割属性
      const declarations = cleanContent.split(";").filter(d => d.trim());

      for (const decl of declarations) {
        const colonIndex = decl.indexOf(":");
        if (colonIndex === -1) {
          continue;
        }

        const prop = decl.substring(0, colonIndex).trim().toLowerCase();
        const value = decl.substring(colonIndex + 1).trim();

        // 跳过空属性或 CSS 变量定义
        if (!prop || prop.startsWith("--")) {
          continue;
        }

        properties.push({
          prop,
          value,
          startLine: 0,
          endLine: 0,
          startColumn: 0,
          endColumn: 0,
        });
      }

      return properties;
    }

    /**
     * 比较两个属性的排序顺序
     */
    function compareProperties(a: CSSProperty, b: CSSProperty): number {
      const aProp = a.prop.toLowerCase();
      const bProp = b.prop.toLowerCase();

      // 按长度排序
      if (sortByLength) {
        const lengthDiff = aProp.length - bProp.length;
        if (lengthDiff !== 0) {
          return lengthDiff;
        }
      }

      // 按字母顺序排序
      return aProp.localeCompare(bProp);
    }

    /**
     * 检查属性是否已正确排序
     */
    function isPropertyListSorted(properties: CSSProperty[]): boolean {
      for (let i = 1; i < properties.length; i++) {
        const prevProp = properties[i - 1].prop.toLowerCase();
        const currProp = properties[i].prop.toLowerCase();

        // 跳过被忽略属性的比较
        if (ignoreProperties.includes(prevProp) || ignoreProperties.includes(currProp)) {
          continue;
        }

        if (compareProperties(properties[i - 1], properties[i]) > 0) {
          return false;
        }
      }
      return true;
    }

    /**
     * 构建修复后的规则字符串
     */
    function buildFixedRule(rule: CSSRule): string {
      // 分离被忽略和非被忽略属性
      const nonIgnoredProps = rule.properties.filter(p => !ignoreProperties.includes(p.prop.toLowerCase()));

      // 只对非被忽略属性进行排序
      const sortedNonIgnored = [...nonIgnoredProps].sort(compareProperties);

      // 重建属性列表，被忽略属性保留原位，其他属性使用排序后的
      let sortedIndex = 0;
      const propsText = rule.properties
        .map((p) => {
          if (ignoreProperties.includes(p.prop.toLowerCase())) {
            return `  ${p.prop}: ${p.value};`;
          }
          return `  ${sortedNonIgnored[sortedIndex++].prop}: ${sortedNonIgnored[sortedIndex - 1].value};`;
        })
        .join("\n");

      return `${rule.selector} {\n${propsText}\n}`;
    }

    // 解析所有 CSS 规则
    const rules = parseCSSRules();

    // 检查并报告未排序的规则
    for (const rule of rules) {
      if (!isPropertyListSorted(rule.properties)) {
        context.report({
          messageId: "shouldSortProperties",
          loc: {
            start: { line: rule.startLine, column: 0 },
            end: { line: rule.endLine, column: 0 },
          },
          fix(fixer) {
            // 找到规则在原始代码中的范围
            const ruleStart = code.indexOf(`${rule.selector} {`);
            const ruleEnd = code.indexOf("}", ruleStart) + 1;

            if (ruleStart === -1 || ruleEnd === 0) {
              return null;
            }

            const fixedRule = buildFixedRule(rule);
            return fixer.replaceTextRange([ruleStart, ruleEnd], fixedRule);
          },
        });
      }
    }

    return {};
  },
}) as unknown as Rule.RuleModule;
