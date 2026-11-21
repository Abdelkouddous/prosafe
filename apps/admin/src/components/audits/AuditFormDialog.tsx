import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/components/ui/use-toast";
import UserPicker from "@/components/UserPicker";
import { apiErrorMessage, toDateTimeInput } from "@/components/manager/ManagerPage";
import { auditsApi, type Audit, type AuditType, type ChecklistTemplate } from "@/services/auditsApi";

interface Props {
  open: boolean;
  audit?: Audit | null;
  /** Prefilled date (yyyy-MM-dd) when created from the calendar. */
  defaultDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

const AuditFormDialog = ({ open, audit, defaultDate, onClose, onSaved }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AuditType>("internal");
  const [standard, setStandard] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [auditorId, setAuditorId] = useState<number | undefined>();
  const [auditorName, setAuditorName] = useState("");
  const [zone, setZone] = useState("");
  const [templateId, setTemplateId] = useState<number | undefined>();

  useEffect(() => {
    if (!open) return;
    auditsApi
      .templates()
      .then((r) => {
        setTemplates(r.data);
        if (!audit && r.data[0]) {
          setTemplateId((cur) => cur ?? r.data[0].id);
          setStandard((cur) => cur || r.data[0].standard);
        }
      })
      .catch(() => setTemplates([]));
  }, [open, audit]);

  useEffect(() => {
    if (!open) return;
    setTitle(audit?.title ?? "");
    setType(audit?.type ?? "internal");
    setStandard(audit?.standard ?? "");
    setScheduledAt(audit ? toDateTimeInput(audit.scheduledAt) : defaultDate ? `${defaultDate}T09:00` : "");
    setAuditorId(audit?.auditorId ?? undefined);
    setAuditorName(audit?.auditorName ?? "");
    setZone(audit?.zone ?? "");
    setTemplateId(audit?.templateId ?? undefined);
  }, [open, audit, defaultDate]);

  const pickTemplate = (id: number) => {
    setTemplateId(id);
    const tpl = templates.find((x) => x.id === id);
    if (tpl && !audit) setStandard(tpl.standard);
  };

  const valid = title.trim() && scheduledAt && (audit || templateId);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        type,
        standard: standard.trim() || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        auditorId,
        auditorName: auditorName.trim() || undefined,
        zone: zone.trim() || undefined,
      };
      if (audit) await auditsApi.update(audit.id, body);
      else await auditsApi.create({ ...body, templateId });
      toast({ title: t("audits.saved") });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("audits.saveError")), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{audit ? t("audits.edit") : t("audits.create")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{t("audits.fields.title")} *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>{t("audits.fields.type")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as AuditType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">{t("audits.types.internal")}</SelectItem>
                  <SelectItem value="external">{t("audits.types.external")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("audits.fields.standard")}</Label>
              <Input value={standard} onChange={(e) => setStandard(e.target.value)} placeholder="ISO 45001" />
            </div>
            <div>
              <Label>{t("audits.fields.scheduledAt")} *</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div>
              <Label>{t("audits.fields.zone")}</Label>
              <Input value={zone} onChange={(e) => setZone(e.target.value)} />
            </div>
            <div>
              <Label>{t("audits.fields.auditor")}</Label>
              <UserPicker value={auditorId} onChange={setAuditorId} allLabel={t("audits.fields.noAuditor")} />
            </div>
            <div>
              <Label>{t("audits.fields.auditorName")}</Label>
              <Input value={auditorName} onChange={(e) => setAuditorName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t("audits.fields.template")} *</Label>
            <Select
              value={templateId ? String(templateId) : undefined}
              onValueChange={(v) => pickTemplate(Number(v))}
              disabled={!!audit}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("audits.fields.selectTemplate")} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tp) => (
                  <SelectItem key={tp.id} value={String(tp.id)}>
                    {tp.name} ({tp.items.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving || !valid} className="bg-prosafe-600 hover:bg-prosafe-700">
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuditFormDialog;
