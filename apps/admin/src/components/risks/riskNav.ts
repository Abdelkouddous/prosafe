import type { TFunction } from "i18next";
import type { SectionTab } from "@/components/SectionTabs";

export const riskTabs = (t: TFunction): SectionTab[] => [
  { to: "/risks", label: t("risks.nav.catalogue"), end: true },
  { to: "/risks/matrix", label: t("risks.nav.matrix") },
  { to: "/risks/action-plans", label: t("risks.nav.plans") },
  { to: "/risks/lmra", label: t("risks.nav.lmra") },
];
