import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import PageShell from "@/components/PageShell";
import AlertManagement from "@/components/AlertManagement";
import { Badge } from "@/components/ui/badge";
import { statsApi } from "@/services/statsApi";

const Alerts = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    statsApi
      .overview()
      .then((r) => setActive(r.data.activeAlerts))
      .catch(() => setActive(null));
  }, []);

  return (
    <PageShell
      title={t("alerts.title")}
      subtitle={t("alerts.subtitle")}
      actions={
        active != null && (
          <Badge className={active > 0 ? "bg-red-600 text-white" : "bg-green-600 text-white"}>
            <Bell className="me-1 h-3 w-3" />
            {t("alerts.active", { count: active })}
          </Badge>
        )
      }
    >
      <AlertManagement />
    </PageShell>
  );
};

export default Alerts;
