import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：覆盖 React hooks 与 JSX 可访问性组合，确保 react-hooks 和 jsx-a11y 规则生效。

describe("集成夹具：react-jsx", () => {
  it("命中 React/JSX 集成规则", async () => {
    const fixture = loadIntegrationFixture("react-jsx");
    const composer = eslint(fixture.options.config ?? {});
    const flatConfigs = await composer.toConfigs();

    const results = await lintIntegrationFixture(flatConfigs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
