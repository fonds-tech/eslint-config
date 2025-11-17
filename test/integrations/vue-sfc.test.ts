import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：确保 Vue a11y + SFC 专属规则（v-for key、block 顺序等）会被触发。
describe("集成夹具：vue-sfc", () => {
  it("覆盖 Vue SFC 与 a11y 检查", async () => {
    const fixture = loadIntegrationFixture("vue-sfc");
    const composer = eslint(fixture.options.config ?? {});
    const flatConfigs = await composer.toConfigs();

    const results = await lintIntegrationFixture(flatConfigs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
