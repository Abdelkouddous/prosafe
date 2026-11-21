import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useAppTheme } from "@/contexts/AccessibilityContext";

// Ad-hoc greys / tints used by legacy screens -> high-contrast equivalents.
const TEXT_COLORS = new Set([
  "#6B7280", "#666", "#666666", "#9CA3AF", "#374151", "#333", "#333333",
  "#4B5563", "#1F2937", "#111827", "#999", "#888",
]);
const BG_COLORS = new Set([
  "#F5F5F5", "#F9FAFB", "#F3F4F6", "#FFFFFE", "#FAFAFA", "#f5f5f5",
]);
const BORDER_COLORS = new Set(["#E5E7EB", "#D1D5DB", "#DDD", "#ddd", "#E0E0E0"]);
const RED = new Set(["#DC2626", "#EF4444", "#EA580C", "#F97316", "#F59E0B"]);
const GREEN = new Set(["#16A34A", "#10B981", "#22C55E"]);

function mapColor(key: string, value: string): string {
  const v = value.toUpperCase();
  const isText = key === "color" || key === "tintColor";
  const isBorder = key.startsWith("border") && key.endsWith("Color");
  if (isText && [...TEXT_COLORS].some((c) => c.toUpperCase() === v)) return "#000000";
  if (key === "backgroundColor" && [...BG_COLORS].some((c) => c.toUpperCase() === v)) return "#FFFFFF";
  if (isBorder && [...BORDER_COLORS].some((c) => c.toUpperCase() === v)) return "#000000";
  if ([...RED].some((c) => c.toUpperCase() === v)) return key === "color" ? "#B91C1C" : "#B91C1C";
  if ([...GREEN].some((c) => c.toUpperCase() === v)) return "#15803D";
  return value;
}

/**
 * Applies accessibility settings (M7.3) to a static style sheet:
 * scales fontSize / lineHeight and, in high-contrast mode, remaps common
 * grey/status colors to black/white/strong red & green.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  base: T
): T {
  const { fontScale, highContrast } = useAppTheme();
  return useMemo(() => {
    if (fontScale === 1 && !highContrast) return base;
    const out: Record<string, any> = {};
    for (const [name, style] of Object.entries(base as Record<string, any>)) {
      const next: Record<string, any> = { ...style };
      for (const key of Object.keys(next)) {
        const val = next[key];
        if ((key === "fontSize" || key === "lineHeight") && typeof val === "number") {
          next[key] = Math.round(val * fontScale * 10) / 10;
        } else if (highContrast && typeof val === "string" && /color/i.test(key)) {
          next[key] = mapColor(key, val);
        }
      }
      if (highContrast && next.borderWidth === undefined && next.shadowColor) {
        next.borderWidth = 1;
        next.borderColor = "#000000";
      }
      out[name] = next;
    }
    return out as T;
  }, [base, fontScale, highContrast]);
}
