import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useActiveEmergencies } from "@/hooks/useActiveEmergencies";
import { emergencyApi, notifyEmergencyChanged } from "@/services/emergencyApi";

/** Global red banner shown to managers while an emergency alert is active. */
const EmergencyBanner = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { events, refresh } = useActiveEmergencies();
  const [busy, setBusy] = useState<number | null>(null);

  if (events.length === 0) return null;

  const close = async (id: number) => {
    if (!window.confirm(t("emergency.confirmClose"))) return;
    setBusy(id);
    try {
      await emergencyApi.close(id);
      notifyEmergencyChanged();
      refresh();
    } catch {
      toast({ title: t("emergency.closeError"), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div role="alert" className="bg-red-600 text-white">
      <div className="container mx-auto space-y-1 px-4 py-2">
        {events.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center gap-3 text-sm">
            <Siren className="h-5 w-5 animate-pulse" />
            <span className="font-bold uppercase">{t("emergency.activeAlert")}</span>
            <span className="min-w-0 flex-1 truncate">
              {e.scenario?.title ? `${e.scenario.title} - ` : ""}
              {e.message}
              {e.zone ? ` (${e.zone})` : ""}
            </span>
            <Link to="/emergency" className="underline">
              {t("emergency.openPage")}
            </Link>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy === e.id}
              onClick={() => close(e.id)}
            >
              {t("emergency.close")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmergencyBanner;
