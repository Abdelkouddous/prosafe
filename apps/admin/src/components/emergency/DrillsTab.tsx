import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ClipboardEdit, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { apiErrorMessage, fmtDateTime, toDateTimeInput } from "@/components/manager/ManagerPage";
import { emergencyApi, type Drill, type DrillStatus, type Scenario } from "@/services/emergencyApi";

const NONE = "__none__";
const statusClass: Record<DrillStatus, string> = {
  planned: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const fmtDuration = (s?: number | null) =>
  s == null ? "—" : `${Math.floor(s / 60)} min ${s % 60 ? `${s % 60} s` : ""}`.trim();

const DrillsTab = ({ scenarios }: { scenarios: Scenario[] }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ open: boolean; drill?: Drill | null }>({ open: false });
  const [results, setResults] = useState<Drill | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await emergencyApi.drills()).data.data);
    } catch {
      toast({ title: t("emergency.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (d: Drill) => {
    if (!window.confirm(t("emergency.drills.confirmDelete"))) return;
    try {
      await emergencyApi.removeDrill(d.id);
      load();
    } catch {
      toast({ title: t("emergency.saveError"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setForm({ open: true })} className="bg-prosafe-600 hover:bg-prosafe-700">
          <Plus className="me-2 h-4 w-4" />
          {t("emergency.drills.create")}
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("emergency.drills.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("emergency.drills.scheduledAt")}</TableHead>
                  <TableHead>{t("emergency.drills.scenario")}</TableHead>
                  <TableHead>{t("emergency.trigger.zone")}</TableHead>
                  <TableHead>{t("emergency.drills.status")}</TableHead>
                  <TableHead>{t("emergency.drills.results")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{fmtDateTime(d.scheduledAt)}</TableCell>
                    <TableCell>{d.scenario?.title ?? "—"}</TableCell>
                    <TableCell>{d.zone || "—"}</TableCell>
                    <TableCell>
                      <Badge className={statusClass[d.status]}>{t(`emergency.drills.statuses.${d.status}`)}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {d.status === "done" ? (
                        <>
                          {fmtDuration(d.durationSeconds)} · {d.evacuatedCount ?? 0}/{d.participantsCount ?? 0}{" "}
                          {t("emergency.drills.evacuatedShort")}
                          {d.observations && <div className="max-w-xs truncate text-gray-500">{d.observations}</div>}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-end">
                      {d.status === "planned" && (
                        <Button size="sm" variant="outline" onClick={() => setResults(d)}>
                          <CheckCircle2 className="me-1 h-4 w-4 text-green-600" />
                          {t("emergency.drills.record")}
                        </Button>
                      )}
                      {d.status === "done" && (
                        <Button size="icon" variant="ghost" onClick={() => setResults(d)}>
                          <ClipboardEdit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => setForm({ open: true, drill: d })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(d)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DrillForm
        open={form.open}
        drill={form.drill}
        scenarios={scenarios}
        onClose={() => setForm({ open: false })}
        onSaved={load}
      />
      <ResultsDialog drill={results} onClose={() => setResults(null)} onSaved={load} />
    </div>
  );
};

const DrillForm = ({
  open,
  drill,
  scenarios,
  onClose,
  onSaved,
}: {
  open: boolean;
  drill?: Drill | null;
  scenarios: Scenario[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [scenarioId, setScenarioId] = useState<number | undefined>();
  const [scheduledAt, setScheduledAt] = useState("");
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState<DrillStatus>("planned");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScenarioId(drill?.scenarioId ?? undefined);
    setScheduledAt(toDateTimeInput(drill?.scheduledAt));
    setZone(drill?.zone ?? "");
    setStatus(drill?.status ?? "planned");
  }, [open, drill]);

  const save = async () => {
    if (!scheduledAt) return;
    setSaving(true);
    try {
      const body = { scenarioId, scheduledAt: new Date(scheduledAt).toISOString(), zone: zone.trim() || undefined };
      if (drill) await emergencyApi.updateDrill(drill.id, { ...body, status });
      else await emergencyApi.createDrill(body);
      toast({ title: t("emergency.drills.saved") });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("emergency.saveError")), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{drill ? t("emergency.drills.edit") : t("emergency.drills.create")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{t("emergency.drills.scenario")}</Label>
            <Select
              value={scenarioId ? String(scenarioId) : NONE}
              onValueChange={(v) => setScenarioId(v === NONE ? undefined : Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("emergency.trigger.noScenario")}</SelectItem>
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("emergency.drills.scheduledAt")} *</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div>
              <Label>{t("emergency.trigger.zone")}</Label>
              <Input value={zone} onChange={(e) => setZone(e.target.value)} />
            </div>
          </div>
          {drill && (
            <div>
              <Label>{t("emergency.drills.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DrillStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["planned", "done", "cancelled"] as DrillStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`emergency.drills.statuses.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving || !scheduledAt} className="bg-prosafe-600 hover:bg-prosafe-700">
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ResultsDialog = ({
  drill,
  onClose,
  onSaved,
}: {
  drill: Drill | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [minutes, setMinutes] = useState("");
  const [participants, setParticipants] = useState("");
  const [evacuated, setEvacuated] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!drill) return;
    setMinutes(drill.durationSeconds != null ? String(Math.round((drill.durationSeconds / 60) * 10) / 10) : "");
    setParticipants(drill.participantsCount != null ? String(drill.participantsCount) : "");
    setEvacuated(drill.evacuatedCount != null ? String(drill.evacuatedCount) : "");
    setObservations(drill.observations ?? "");
  }, [drill]);

  const p = Number(participants);
  const ev = Number(evacuated);
  const invalid = !minutes || !participants || !evacuated || ev > p || Number(minutes) < 0;

  const save = async () => {
    if (!drill || invalid) return;
    setSaving(true);
    try {
      await emergencyApi.updateDrill(drill.id, {
        status: "done",
        durationSeconds: Math.round(Number(minutes) * 60),
        participantsCount: p,
        evacuatedCount: ev,
        observations: observations.trim() || undefined,
      });
      toast({ title: t("emergency.drills.saved") });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("emergency.saveError")), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!drill} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("emergency.drills.record")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{t("emergency.drills.duration")}</Label>
              <Input type="number" min={0} step={0.5} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </div>
            <div>
              <Label>{t("emergency.drills.participants")}</Label>
              <Input type="number" min={0} value={participants} onChange={(e) => setParticipants(e.target.value)} />
            </div>
            <div>
              <Label>{t("emergency.drills.evacuated")}</Label>
              <Input type="number" min={0} value={evacuated} onChange={(e) => setEvacuated(e.target.value)} />
            </div>
          </div>
          {ev > p && <p className="text-xs text-red-600">{t("emergency.drills.evacuatedError")}</p>}
          <div>
            <Label>{t("emergency.drills.observations")}</Label>
            <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving || invalid} className="bg-green-600 hover:bg-green-700">
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("emergency.drills.markDone")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DrillsTab;
