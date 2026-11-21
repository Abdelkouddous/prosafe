import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppPalette,
  HighContrastPalette,
  Palette,
} from "@/constants/Colors";

export type FontScaleKey = "normal" | "large" | "xlarge";
export const FONT_SCALES: Record<FontScaleKey, number> = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};

const FONT_KEY = "a11y.fontScale";
const CONTRAST_KEY = "a11y.highContrast";

interface AccessibilityContextType {
  fontScaleKey: FontScaleKey;
  fontScale: number;
  highContrast: boolean;
  setFontScale: (key: FontScaleKey) => void;
  setHighContrast: (value: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  fontScaleKey: "normal",
  fontScale: 1,
  highContrast: false,
  setFontScale: () => {},
  setHighContrast: () => {},
});

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fontScaleKey, setFontScaleKey] = useState<FontScaleKey>("normal");
  const [highContrast, setHighContrastState] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [f, c] = await Promise.all([
          AsyncStorage.getItem(FONT_KEY),
          AsyncStorage.getItem(CONTRAST_KEY),
        ]);
        if (f && f in FONT_SCALES) setFontScaleKey(f as FontScaleKey);
        if (c === "1") setHighContrastState(true);
      } catch {
        // preferences are optional: keep defaults
      }
    })();
  }, []);

  const setFontScale = useCallback((key: FontScaleKey) => {
    setFontScaleKey(key);
    AsyncStorage.setItem(FONT_KEY, key).catch(() => {});
  }, []);

  const setHighContrast = useCallback((value: boolean) => {
    setHighContrastState(value);
    AsyncStorage.setItem(CONTRAST_KEY, value ? "1" : "0").catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      fontScaleKey,
      fontScale: FONT_SCALES[fontScaleKey],
      highContrast,
      setFontScale,
      setHighContrast,
    }),
    [fontScaleKey, highContrast, setFontScale, setHighContrast]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);

/** Theme helper: palette (normal / high contrast) and font scaling `fs(size)`. */
export function useAppTheme() {
  const { fontScale, highContrast } = useAccessibility();
  const colors: AppPalette = highContrast ? HighContrastPalette : Palette;
  const fs = useCallback(
    (size: number) => Math.round(size * fontScale * 10) / 10,
    [fontScale]
  );
  return { colors, fs, fontScale, highContrast };
}
