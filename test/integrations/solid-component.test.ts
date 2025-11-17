import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：Solid.js 组件的特定规则（禁止 props 解构）。
describe("集成夹具：solid-component", () => {
  it("检测 Solid.js 专属规则", async () => {
    const fixture = loadIntegrationFixture("solid-component");
    const configs = await eslint(fixture.options.config ?? {}).toConfigs();
    const results = await lintIntegrationFixture(configs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
