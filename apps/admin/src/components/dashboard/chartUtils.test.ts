import { describe, expect, it } from "vitest";
import { fmtHours, fmtRate, SEVERITY_COLORS } from "./chartUtils";

describe("fmtRate", () => {
  it("shows a dash for missing values", () => {
    expect(fmtRate(null)).toBe("-");
    expect(fmtRate(undefined)).toBe("-");
  });
  it("rounds to one decimal and appends %", () => {
    expect(fmtRate(12.345)).toBe("12.3%");
    expect(fmtRate(0)).toBe("0%");
  });
});

describe("fmtHours", () => {
  it("shows a dash for missing values", () => {
    expect(fmtHours(null)).toBe("-");
  });
  it("uses hours below 48 h", () => {
    expect(fmtHours(5.55)).toBe("5.6 h");
  });
  it("switches to days from 48 h", () => {
    expect(fmtHours(72)).toBe("3 d");
  });
});

describe("SEVERITY_COLORS", () => {
  it("uses red for critical and green for low", () => {
    expect(SEVERITY_COLORS.critical).toBe("#DC2626");
    expect(SEVERITY_COLORS.low).toBe("#16A34A");
  });
});
