import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：模拟 Next.js 页面，确保 next/no-img-element 等 Next 专属规则被触发。
describe("集成夹具：nextjs-app", () => {
  it("触发 Next.js 插件规则", async () => {
    const fixture = loadIntegrationFixture("nextjs-app");
    const configs = await eslint(fixture.options.config ?? {}).toConfigs();
    const results = await lintIntegrationFixture(configs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
