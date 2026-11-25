import test from "node:test";
import assert from "node:assert/strict";
import {
  isThemeMode,
  nextThemeToggle,
  resolveEffectiveClasses,
  resolveTheme,
} from "./theme";

test("isThemeMode validates allowed theme modes strictly", () => {
  assert.equal(isThemeMode("light"), true);
  assert.equal(isThemeMode("dark"), true);
  assert.equal(isThemeMode("system"), true);
  assert.equal(isThemeMode("midnight"), false);
  assert.equal(isThemeMode(null), false);
});

test("resolveTheme maps explicit and system modes accurately", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
});

test("nextThemeToggle flips resolved light and dark modes", () => {
  assert.equal(nextThemeToggle("light"), "dark");
  assert.equal(nextThemeToggle("dark"), "light");
});

test("resolveEffectiveClasses keeps high-contrast and dark mode mutually exclusive", () => {
  assert.deepEqual(
    resolveEffectiveClasses({ resolvedTheme: "dark", highContrast: false }),
    { darkClass: true, highContrastClass: false, colorScheme: "dark" }
  );

  assert.deepEqual(
    resolveEffectiveClasses({ resolvedTheme: "dark", highContrast: true }),
    { darkClass: false, highContrastClass: true, colorScheme: "light" }
  );

  assert.deepEqual(
    resolveEffectiveClasses({ resolvedTheme: "light", highContrast: false }),
    { darkClass: false, highContrastClass: false, colorScheme: "light" }
  );
});
