import { eslint } from "../../src";
import { it, expect, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

describe("集成夹具：ignores-dist", () => {
  it("默认忽略 dist 等构建目录", async () => {
    const fixture = loadIntegrationFixture("ignores-dist");
    const composer = eslint(fixture.options.config ?? {});
    const flatConfigs = await composer.toConfigs();

    const results = await lintIntegrationFixture(flatConfigs, fixture);
    expect(results.some(result => result.filePath.startsWith("dist/"))).toBe(false);
    assertIntegrationResults(results, fixture);
  });
});
