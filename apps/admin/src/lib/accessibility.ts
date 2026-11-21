export type TextSize = "normal" | "large" | "xlarge";

export const TEXT_SIZE_KEY = "prosafe_text_size";
export const HIGH_CONTRAST_KEY = "prosafe_high_contrast";

export const TEXT_SIZE_PERCENT: Record<TextSize, string> = {
  normal: "100%",
  large: "112.5%",
  xlarge: "125%",
};

const isTextSize = (v: unknown): v is TextSize =>
  v === "normal" || v === "large" || v === "xlarge";

export const getTextSize = (): TextSize => {
  try {
    const v = localStorage.getItem(TEXT_SIZE_KEY);
    return isTextSize(v) ? v : "normal";
  } catch {
    return "normal";
  }
};

export const getHighContrast = (): boolean => {
  try {
    return localStorage.getItem(HIGH_CONTRAST_KEY) === "true";
  } catch {
    return false;
  }
};

export const applyTextSize = (size: TextSize) => {
  document.documentElement.style.fontSize = TEXT_SIZE_PERCENT[size];
};

export const applyHighContrast = (on: boolean) => {
  document.documentElement.classList.toggle("high-contrast", on);
};

export const setTextSize = (size: TextSize) => {
  try {
    localStorage.setItem(TEXT_SIZE_KEY, size);
  } catch {
    /* storage unavailable */
  }
  applyTextSize(size);
};

export const setHighContrast = (on: boolean) => {
  try {
    localStorage.setItem(HIGH_CONTRAST_KEY, String(on));
  } catch {
    /* storage unavailable */
  }
  applyHighContrast(on);
};

/** Apply persisted preferences; call before the first render. */
export const initAccessibility = () => {
  applyTextSize(getTextSize());
  applyHighContrast(getHighContrast());
};
