import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { usePublicLocale } from "@/lib/publicSiteCopy";
import { cn } from "@/lib/utils";

const LABELS = {
  fr: {
    toDark: "Activer le mode sombre",
    toLight: "Activer le mode clair",
  },
  en: {
    toDark: "Switch to dark mode",
    toLight: "Switch to light mode",
  },
  ar: {
    toDark: "تفعيل الوضع الداكن",
    toLight: "تفعيل الوضع الفاتح",
  },
} as const;

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { isDark, toggleTheme } = useTheme();
  const locale = usePublicLocale();
  const label = isDark ? LABELS[locale].toLight : LABELS[locale].toDark;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      data-testid="theme-toggle-btn"
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors shrink-0",
        className
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
};

export default ThemeToggle;
