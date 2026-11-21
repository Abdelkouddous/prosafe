import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import CorrectiveActionsPanel from "@/components/incidents/CorrectiveActionsPanel";
import { apiErrorMessage, fmtDate } from "@/components/manager/ManagerPage";
import { risksApi, type ActionPlan, type RiskDetail, type RiskStatus } from "@/services/risksApi";
import ActionPlanDialog from "./ActionPlanDialog";
import RiskFormDialog from "./RiskFormDialog";
import { LevelBadge, fullName, planOverdue, planStatusClasses, riskStatusClasses } from "./riskBits";

interface Props {
  riskId: number | null;
  proposedByName?: string;
  onClose: () => void;
  onChanged: () => void;
}

/** Transitions offered to the manager. */
const TRANSITIONS: Record<RiskStatus, { to: RiskStatus; key: string; variant?: "default" | "outline" | "destructive" }[]> = {
  proposed: [
    { to: "validated", key: "validate" },
    { to: "archived", key: "archive", variant: "outline" },
  ],
  validated: [
    { to: "mitigated", key: "mitigate" },
    { to: "archived", key: "archive", variant: "outline" },
  ],
  mitigated: [{ to: "archived", key: "archive", variant: "outline" }],
  archived: [{ to: "validated", key: "restore", variant: "outline" }],
};

const RiskDetailSheet = ({ riskId, proposedByName, onClose, onChanged }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [risk, setRisk] = useState<RiskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [planDialog, setPlanDialog] = useState<{ open: boolean; plan?: ActionPlan | null }>({ open: false });

  const load = useCallback(async () => {
    if (riskId == null) return;
    setLoading(true);
    try {
      setRisk((await risksApi.get(riskId)).data);
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("risks.loadError")), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [riskId, t, toast]);

  useEffect(() => {
    setRisk(null);
    load();
  }, [load]);

  const changed = () => {
    load();
    onChanged();
  };

  const move = async (status: RiskStatus) => {
    if (!risk) return;
    try {
      await risksApi.update(risk.id, { status });
      changed();
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("risks.saveError")), variant: "destructive" });
    }
  };

  const removePlan = async (p: ActionPlan) => {
    if (!window.confirm(t("risks.plans.confirmDelete"))) return;
    try {
      await risksApi.removePlan(p.id);
      changed();
    } catch {
      toast({ title: t("risks.plans.saveError"), variant: "destructive" });
    }
  };

  return (
    <Sheet open={riskId != null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{risk?.title ?? t("risks.title")}</SheetTitle>
        </SheetHeader>
        {loading && !risk && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-prosafe-600" />
          </div>
        )}
        {risk && (
          <div className="mt-4 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={risk.level} score={risk.score} />
              <Badge className={riskStatusClasses[risk.status]}>{t(`risks.statuses.${risk.status}`)}</Badge>
              <Badge variant="outline">{risk.hazardCategory}</Badge>
              {risk.status === "proposed" && proposedByName && (
                <span className="text-xs font-medium text-orange-700">
                  {t("risks.proposedBy", { name: proposedByName })}
                </span>
              )}
            </div>

            {risk.description && <p className="whitespace-pre-line text-sm text-gray-700">{risk.description}</p>}

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500">{t("risks.fields.gravity")}</dt>
                <dd>{risk.gravity} / 5</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("risks.fields.probability")}</dt>
                <dd>{risk.probability} / 5</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("risks.fields.zone")}</dt>
                <dd>{risk.zone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("risks.fields.department")}</dt>
                <dd>{risk.department || "—"}</dd>
              </div>
            </dl>

            {risk.recommendedMeasures && (
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">
                  {t("risks.fields.recommendedMeasures")}
                </div>
                <p className="whitespace-pre-line text-sm">{risk.recommendedMeasures}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {TRANSITIONS[risk.status].map((tr) => (
                <Button
                  key={tr.to}
                  size="sm"
                  variant={tr.variant ?? "default"}
                  className={!tr.variant ? "bg-green-600 hover:bg-green-700" : undefined}
                  onClick={() => move(tr.to)}
                >
                  {t(`risks.actions.${tr.key}`)}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="me-1 h-4 w-4" />
                {t("common.edit")}
              </Button>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase text-gray-500">{t("risks.plans.title")}</div>
                <Button size="sm" variant="outline" onClick={() => setPlanDialog({ open: true })}>
                  <Plus className="me-1 h-4 w-4" />
                  {t("risks.plans.add")}
                </Button>
              </div>
              {risk.actionPlans.length === 0 ? (
                <p className="text-sm text-gray-500">{t("risks.plans.empty")}</p>
              ) : (
                <ul className="space-y-2">
                  {risk.actionPlans.map((p) => {
                    const overdue = planOverdue(p);
                    return (
                      <li
                        key={p.id}
                        className={`rounded-lg border p-3 ${overdue ? "border-red-300 bg-red-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{p.title}</div>
                            <div className="text-xs text-gray-500">
                              {fullName(p.owner) || t("actions.unassigned")}
                              {p.dueDate && (
                                <span className={overdue ? "ms-2 font-semibold text-red-600" : "ms-2"}>
                                  {t("actions.due")}: {fmtDate(p.dueDate)}
                                  {overdue && ` (${t("actions.overdue")})`}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge className={planStatusClasses[p.status]}>{t(`risks.plans.statuses.${p.status}`)}</Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={p.progress} className="h-2" />
                          <span className="text-xs">{p.progress}%</span>
                          <Button size="icon" variant="ghost" onClick={() => setPlanDialog({ open: true, plan: p })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => removePlan(p)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <CorrectiveActionsPanel
              sourceType="risk"
              sourceId={risk.id}
              actions={risk.correctiveActions ?? []}
              onChanged={changed}
            />
          </div>
        )}
        <RiskFormDialog open={editing} risk={risk} onClose={() => setEditing(false)} onSaved={changed} />
        <ActionPlanDialog
          open={planDialog.open}
          plan={planDialog.plan}
          riskId={risk?.id}
          onClose={() => setPlanDialog({ open: false })}
          onSaved={changed}
        />
      </SheetContent>
    </Sheet>
  );
};

export default RiskDetailSheet;
