import { eslint } from "../../src";
import { it, describe } from "vitest";
import { lintIntegrationFixture, loadIntegrationFixture, assertIntegrationResults } from "../helpers/integration-testing";

// 场景说明：验证 test 集成能阻止 it.only/describe.only 等失误。

describe("集成夹具：Vitest only 守卫", () => {
  it("在默认配置中禁止 it.only", async () => {
    // 读取 vitest-only 夹具，统一使用 JSON 中的运行选项与期望
    const fixture = loadIntegrationFixture("vitest-only");
    const composer = eslint(fixture.options.config ?? {});
    const flatConfigs = await composer.toConfigs();

    // 执行 lint 并与 expect.json 断言，确保规则生效
    const results = await lintIntegrationFixture(flatConfigs, fixture);
    assertIntegrationResults(results, fixture);
  });
});
