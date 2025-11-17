/**
 * Prettier 类型定义模块
 * 从 Prettier 内部拷贝的类型声明，用于避免在运行时直接依赖 Prettier 包
 * 用于格式化配置和类型安全
 */

export type VendoredPrettierOptions = Partial<VendoredPrettierOptionsRequired>;

export type VendoredPrettierRuleOptions = VendoredPrettierOptions & {
  parser?: BuiltInParserName | ExternalParserName;
  [k: string]: unknown | undefined;
};

export interface VendoredPrettierOptionsRequired {
  /**
   * 指定打印时的最大行宽，超过后会尝试换行。
   * @default 150
   */
  printWidth: number;
  /**
   * 每个缩进层级所使用的空格数。
   */
  tabWidth: number;
  /**
   * 是否使用 Tab 进行缩进（默认是空格）。
   */
  useTabs?: boolean;
  /**
   * 是否在语句末尾添加分号。
   */
  semi: boolean;
  /**
   * 是否使用单引号替换双引号。
   */
  singleQuote: boolean;
  /**
   * JSX 中是否同样使用单引号。
   */
  jsxSingleQuote: boolean;
  /**
   * 尽可能在可允许的位置添加尾随逗号。
   */
  trailingComma: "none" | "es5" | "all";
  /**
   * 对象字面量中是否在大括号内侧保留空格。
   */
  bracketSpacing: boolean;
  /**
   * 多行 HTML/JSX/Vue/Angular 标签的闭合 `>` 是否跟随在最后一行末尾，而不是另起一行（不影响自闭合标签）。
   */
  bracketSameLine: boolean;
  /**
   * 多行 JSX 标签的闭合 `>` 是否跟在最后一行（已过时，请使用 bracketSameLine）。
   * @deprecated use bracketSameLine instead
   */
  jsxBracketSameLine: boolean;
  /**
   * 仅格式化文件中的某个片段（起始位置）。
   */
  rangeStart: number;
  /**
   * 仅格式化文件中的某个片段（结束位置）。
   * @default Number.POSITIVE_INFINITY
   */
  rangeEnd: number;
  /**
   * 默认保持 Markdown 文本的手动换行，以兼容敏感渲染器；可设置为依赖编辑器软换行。
   * @default "preserve"
   */
  proseWrap: "always" | "never" | "preserve";
  /**
   * 箭头函数只有一个参数时是否仍保留括号。
   * @default "always"
   */
  arrowParens: "avoid" | "always";
  /**
   * 通过插件扩展 Prettier 支持的新语言。
   */
  plugins: Array<string | any>;
  /**
   * HTML 中的空白折叠策略。
   * @default "css"
   */
  htmlWhitespaceSensitivity: "css" | "strict" | "ignore";
  /**
   * 输出时使用的换行符类型。
   * @default "lf"
   */
  endOfLine: "auto" | "lf" | "crlf" | "cr";
  /**
   * 对象属性名加引号的策略。
   * @default "as-needed"
   */
  quoteProps: "as-needed" | "consistent" | "preserve";
  /**
   * Vue 文件中是否缩进 `<script>` 和 `<style>` 内的代码。
   * @default false
   */
  vueIndentScriptAndStyle: boolean;
  /**
   * 是否强制 HTML/XML/Vue/JSX 每行只保留一个属性。
   * @default false
   */
  singleAttributePerLine: boolean;

  /**
   * XML 属性值使用的引号类型。
   * @default "preserve"
   */
  xmlQuoteAttributes: "single" | "double" | "preserve";
  /**
   * XML 自闭合标签的 `/>` 是否保留空格。
   * @default true
   */
  xmlSelfClosingSpace: boolean;
  /**
   * XML 属性是否按属性名排序。
   * @default false
   */
  xmlSortAttributesByKey: boolean;
  /**
   * XML 中的空白折叠策略。
   * @default "ignore"
   */
  xmlWhitespaceSensitivity: "ignore" | "strict" | "preserve";
}

export type BuiltInParserName
  = | "acorn"
    | "angular"
    | "babel-flow"
    | "babel-ts"
    | "babel"
    | "css"
    | "espree"
    | "flow"
    | "glimmer"
    | "graphql"
    | "html"
    | "json-stringify"
    | "json"
    | "json5"
    | "less"
    | "lwc"
    | "markdown"
    | "mdx"
    | "meriyah"
    | "scss"
    | "typescript"
    | "vue"
    | "xml"
    | "yaml";

export type ExternalParserName = "slidev" | "astro";

// 为了解决在字符串字面量联合中混入 string 泛型导致类型信息丢失的问题。
// LiteralUnion 能保留原始字面量联合的智能提示能力：见 microsoft/TypeScript#29729。
export type LiteralUnion<T extends U, U = string> = T | (Pick<U, never> & { _?: never | undefined });
