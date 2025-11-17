import process from "node:process";
import { Linter } from "eslint";
import { join, resolve } from "node:path";
import { readdirSync, readFileSync } from "node:fs";

const repoRoot = process.cwd();
const rulesFixtureRoot = resolve(repoRoot, "test", "fixtures", "rules");

interface FixtureFile {
  name: string;
  content: string;
}

interface ParserRegistration {
  id: string;
  implementation: unknown;
}

/**
 * 读取指定规则的夹具文件内容
 */
export function readRuleFixture(ruleName: string, ...segments: string[]): string {
  const fixturePath = resolve(rulesFixtureRoot, ruleName, ...segments);
  return readFileSync(fixturePath, "utf-8");
}

/**
 * 获取规则某分类下的全部夹具文件，返回名称 + 内容，用于参数化测试
 */
export function loadRuleFixtureGroup(ruleName: string, group: string): FixtureFile[] {
  const directory = resolve(rulesFixtureRoot, ruleName, group);
  const files = readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .sort();

  return files.map(name => ({
    name,
    content: readFileFixture(ruleName, group, name),
  }));
}

function readFileFixture(ruleName: string, group: string, fileName: string): string {
  return readFileSync(join(rulesFixtureRoot, ruleName, group, fileName), "utf-8");
}

/**
 * 构建并返回一个 Linter 实例，自动注册规则与可选解析器
 */
export function createRuleLinter(
  ruleId: string,
  ruleModule: any,
  parser?: ParserRegistration,
): Linter {
  const linter = new Linter({ configType: "eslintrc" });
  linter.defineRule(ruleId, ruleModule);

  if (parser) {
    linter.defineParser(parser.id, parser.implementation as any);
  }

  return linter;
}
