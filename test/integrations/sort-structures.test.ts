import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

describe("集成夹具：sort-structures", () => {
  it("对 package.json 与 tsconfig 应用排序规则", async () => {
    const fixture = loadIntegrationFixture("sort-structures");
    const composer = eslint(fixture.options.config ?? {});
    const flatConfigs = await composer.toConfigs();

    const results = await lintIntegrationFixture(flatConfigs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
