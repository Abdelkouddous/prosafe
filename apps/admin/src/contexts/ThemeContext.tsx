import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyDocumentTheme,
  getStoredThemeMode,
  getSystemPrefersDark,
  HIGH_CONTRAST_CHANGE_EVENT,
  nextThemeToggle,
  resolveTheme,
  setStoredThemeMode,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme";
import { getHighContrast, setHighContrast } from "@/lib/accessibility";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredThemeMode());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    getSystemPrefersDark()
  );
  const [highContrast, setHighContrastState] = useState<boolean>(() =>
    getHighContrast()
  );

  const resolvedTheme = useMemo<ResolvedTheme>(
    () => resolveTheme(theme, systemPrefersDark),
    [theme, systemPrefersDark]
  );

  // Sync <html> classes and color-scheme whenever theme, OS preference, or high-contrast changes
  useEffect(() => {
    applyDocumentTheme({ resolvedTheme, highContrast });
  }, [resolvedTheme, highContrast]);

  // Listen to OS prefers-color-scheme changes
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };
    media.addEventListener("change", onMediaChange);
    return () => media.removeEventListener("change", onMediaChange);
  }, []);

  // Listen for High-Contrast toggle changes triggered from Settings
  useEffect(() => {
    const onHighContrastChange = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
      setHighContrastState(
        typeof detail?.enabled === "boolean" ? detail.enabled : getHighContrast()
      );
    };
    window.addEventListener(HIGH_CONTRAST_CHANGE_EVENT, onHighContrastChange);
    return () =>
      window.removeEventListener(HIGH_CONTRAST_CHANGE_EVENT, onHighContrastChange);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    // Switching explicitly to Dark Mode turns off High-Contrast so they never clash
    const nextResolved = resolveTheme(mode, getSystemPrefersDark());
    if (nextResolved === "dark" && getHighContrast()) {
      setHighContrast(false);
      setHighContrastState(false);
    }
    setStoredThemeMode(mode);
    setThemeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const currentlyDark = !highContrast && resolvedTheme === "dark";
    const nextMode = nextThemeToggle(currentlyDark ? "dark" : "light");
    setTheme(nextMode);
  }, [highContrast, resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: highContrast ? "light" : resolvedTheme,
      isDark: !highContrast && resolvedTheme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, highContrast, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "light",
      resolvedTheme: "light",
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
