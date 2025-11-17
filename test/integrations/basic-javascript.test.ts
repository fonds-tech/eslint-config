import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：验证纯 JavaScript 默认规则（如 eqeqeq、no-var、no-console）在基础项目中的表现。
describe("集成夹具：basic-javascript", () => {
  it("触发核心 JavaScript 规则", async () => {
    const fixture = loadIntegrationFixture("basic-javascript");
    const composer = eslint(fixture.options.config ?? {});
    const flatConfigs = await composer.toConfigs();

    const results = await lintIntegrationFixture(flatConfigs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
