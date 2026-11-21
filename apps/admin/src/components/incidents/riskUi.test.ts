import { describe, expect, it } from "vitest";
import { riskClasses, riskLevel } from "./riskUi";

describe("riskLevel", () => {
  it.each([
    [1, "low"],
    [4, "low"],
    [5, "medium"],
    [9, "medium"],
    [10, "high"],
    [14, "high"],
    [15, "critical"],
    [25, "critical"],
  ])("score %i is %s", (score, level) => {
    expect(riskLevel(score)).toBe(level);
  });

  it("has a style for every level, red for critical and green for low", () => {
    expect(Object.keys(riskClasses).sort()).toEqual(["critical", "high", "low", "medium"]);
    expect(riskClasses.critical).toContain("red");
    expect(riskClasses.low).toContain("green");
  });
});
