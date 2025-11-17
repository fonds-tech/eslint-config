import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：确认 Markdown 代码块也会复用核心 JS 规则（示例中触发 eqeqeq）。
describe("集成夹具：markdown-snippets", () => {
  it("markdown 代码块沿用核心规则", async () => {
    const fixture = loadIntegrationFixture("markdown-snippets");
    const composer = eslint(fixture.options.config ?? {});
    const flatConfigs = await composer.toConfigs();

    const results = await lintIntegrationFixture(flatConfigs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
