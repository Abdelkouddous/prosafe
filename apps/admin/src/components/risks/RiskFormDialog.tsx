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
import { apiErrorMessage } from "@/components/manager/ManagerPage";
import { riskLevel } from "@/components/incidents/riskUi";
import { risksApi, type Risk } from "@/services/risksApi";
import { LevelBadge } from "./riskBits";

const SCALE = [1, 2, 3, 4, 5];

interface Props {
  open: boolean;
  risk?: Risk | null;
  onClose: () => void;
  onSaved: () => void;
}

const RiskFormDialog = ({ open, risk, onClose, onSaved }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    title: "",
    description: "",
    hazardCategory: "",
    zone: "",
    department: "",
    recommendedMeasures: "",
    gravity: 3,
    probability: 3,
  });

  useEffect(() => {
    if (!open) return;
    setF({
      title: risk?.title ?? "",
      description: risk?.description ?? "",
      hazardCategory: risk?.hazardCategory ?? "",
      zone: risk?.zone ?? "",
      department: risk?.department ?? "",
      recommendedMeasures: risk?.recommendedMeasures ?? "",
      gravity: risk?.gravity ?? 3,
      probability: risk?.probability ?? 3,
    });
  }, [open, risk]);

  const set = (k: keyof typeof f, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  const score = f.gravity * f.probability;

  const save = async () => {
    if (!f.title.trim() || !f.hazardCategory.trim()) return;
    setSaving(true);
    const text = {
      title: f.title.trim(),
      description: f.description.trim(),
      hazardCategory: f.hazardCategory.trim(),
      zone: f.zone.trim(),
      department: f.department.trim(),
      recommendedMeasures: f.recommendedMeasures.trim(),
    };
    try {
      if (risk) {
        await risksApi.update(risk.id, text);
        if (risk.gravity !== f.gravity || risk.probability !== f.probability) {
          await risksApi.evaluate(risk.id, f.gravity, f.probability);
        }
      } else {
        const body = Object.fromEntries(Object.entries(text).filter(([, v]) => v));
        await risksApi.create({
          ...(body as { title: string; hazardCategory: string }),
          gravity: f.gravity,
          probability: f.probability,
        });
      }
      toast({ title: t("risks.saved") });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("risks.saveError")), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const scale = (k: "gravity" | "probability") => (
    <Select value={String(f[k])} onValueChange={(v) => set(k, Number(v))}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SCALE.map((n) => (
          <SelectItem key={n} value={String(n)}>
            {n} - {t(`risks.scale.${k}.${n}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{risk ? t("risks.edit") : t("risks.create")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{t("risks.fields.title")} *</Label>
            <Input value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>{t("risks.fields.description")}</Label>
            <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label>{t("risks.fields.hazardCategory")} *</Label>
              <Input value={f.hazardCategory} onChange={(e) => set("hazardCategory", e.target.value)} />
            </div>
            <div>
              <Label>{t("risks.fields.zone")}</Label>
              <Input value={f.zone} onChange={(e) => set("zone", e.target.value)} />
            </div>
            <div>
              <Label>{t("risks.fields.department")}</Label>
              <Input value={f.department} onChange={(e) => set("department", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>{t("risks.fields.gravity")}</Label>
              {scale("gravity")}
            </div>
            <div>
              <Label>{t("risks.fields.probability")}</Label>
              {scale("probability")}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-gray-50 p-3 text-sm">
            <span>{t("risks.fields.score")}:</span>
            <LevelBadge level={riskLevel(score)} score={score} />
            <span className="text-xs text-gray-500">
              ({f.gravity} x {f.probability})
            </span>
          </div>
          <div>
            <Label>{t("risks.fields.recommendedMeasures")}</Label>
            <Textarea
              value={f.recommendedMeasures}
              onChange={(e) => set("recommendedMeasures", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={save}
            disabled={saving || !f.title.trim() || !f.hazardCategory.trim()}
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

export default RiskFormDialog;
