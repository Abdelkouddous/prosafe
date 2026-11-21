import { TRANSLATIONS } from "@/constants/Languages";
import { INCIDENT_TRANSLATIONS } from "@/constants/IncidentTranslations";
import { EQUIPMENT_TRANSLATIONS } from "@/constants/EquipmentTranslations";
import { NAV_TRANSLATIONS } from "@/constants/NavTranslations";
import { PHASE3_TRANSLATIONS } from "@/constants/Phase3Translations";
import { PHASE4_TRANSLATIONS } from "@/constants/Phase4Translations";

const keys = (o: object) => Object.keys(o).sort();
const diff = (a: string[], b: string[]) => a.filter((k) => !b.includes(k));

describe("translation key parity (merged)", () => {
  for (const other of ["en", "ar-DZ"] as const) {
    it(`fr and ${other} have the same keys`, () => {
      const fr = keys(TRANSLATIONS.fr);
      const o = keys(TRANSLATIONS[other]);
      const missingInOther = diff(fr, o);
      const missingInFr = diff(o, fr);
      expect({ [`missing in ${other}`]: missingInOther, "missing in fr": missingInFr })
        .toEqual({ [`missing in ${other}`]: [], "missing in fr": [] });
    });
  }
  it("no empty values", () => {
    const empty: string[] = [];
    for (const lang of ["fr", "en", "ar-DZ"] as const)
      for (const [k, v] of Object.entries(TRANSLATIONS[lang]))
        if (typeof v !== "string" || v.trim() === "") empty.push(`${lang}.${k}`);
    expect(empty).toEqual([]);
  });
});

describe("translation key parity (per file)", () => {
  const files = { INCIDENT_TRANSLATIONS, EQUIPMENT_TRANSLATIONS, NAV_TRANSLATIONS, PHASE3_TRANSLATIONS, PHASE4_TRANSLATIONS };
  for (const [name, f] of Object.entries(files)) {
    it(`${name}: fr/en/ar-DZ identical keys`, () => {
      const fr = keys(f.fr);
      expect({ en: [diff(fr, keys(f.en)), diff(keys(f.en), fr)], ar: [diff(fr, keys(f["ar-DZ"])), diff(keys(f["ar-DZ"]), fr)] })
        .toEqual({ en: [[], []], ar: [[], []] });
    });
  }
});
