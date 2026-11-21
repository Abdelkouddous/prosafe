import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MapPin, Pencil, Phone, Plus, Siren, Trash2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { apiErrorMessage, fmtDateTime } from "@/components/manager/ManagerPage";
import DrillsTab from "@/components/emergency/DrillsTab";
import ScenarioDialog from "@/components/emergency/ScenarioDialog";
import TriggerDialog from "@/components/emergency/TriggerDialog";
import {
  emergencyApi,
  notifyEmergencyChanged,
  type EmergencyEvent,
  type Scenario,
} from "@/services/emergencyApi";

const Emergency = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [active, setActive] = useState<EmergencyEvent[]>([]);
  const [history, setHistory] = useState<EmergencyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [trigger, setTrigger] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; scenario?: Scenario | null }>({ open: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a, h] = await Promise.all([
        emergencyApi.scenarios(),
        emergencyApi.events({ active: true, limit: 10 }),
        emergencyApi.events({ active: false, limit: 10 }),
      ]);
      setScenarios(s.data.data);
      setActive(a.data.data);
      setHistory(h.data.data);
    } catch {
      toast({ title: t("emergency.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const close = async (e: EmergencyEvent) => {
    if (!window.confirm(t("emergency.confirmClose"))) return;
    try {
      await emergencyApi.close(e.id);
      notifyEmergencyChanged();
      load();
    } catch (err) {
      toast({ title: t("emergency.closeError"), description: apiErrorMessage(err, ""), variant: "destructive" });
    }
  };

  const removeScenario = async (s: Scenario) => {
    if (!window.confirm(t("emergency.scenarios.confirmDelete"))) return;
    try {
      await emergencyApi.removeScenario(s.id);
      load();
    } catch (err) {
      toast({ title: t("common.error"), description: apiErrorMessage(err, t("emergency.saveError")), variant: "destructive" });
    }
  };

  return (
    <PageShell
      title={t("emergency.title")}
      subtitle={t("emergency.subtitle")}
      actions={
        <Button
          size="lg"
          onClick={() => setTrigger(true)}
          className="bg-red-600 text-base font-bold uppercase hover:bg-red-700"
        >
          <Siren className="me-2 h-5 w-5" />
          {t("emergency.trigger.button")}
        </Button>
      }
    >
      {active.map((e) => (
        <div
          key={e.id}
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-red-500 bg-red-50 p-4"
        >
          <div>
            <div className="flex items-center gap-2 font-bold text-red-700">
              <Siren className="h-5 w-5 animate-pulse" />
              {t("emergency.activeAlert")}
              {e.scenario?.title && <span>- {e.scenario.title}</span>}
            </div>
            <p className="text-sm">{e.message}</p>
            <p className="text-xs text-gray-600">
              {fmtDateTime(e.triggeredAt)}
              {e.zone ? ` · ${e.zone}` : ""}
            </p>
          </div>
          <Button variant="outline" className="border-red-500 text-red-700" onClick={() => close(e)}>
            {t("emergency.close")}
          </Button>
        </div>
      ))}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
        </div>
      ) : (
        <Tabs defaultValue="scenarios">
          <TabsList className="mb-4">
            <TabsTrigger value="scenarios">{t("emergency.tabs.scenarios")}</TabsTrigger>
            <TabsTrigger value="drills">{t("emergency.tabs.drills")}</TabsTrigger>
            <TabsTrigger value="history">{t("emergency.tabs.history")}</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setDialog({ open: true })} className="bg-prosafe-600 hover:bg-prosafe-700">
                <Plus className="me-2 h-4 w-4" />
                {t("emergency.scenarios.create")}
              </Button>
            </div>
            {scenarios.length === 0 ? (
              <p className="py-8 text-center text-gray-500">{t("emergency.scenarios.empty")}</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {scenarios.map((s) => (
                  <Card key={s.id} className={s.isActive ? "" : "opacity-60"}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-base">{s.title}</CardTitle>
                        <div className="mt-1 flex gap-2">
                          <Badge variant="outline">{t(`emergency.types.${s.type}`)}</Badge>
                          <Badge
                            className={
                              s.isActive
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }
                          >
                            {s.isActive ? t("emergency.fields.active") : t("emergency.fields.inactive")}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Button size="icon" variant="ghost" onClick={() => setDialog({ open: true, scenario: s })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => removeScenario(s)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {s.assemblyPoint && (
                        <div className="flex items-center gap-1 text-gray-700">
                          <MapPin className="h-4 w-4" />
                          {s.assemblyPoint}
                        </div>
                      )}
                      {s.steps.length > 0 && (
                        <ol className="list-decimal space-y-1 ps-5">
                          {s.steps.map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ol>
                      )}
                      {s.contacts.length > 0 && (
                        <ul className="space-y-1 border-t pt-2">
                          {s.contacts.map((c, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="font-medium">{c.name}</span>
                              <span className="text-gray-500">({c.role})</span>
                              <span className="ms-auto">{c.phone}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drills">
            <DrillsTab scenarios={scenarios} />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                {history.length === 0 ? (
                  <p className="py-6 text-center text-gray-500">{t("emergency.noHistory")}</p>
                ) : (
                  <ul className="divide-y">
                    {history.map((e) => (
                      <li key={e.id} className="py-3 text-sm">
                        <div className="font-medium">
                          {e.scenario?.title ? `${e.scenario.title} - ` : ""}
                          {e.message}
                        </div>
                        <div className="text-xs text-gray-500">
                          {fmtDateTime(e.triggeredAt)} → {fmtDateTime(e.closedAt)}
                          {e.zone ? ` · ${e.zone}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <TriggerDialog open={trigger} scenarios={scenarios} onClose={() => setTrigger(false)} onTriggered={load} />
      <ScenarioDialog
        open={dialog.open}
        scenario={dialog.scenario}
        onClose={() => setDialog({ open: false })}
        onSaved={load}
      />
    </PageShell>
  );
};

export default Emergency;
