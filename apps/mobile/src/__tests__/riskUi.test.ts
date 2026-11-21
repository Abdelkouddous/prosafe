jest.mock("@/services/api", () => ({ __esModule: true, default: {} }));
import { levelFromScore, RISK_LEVELS } from "@/services/risksApi";
import { RISK_LEVEL_COLORS, RISK_HC_LEVEL_COLORS } from "@/constants/riskUi";

describe("levelFromScore", () => {
  it.each([
    [1, "low"], [4, "low"], [5, "medium"], [9, "medium"],
    [10, "high"], [14, "high"], [15, "critical"], [25, "critical"],
  ])("score %i -> %s", (s, l) => expect(levelFromScore(s)).toBe(l));
});

describe("risk colors", () => {
  it("define a color for every level in both modes", () => {
    for (const l of RISK_LEVELS) {
      expect(RISK_LEVEL_COLORS[l]).toMatch(/^#[0-9A-F]{6}$/i);
      expect(RISK_HC_LEVEL_COLORS[l]).toMatch(/^#[0-9A-F]{6}$/i);
      expect(RISK_HC_LEVEL_COLORS[l]).not.toBe(RISK_LEVEL_COLORS[l]);
    }
  });
});
