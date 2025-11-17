import { it, expect, describe } from "vitest";

describe("vitest only guard", () => {
  it.only("should not be committed", () => {
    expect(1 + 1).toBe(2);
  });
});
