import type { OptionsConfig, TypedFlatConfigItem } from "../../src/types";
import { ESLint } from "eslint";
import { expect } from "vitest";
import * as process from "node:process";
import { join, resolve, relative } from "node:path";
import { statSync, existsSync, readdirSync, readFileSync } from "node:fs";

const repoRoot = process.cwd();
const integrationsRoot = resolve(repoRoot, "test", "fixtures", "integrations");

export interface IntegrationFixtureFile {
  absolutePath: string;
  relativePath: string;
}

export interface IntegrationFixtureOptionsFile {
  config?: Partial<OptionsConfig & Omit<TypedFlatConfigItem, "files">>;
}

export interface IntegrationLintMessageExpectation {
  ruleId?: string | null;
  message?: string;
  line?: number;
  column?: number;
  severity?: 0 | 1 | 2;
}

export interface IntegrationLintResultExpectation {
  filePath: string;
  errorCount?: number;
  warningCount?: number;
  messages?: IntegrationLintMessageExpectation[];
}

export interface IntegrationFixtureExpectations {
  files: IntegrationLintResultExpectation[];
}

export interface IntegrationFixture {
  name: string;
  rootDir: string;
  filesRoot: string;
  files: IntegrationFixtureFile[];
  options: IntegrationFixtureOptionsFile;
  expectations: IntegrationFixtureExpectations;
}

export interface NormalizedLintMessage {
  ruleId: string | null;
  message: string;
  line: number;
  column: number;
  severity: 0 | 1 | 2;
}

export interface NormalizedLintResult {
  filePath: string;
  errorCount: number;
  warningCount: number;
  messages: NormalizedLintMessage[];
  formattedOutput?: string;
}

/**
 * 从集成夹具目录中读取配置、期望结果与全部源文件列表。
 */
export function loadIntegrationFixture(name: string): IntegrationFixture {
  const rootDir = resolve(integrationsRoot, name);
  const filesRoot = resolve(rootDir, "files");

  if (!existsSync(rootDir)) {
    throw new Error(`未找到名为 ${name} 的集成夹具：${rootDir}`);
  }
  if (!existsSync(filesRoot)) {
    throw new Error(`集成夹具 ${name} 缺少 files 目录：${filesRoot}`);
  }

  const options = readJsonIfExists<IntegrationFixtureOptionsFile>(resolve(rootDir, "options.json"), { config: {} });
  const expectations = readJsonIfExists<IntegrationFixtureExpectations>(resolve(rootDir, "expect.json"));
  if (!expectations) {
    throw new Error(`集成夹具 ${name} 缺少 expect.json`);
  }

  const files = collectFixtureFiles(filesRoot);
  if (files.length === 0) {
    throw new Error(`集成夹具 ${name} 的 files 目录为空，无法执行 lint`);
  }

  return {
    name,
    rootDir,
    filesRoot,
    files,
    options,
    expectations,
  };
}

/**
 * 使用官方 ESLint 实例执行 lint，返回相对路径与关键信息，方便断言。
 */
