import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：联动 imports/unicorn 插件，验证重复导入与 prefer-includes 等规则。
describe("集成夹具：imports-unicorn", () => {
  it("验证 imports/unicorn 插件规则", async () => {
    const fixture = loadIntegrationFixture("imports-unicorn");
    const configs = await eslint(fixture.options.config ?? {}).toConfigs();
    const results = await lintIntegrationFixture(configs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
