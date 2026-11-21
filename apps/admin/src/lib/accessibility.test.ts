import { beforeEach, describe, expect, it } from "vitest";
import {
  getHighContrast,
  getTextSize,
  initAccessibility,
  setHighContrast,
  setTextSize,
} from "./accessibility";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.fontSize = "";
  document.documentElement.classList.remove("high-contrast");
});

describe("accessibility preferences", () => {
  it("defaults to normal size and no contrast", () => {
    expect(getTextSize()).toBe("normal");
    expect(getHighContrast()).toBe(false);
  });

  it("applies and persists text size", () => {
    setTextSize("xlarge");
    expect(document.documentElement.style.fontSize).toBe("125%");
    expect(getTextSize()).toBe("xlarge");
    setTextSize("large");
    expect(document.documentElement.style.fontSize).toBe("112.5%");
  });

  it("ignores invalid stored size", () => {
    localStorage.setItem("prosafe_text_size", "huge");
    expect(getTextSize()).toBe("normal");
  });

  it("toggles the high-contrast class and persists it", () => {
    setHighContrast(true);
    expect(document.documentElement.classList.contains("high-contrast")).toBe(true);
    setHighContrast(false);
    expect(document.documentElement.classList.contains("high-contrast")).toBe(false);
  });

  it("restores stored preferences at startup", () => {
    localStorage.setItem("prosafe_text_size", "large");
    localStorage.setItem("prosafe_high_contrast", "true");
    initAccessibility();
    expect(document.documentElement.style.fontSize).toBe("112.5%");
    expect(document.documentElement.classList.contains("high-contrast")).toBe(true);
  });
});
