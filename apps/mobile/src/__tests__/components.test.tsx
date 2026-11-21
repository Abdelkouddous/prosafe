import React from "react";
import { Text } from "react-native";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { AccessibilityProvider, useAppTheme, useAccessibility } from "@/contexts/AccessibilityContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { Palette, HighContrastPalette } from "@/constants/Colors";
import { Chip } from "@/components/Chip";
import { ComingSoon } from "@/components/ComingSoon";
import AsyncStorage from "@react-native-async-storage/async-storage";

beforeEach(async () => { await AsyncStorage.clear(); });

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({ router: { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn() } }));

function Probe() {
  const { fs, colors } = useAppTheme();
  const { setFontScale, setHighContrast } = useAccessibility();
  return (
    <>
      <Text testID="fs">{String(fs(10))}</Text>
      <Text testID="danger">{colors.danger}</Text>
      <Text testID="lg" onPress={() => setFontScale("large")} />
      <Text testID="xl" onPress={() => setFontScale("xlarge")} />
      <Text testID="hc" onPress={() => setHighContrast(true)} />
    </>
  );
}

describe("AccessibilityContext", () => {
  it("defaults: scale 1, normal palette", () => {
    render(<AccessibilityProvider><Probe /></AccessibilityProvider>);
    expect(screen.getByTestId("fs").props.children).toBe("10");
    expect(screen.getByTestId("danger").props.children).toBe(Palette.danger);
  });
  it("fs scales by font scale", () => {
    render(<AccessibilityProvider><Probe /></AccessibilityProvider>);
    fireEvent.press(screen.getByTestId("lg"));
    expect(screen.getByTestId("fs").props.children).toBe("11.5");
    fireEvent.press(screen.getByTestId("xl"));
    expect(screen.getByTestId("fs").props.children).toBe("13");
  });
  it("switches to high contrast palette", () => {
    render(<AccessibilityProvider><Probe /></AccessibilityProvider>);
    fireEvent.press(screen.getByTestId("hc"));
    expect(screen.getByTestId("danger").props.children).toBe(HighContrastPalette.danger);
  });
});

function Lang() {
  const { t, isRTL, setLanguage, currentLanguage } = useLanguage();
  return (
    <>
      <Text testID="lang">{currentLanguage}</Text>
      <Text testID="rtl">{String(isRTL)}</Text>
      <Text testID="back">{t("back")}</Text>
      <Text testID="ar" onPress={() => setLanguage("ar-DZ")} />
    </>
  );
}

describe("LanguageContext", () => {
  it("defaults to fr, switches to ar-DZ with RTL", async () => {
    render(<LanguageProvider><Lang /></LanguageProvider>);
    expect(screen.getByTestId("lang").props.children).toBe("fr");
    expect(screen.getByTestId("rtl").props.children).toBe("false");
    const fr = screen.getByTestId("back").props.children;
    await act(async () => { fireEvent.press(screen.getByTestId("ar")); });
    expect(screen.getByTestId("rtl").props.children).toBe("true");
    expect(screen.getByTestId("back").props.children).not.toBe(fr);
  });
  it("throws outside provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Lang />)).toThrow(/LanguageProvider/);
    spy.mockRestore();
  });
});

describe("Chip", () => {
  it("renders label, fires onPress, exposes selected state", () => {
    const onPress = jest.fn();
    render(<Chip label="Fire" selected onPress={onPress} />);
    fireEvent.press(screen.getByText("Fire"));
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByRole("button").props.accessibilityState).toEqual({ selected: true });
  });
});

describe("ComingSoon", () => {
  it("renders translated title, badge and message (fr)", async () => {
    render(
      <LanguageProvider><AccessibilityProvider>
        <ComingSoon titleKey="back" messageKey="back" />
      </AccessibilityProvider></LanguageProvider>
    );
    expect((await screen.findAllByText(/\S/)).length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText("comingSoon")).toBeNull(); // key must be translated, not echoed
  });
});