export async function lintIntegrationFixture(configs: TypedFlatConfigItem[], fixture: IntegrationFixture): Promise<NormalizedLintResult[]> {
  const eslint = new ESLint({
    cwd: repoRoot,
    fix: false,
    overrideConfigFile: true,
    overrideConfig: configs,
  });

  const lintResults = await eslint.lintFiles(fixture.files.map(file => file.absolutePath));
  const isIgnoredResult = (result: ESLint.LintResult): boolean =>
    result.messages.length > 0
    && result.messages.every(message => message.ruleId == null && message.message?.includes("File ignored because of"));

  const filteredResults = lintResults.filter(result => !isIgnoredResult(result));

  let formattedLookup: Map<string, string> | undefined;
  if (filteredResults.some(result => result.messages.some(message => message.fix))) {
    const eslintFix = new ESLint({
      cwd: repoRoot,
      fix: true,
      overrideConfigFile: true,
      overrideConfig: configs,
    });
    const fixedResults = await eslintFix.lintFiles(fixture.files.map(file => file.absolutePath));
    formattedLookup = new Map(
      fixedResults
        .filter(result => result.output)
        .map(result => [relative(fixture.filesRoot, result.filePath), result.output!] as const),
    );
  }

  const normalized = filteredResults.map(result => ({
    filePath: relative(fixture.filesRoot, result.filePath),
    errorCount: result.errorCount,
    warningCount: result.warningCount,
    messages: result.messages.map(message => ({
      ruleId: message.ruleId,
      message: message.message,
      line: message.line,
      column: message.column,
      severity: message.severity as 0 | 1 | 2,
    })),
    formattedOutput: formattedLookup?.get(relative(fixture.filesRoot, result.filePath)),
  }));

  normalized.forEach((result) => {
    if (result.formattedOutput) {
      // eslint-disable-next-line no-console
      console.info(`\n🛠️ 格式化输出 -> ${result.filePath}:\n${result.formattedOutput}\n`);
    }
  });

  return normalized;
}

/**
 * 将 lint 结果与 expect.json 中的期望逐项对比，遇到差异时能给出精确报错。
 */
export function assertIntegrationResults(results: NormalizedLintResult[], fixture: IntegrationFixture): void {
  const expectedFiles = fixture.expectations.files;
  expect(results.length, `集成夹具 ${fixture.name} 的文件数量不匹配`).toBe(expectedFiles.length);

  const resultMap = new Map(results.map(result => [normalizePath(result.filePath), result]));

  for (const expected of expectedFiles) {
    const result = resultMap.get(normalizePath(expected.filePath));
    expect(result, `未找到期望的文件结果：${expected.filePath}`).toBeDefined();
    if (!result) {
      continue;
    }

    if (expected.errorCount != null) {
      expect(result.errorCount).toBe(expected.errorCount);
    }
    if (expected.warningCount != null) {
      expect(result.warningCount).toBe(expected.warningCount);
    }

    if (expected.messages) {
      expect(result.messages.length, `${expected.filePath} 的报错数量不符合预期`).toBe(expected.messages.length);
      expected.messages.forEach((message, index) => {
        const actualMessage = result.messages[index];
        expect(actualMessage, `${expected.filePath} 第 ${index + 1} 条消息不存在`).toBeDefined();
        if (!actualMessage) {
          return;
        }
        if (message.ruleId !== undefined) {
          expect(actualMessage.ruleId).toBe(message.ruleId);
        }
        if (message.message !== undefined) {
          expect(actualMessage.message).toContain(message.message);
        }
        if (message.line !== undefined) {
          expect(actualMessage.line).toBe(message.line);
        }
        if (message.column !== undefined) {
          expect(actualMessage.column).toBe(message.column);
        }
        if (message.severity !== undefined) {
          expect(actualMessage.severity).toBe(message.severity);
        }
      });
    }
  }
}

function readJsonIfExists<T>(filePath: string, fallback?: T): T {
  if (!existsSync(filePath)) {
    if (fallback === undefined) {
      throw new Error(`文件不存在：${filePath}`);
    }
    return fallback;
  }
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function collectFixtureFiles(rootDir: string, relativeDir = ""): IntegrationFixtureFile[] {
  const currentDir = relativeDir ? join(rootDir, relativeDir) : rootDir;
  const entries = readdirSync(currentDir, { withFileTypes: true });

  const files: IntegrationFixtureFile[] = [];
  for (const entry of entries) {
    const absolutePath = join(currentDir, entry.name);
    const relativePath = relative(rootDir, absolutePath);

    if (entry.isDirectory()) {
      files.push(...collectFixtureFiles(rootDir, relativePath));
    } else if (entry.isFile() && statSync(absolutePath).isFile()) {
      files.push({ absolutePath, relativePath });
    }
  }
  return files;
}

function normalizePath(target: string): string {
  return target.replace(/\\/g, "/");
}
