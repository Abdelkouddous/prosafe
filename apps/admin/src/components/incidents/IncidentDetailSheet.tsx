import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getIncidentCoords,
  incidentApi,
  type Incident,
  type IncidentStatus,
} from "@/services/incidentApi";
import {
  allowedTransitions,
  severityClasses,
  statusClasses,
} from "./incidentUi";
import IncidentMap from "./IncidentMap";
import EvaluationPanel from "./EvaluationPanel";
import CorrectiveActionsPanel from "./CorrectiveActionsPanel";
import MediaGallery from "./MediaGallery";

interface Props {
  incidentId: number | null;
  onClose: () => void;
  onChanged: () => void;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-xs uppercase text-gray-500">{label}</div>
    <div className="text-sm">{children}</div>
  </div>
);

const IncidentDetailSheet = ({ incidentId, onClose, onChanged }: Props) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState<IncidentStatus | "">("");
  const [comment, setComment] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);

  const load = useCallback(async () => {
    if (incidentId == null) return;
    setLoading(true);
    try {
      const res = await incidentApi.get(incidentId);
      setIncident(res.data);
      setNewStatus("");
      setComment("");
    } catch {
      toast({ title: t("incidents.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [incidentId, t, toast]);

  useEffect(() => {
    setIncident(null);
    load();
  }, [load]);

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleString(i18n.language) : "-";
  const person = (p?: { firstName: string; lastName: string } | null) =>
    p ? `${p.firstName} ${p.lastName}` : "-";

  const submitStatus = async () => {
    if (!incident || !newStatus) return;
    setSaving(true);
    try {
      await incidentApi.updateStatus(incident.id, newStatus, comment.trim() || undefined);
      toast({ title: t("incidents.statusUpdated") });
      await load();
      onChanged();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      toast({
        title: t("incidents.statusUpdateError"),
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const reject = async () => {
    if (!incident) return;
    setSaving(true);
    try {
      await incidentApi.updateStatus(
        incident.id,
        "closed",
        comment.trim() || undefined,
        true
      );
      toast({ title: t("incidents.rejected") });
      setConfirmReject(false);
      await load();
      onChanged();
    } catch {
      toast({ title: t("incidents.statusUpdateError"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const coords = incident ? getIncidentCoords(incident) : null;
  const options = incident ? allowedTransitions[incident.status] : [];

  return (
    <Sheet open={incidentId != null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{incident?.incidentId ?? t("incidents.detail")}</SheetTitle>
          <SheetDescription>{t("incidents.detail")}</SheetDescription>
        </SheetHeader>

        {(loading && !incident) || !incident ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5 mt-4">
            <div className="flex flex-wrap gap-2">
              <Badge className={statusClasses[incident.status]}>
                {t(`incidents.statuses.${incident.status}`)}
              </Badge>
              <Badge className={severityClasses[incident.severity]}>
                {t(`incidents.severities.${incident.severity}`)}
              </Badge>
              <Badge variant="outline">{t(`incidents.types.${incident.type}`)}</Badge>
            </div>

            <Field label={t("incidents.description")}>
              <p className="whitespace-pre-wrap">{incident.description}</p>
            </Field>
            {incident.notes && (
              <Field label={t("incidents.notes")}>
                <p className="whitespace-pre-wrap">{incident.notes}</p>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("incidents.reporter")}>{person(incident.reporter)}</Field>
              <Field label={t("incidents.date")}>{fmt(incident.timestamp)}</Field>
              <Field label={t("incidents.zone")}>{incident.zone || "-"}</Field>
              <Field label={t("incidents.department")}>{incident.department || "-"}</Field>
              <Field label={t("incidents.address")}>{incident.manualAddress || "-"}</Field>
              {incident.resolvedAt && (
                <Field label={t("incidents.resolvedAt")}>
                  {fmt(incident.resolvedAt)} ({person(incident.resolver)})
                </Field>
              )}
            </div>

            {incident.media?.length > 0 && (
              <div>
                <div className="text-xs uppercase text-gray-500 mb-1">
                  {t("incidents.media")}
                </div>
                <MediaGallery media={incident.media} />
              </div>
            )}

            {coords && (
              <div>
                <div className="text-xs uppercase text-gray-500 mb-1">
                  {t("incidents.location")} ({coords[0].toFixed(5)}, {coords[1].toFixed(5)})
                </div>
                <IncidentMap
                  points={[{ id: incident.id, position: coords, label: incident.incidentId }]}
                />
              </div>
            )}

            <div>
              <div className="text-xs uppercase text-gray-500 mb-2">
                {t("incidents.history")}
              </div>
              {incident.history?.length ? (
                <ol className="border-s-2 border-gray-200 ms-2 space-y-3">
                  {incident.history.map((h) => (
                    <li key={h.id} className="ps-4 relative">
                      <span className="absolute -start-[7px] top-1.5 h-3 w-3 rounded-full bg-prosafe-600" />
                      <div className="text-sm font-medium">
                        {h.fromStatus
                          ? `${t(`incidents.statuses.${h.fromStatus}`)} → `
                          : ""}
                        {t(`incidents.statuses.${h.toStatus}`)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {fmt(h.changedAt)} · {person(h.changedBy)}
                      </div>
                      {h.comment && <div className="text-sm mt-0.5">{h.comment}</div>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-500">{t("incidents.noHistory")}</p>
              )}
            </div>

            <EvaluationPanel incident={incident} onSaved={() => { load(); onChanged(); }} />

            <CorrectiveActionsPanel
              incidentId={incident.id}
              actions={incident.correctiveActions ?? []}
              onChanged={load}
            />

            <div className="border-t pt-4 space-y-3">
              <Label>{t("incidents.changeStatus")}</Label>
              {options.length === 0 ? (
                <p className="text-sm text-gray-500">{t("incidents.noTransition")}</p>
              ) : (
                <>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as IncidentStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("incidents.selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`incidents.statuses.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("incidents.comment")}
                  />
                  <Button
                    onClick={submitStatus}
                    disabled={!newStatus || saving}
                    className="bg-prosafe-600 hover:bg-prosafe-700"
                  >
                    {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                    {t("incidents.updateStatus")}
                  </Button>
                </>
              )}
            </div>

            {incident.status !== "closed" && (
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => setConfirmReject(true)}
                  disabled={saving}
                >
                  {t("incidents.reject")}
                </Button>
              </div>
            )}
          </div>
        )}

        <AlertDialog open={confirmReject} onOpenChange={setConfirmReject}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("incidents.rejectTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("incidents.rejectDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={(e) => {
                  e.preventDefault();
                  reject();
                }}
              >
                {t("incidents.rejectConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
};

export default IncidentDetailSheet;
