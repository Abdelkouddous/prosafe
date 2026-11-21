import { TFunction } from "i18next";
import { ManagerNavLink } from "./ManagerPage";

export const equipmentNav = (t: TFunction): ManagerNavLink[] => [
  { to: "/equipment", label: t("equipment.nav.inventory"), end: true },
  { to: "/equipment/maintenance", label: t("equipment.nav.maintenance") },
  { to: "/equipment/history", label: t("equipment.nav.history") },
];

export const trainingNav = (t: TFunction): ManagerNavLink[] => [
  { to: "/trainings", label: t("trainings.nav.catalogue"), end: true },
  { to: "/trainings/sessions", label: t("trainings.nav.sessions") },
  { to: "/trainings/compliance", label: t("trainings.nav.compliance") },
];
