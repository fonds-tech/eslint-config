import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：使用 UnoCSS 严格模式 + blocklist，确保被禁用的 utility 能被识别。
describe("集成夹具：unocss-order", () => {
  it("检查 UnoCSS blocklist 规则", async () => {
    const fixture = loadIntegrationFixture("unocss-order");
    const configs = await eslint(fixture.options.config ?? {}).toConfigs();
    const results = await lintIntegrationFixture(configs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
