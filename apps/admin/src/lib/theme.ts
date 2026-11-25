export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "prosafe_theme";
export const HIGH_CONTRAST_CHANGE_EVENT = "prosafe:high-contrast-change";

export const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

/**
 * Resolve a persisted theme mode ("light" | "dark" | "system") into the
 * concrete display theme given the OS prefers-color-scheme flag.
 */
export function resolveTheme(
  mode: ThemeMode,
  prefersDark: boolean
): ResolvedTheme {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  return prefersDark ? "dark" : "light";
}

/**
 * Determine the next explicit theme mode when clicking a quick Sun/Moon toggle.
 */
export function nextThemeToggle(resolved: ResolvedTheme): Exclude<ThemeMode, "system"> {
  return resolved === "dark" ? "light" : "dark";
}

/**
 * Compute mutually exclusive root CSS classes so WCAG High-Contrast mode
 * (black on white) and Night-Shift Dark Mode never collide on <html>.
 */
export function resolveEffectiveClasses(params: {
  resolvedTheme: ResolvedTheme;
  highContrast: boolean;
}): { darkClass: boolean; highContrastClass: boolean; colorScheme: ResolvedTheme } {
  if (params.highContrast) {
    return {
      darkClass: false,
      highContrastClass: true,
      colorScheme: "light",
    };
  }
  const isDark = params.resolvedTheme === "dark";
  return {
    darkClass: isDark,
    highContrastClass: false,
    colorScheme: isDark ? "dark" : "light",
  };
}

export function getStoredThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(raw) ? raw : "light";
  } catch {
    return "light";
  }
}

export function setStoredThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* storage unavailable */
  }
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyDocumentTheme(params: {
  resolvedTheme: ResolvedTheme;
  highContrast: boolean;
}): void {
  if (typeof document === "undefined") return;
  const { darkClass, highContrastClass, colorScheme } =
    resolveEffectiveClasses(params);
  const root = document.documentElement;
  root.classList.toggle("dark", darkClass);
  root.classList.toggle("high-contrast", highContrastClass);
  root.style.colorScheme = colorScheme;
}
