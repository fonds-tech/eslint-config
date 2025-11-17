import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：联合验证 JSONC、YAML、TOML 三类结构化文件的解析与 stylistic 规则。
describe("集成夹具：jsonc-toml-yaml", () => {
  it("校验结构化数据文件规则", async () => {
    const fixture = loadIntegrationFixture("jsonc-toml-yaml");
    const composer = eslint(fixture.options.config ?? {});
    const flatConfigs = await composer.toConfigs();

    const results = await lintIntegrationFixture(flatConfigs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
