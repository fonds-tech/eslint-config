import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：覆盖 Svelte 模板的安全/响应式约束（@html 与 $: literal）。
describe("集成夹具：svelte-component", () => {
  it("捕获 Svelte 模板规则", async () => {
    const fixture = loadIntegrationFixture("svelte-component");
    const configs = await eslint(fixture.options.config ?? {}).toConfigs();
    const results = await lintIntegrationFixture(configs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
