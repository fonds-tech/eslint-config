import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：验证启用 tsconfig 后 TypeScript 严格模式（type-aware + 库模式）下的规则行为。
describe("集成夹具：typescript-strict", () => {
  it("启用 TypeScript 严格规则", async () => {
    const fixture = loadIntegrationFixture("typescript-strict");
    const composer = eslint(fixture.options.config ?? {});
    const flatConfigs = await composer.toConfigs();

    const results = await lintIntegrationFixture(flatConfigs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
