import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  INCIDENT_SEVERITIES,
  incidentApi,
  type Incident,
  type IncidentSeverity,
} from "@/services/incidentApi";
import { riskClasses, riskLevel } from "./riskUi";

const SCALE = [1, 2, 3, 4, 5];
const KEEP = "__keep__";

const EvaluationPanel = ({
  incident,
  onSaved,
}: {
  incident: Incident;
  onSaved: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const ev = incident.evaluation;
  const [gravity, setGravity] = useState<number | undefined>(ev?.gravity);
  const [probability, setProbability] = useState<number | undefined>(ev?.probability);
  const [rootCause, setRootCause] = useState(ev?.rootCause ?? "");
  const [severity, setSeverity] = useState<string>(ev?.evaluatedSeverity ?? KEEP);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGravity(ev?.gravity);
    setProbability(ev?.probability);
    setRootCause(ev?.rootCause ?? "");
    setSeverity(ev?.evaluatedSeverity ?? KEEP);
  }, [ev]);

  const score = gravity && probability ? gravity * probability : null;
  const level = score ? riskLevel(score) : null;

  const save = async () => {
    if (!gravity || !probability) return;
    setSaving(true);
    try {
      await incidentApi.evaluate(incident.id, {
        gravity,
        probability,
        ...(rootCause.trim() ? { rootCause: rootCause.trim() } : {}),
        ...(severity !== KEEP ? { evaluatedSeverity: severity as IncidentSeverity } : {}),
      });
      toast({ title: t("evaluation.saved") });
      onSaved();
    } catch {
      toast({ title: t("evaluation.saveError"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const scaleSelect = (
    label: string,
    val: number | undefined,
    set: (n: number) => void
  ) => (
    <div>
      <Label>{label}</Label>
      <Select value={val ? String(val) : undefined} onValueChange={(v) => set(Number(v))}>
        <SelectTrigger>
          <SelectValue placeholder="1-5" />
        </SelectTrigger>
        <SelectContent>
          {SCALE.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase text-gray-500">
          {t("evaluation.title")}
        </div>
        {ev && (
          <Badge className={riskClasses[riskLevel(ev.riskScore)]}>
            {t("evaluation.score")}: {ev.riskScore} · {t(`evaluation.levels.${riskLevel(ev.riskScore)}`)}
          </Badge>
        )}
      </div>
      {ev && (
        <p className="text-xs text-gray-500">
          {t("evaluation.by", {
            name: ev.evaluatedBy
              ? `${ev.evaluatedBy.firstName} ${ev.evaluatedBy.lastName}`
              : "-",
            date: new Date(ev.evaluatedAt).toLocaleString(i18n.language),
          })}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {scaleSelect(t("evaluation.gravity"), gravity, setGravity)}
        {scaleSelect(t("evaluation.probability"), probability, setProbability)}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">{t("evaluation.computed")}</span>
        {score && level ? (
          <Badge className={riskClasses[level]}>
            {score} · {t(`evaluation.levels.${level}`)}
          </Badge>
        ) : (
          <span>-</span>
        )}
      </div>
      <div>
        <Label>{t("evaluation.rootCause")}</Label>
        <Textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} />
      </div>
      <div>
        <Label>{t("evaluation.evaluatedSeverity")}</Label>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={KEEP}>{t("evaluation.keepReported")}</SelectItem>
            {INCIDENT_SEVERITIES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`incidents.severities.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={save}
        disabled={!gravity || !probability || saving}
        className="bg-prosafe-600 hover:bg-prosafe-700"
      >
        {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
        {t("evaluation.save")}
      </Button>
    </div>
  );
};

export default EvaluationPanel;
