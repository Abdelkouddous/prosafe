import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import SectionTabs from "@/components/SectionTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { fmtDate } from "@/components/manager/ManagerPage";
import { riskTabs } from "@/components/risks/riskNav";
import { fullName, planOverdue, planStatusClasses } from "@/components/risks/riskBits";
import ActionPlanDialog from "@/components/risks/ActionPlanDialog";
import { PLAN_STATUSES, risksApi, type ActionPlan, type Risk } from "@/services/risksApi";

const ALL = "all";

const PlanCard = ({
  plan,
  riskTitle,
  onChange,
  onEdit,
  onDelete,
}: {
  plan: ActionPlan;
  riskTitle: string;
  onChange: (patch: { progress?: number; status?: ActionPlan["status"] }) => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(plan.progress);
  useEffect(() => setValue(plan.progress), [plan.progress]);
  const overdue = planOverdue(plan);
  return (
    <div className={`rounded-lg border bg-white p-3 ${overdue ? "border-red-300 bg-red-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium">{plan.title}</div>
          <div className="truncate text-xs text-gray-500">{riskTitle}</div>
        </div>
        <Badge className={planStatusClasses[plan.status]}>{t(`risks.plans.statuses.${plan.status}`)}</Badge>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        {fullName(plan.owner) || t("actions.unassigned")}
        {plan.dueDate && (
          <span className={overdue ? "ms-2 font-semibold text-red-600" : "ms-2"}>
            {t("actions.due")}: {fmtDate(plan.dueDate)}
            {overdue && ` (${t("actions.overdue")})`}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Slider
          value={[value]}
          max={100}
          step={5}
          onValueChange={(v) => setValue(v[0])}
          onValueCommit={(v) => v[0] !== plan.progress && onChange({ progress: v[0] })}
        />
        <span className="w-10 text-end text-xs">{value}%</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Select value={plan.status} onValueChange={(v) => onChange({ status: v as ActionPlan["status"] })}>
          <SelectTrigger className="h-8 w-40">
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
        <div>
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ActionPlans = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(ALL);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; plan?: ActionPlan | null }>({ open: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        risksApi.listPlans({ status: status === ALL ? undefined : status }),
        risksApi.list({ limit: 100 }),
      ]);
      setPlans(p.data.data);
      setRisks(r.data.data);
    } catch {
      toast({ title: t("risks.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [status, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const riskTitle = (id: number) => risks.find((r) => r.id === id)?.title ?? `#${id}`;
  const visible = useMemo(() => (onlyOverdue ? plans.filter(planOverdue) : plans), [plans, onlyOverdue]);
  const overdueCount = useMemo(() => plans.filter(planOverdue).length, [plans]);

  const patch = async (p: ActionPlan, body: { progress?: number; status?: ActionPlan["status"] }) => {
    try {
      await risksApi.updatePlan(p.id, body);
      load();
    } catch {
      toast({ title: t("risks.plans.saveError"), variant: "destructive" });
    }
  };

  const remove = async (p: ActionPlan) => {
    if (!window.confirm(t("risks.plans.confirmDelete"))) return;
    try {
      await risksApi.removePlan(p.id);
      load();
    } catch {
      toast({ title: t("risks.plans.saveError"), variant: "destructive" });
    }
  };

  return (
    <PageShell
      title={t("risks.title")}
      subtitle={t("risks.plans.subtitle")}
      actions={
        <Button onClick={() => setDialog({ open: true })} className="bg-prosafe-600 hover:bg-prosafe-700">
          <Plus className="me-2 h-4 w-4" />
          {t("risks.plans.create")}
        </Button>
      }
    >
      <SectionTabs tabs={riskTabs(t)} />
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("risks.allStatuses")}</SelectItem>
            {PLAN_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`risks.plans.statuses.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="overdue" checked={onlyOverdue} onCheckedChange={setOnlyOverdue} />
          <Label htmlFor="overdue">{t("risks.plans.onlyOverdue")}</Label>
        </div>
        {overdueCount > 0 && (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            {t("risks.plans.overdueCount", { count: overdueCount })}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">{t("risks.plans.empty")}</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              riskTitle={riskTitle(p.riskId)}
              onChange={(b) => patch(p, b)}
              onEdit={() => setDialog({ open: true, plan: p })}
              onDelete={() => remove(p)}
            />
          ))}
        </div>
      )}

      <ActionPlanDialog
        open={dialog.open}
        plan={dialog.plan}
        risks={risks}
        onClose={() => setDialog({ open: false })}
        onSaved={load}
      />
    </PageShell>
  );
};

export default ActionPlans;
