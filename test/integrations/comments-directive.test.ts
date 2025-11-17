import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

describe("集成夹具：comments-directive", () => {
  it("禁止无限制 eslint-disable 指令", async () => {
    const fixture = loadIntegrationFixture("comments-directive");
    const configs = await eslint(fixture.options.config ?? {}).toConfigs();
    const results = await lintIntegrationFixture(configs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
