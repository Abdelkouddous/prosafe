import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/components/ui/use-toast";
import UserPicker from "@/components/UserPicker";
import { apiErrorMessage, toDateInput } from "@/components/manager/ManagerPage";
import { PLAN_STATUSES, risksApi, type ActionPlan, type ActionPlanStatus, type Risk } from "@/services/risksApi";

interface Props {
  open: boolean;
  plan?: ActionPlan | null;
  /** Fixed risk (drawer) or a list to pick from (plans page). */
  riskId?: number;
  risks?: Risk[];
  onClose: () => void;
  onSaved: () => void;
}

const ActionPlanDialog = ({ open, plan, riskId, risks, onClose, onSaved }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [rid, setRid] = useState<number | undefined>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState<number | undefined>();
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<ActionPlanStatus>("planned");

  useEffect(() => {
    if (!open) return;
    setRid(plan?.riskId ?? riskId);
    setTitle(plan?.title ?? "");
    setDescription(plan?.description ?? "");
    setOwnerId(plan?.ownerId ?? undefined);
    setDueDate(toDateInput(plan?.dueDate));
    setStatus(plan?.status ?? "planned");
  }, [open, plan, riskId]);

  const save = async () => {
    if (!title.trim() || (!plan && !rid)) return;
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        ownerId,
        dueDate: dueDate || undefined,
        status,
      };
      if (plan) await risksApi.updatePlan(plan.id, body);
      else await risksApi.createPlan({ ...body, riskId: rid });
      toast({ title: t("risks.plans.saved") });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("risks.plans.saveError")), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? t("risks.plans.edit") : t("risks.plans.create")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!plan && !riskId && risks && (
            <div>
              <Label>{t("risks.plans.risk")} *</Label>
              <Select value={rid ? String(rid) : undefined} onValueChange={(v) => setRid(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("risks.plans.selectRisk")} />
                </SelectTrigger>
                <SelectContent>
                  {risks.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>{t("risks.fields.title")} *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>{t("risks.fields.description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label>{t("actions.owner")}</Label>
              <UserPicker value={ownerId} onChange={setOwnerId} />
            </div>
            <div>
              <Label>{t("actions.dueDate")}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>{t("risks.fields.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ActionPlanStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`risks.plans.statuses.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={save}
            disabled={saving || !title.trim() || (!plan && !rid)}
            className="bg-prosafe-600 hover:bg-prosafe-700"
          >
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActionPlanDialog;
