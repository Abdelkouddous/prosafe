import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import UserPicker from "@/components/UserPicker";
import CorrectiveActionsPanel from "@/components/incidents/CorrectiveActionsPanel";
import { apiErrorMessage, fmtDateTime } from "@/components/manager/ManagerPage";
import { AuditStatusBadge, auditorLabel, scoreClass } from "@/components/audits/auditBits";
import {
  AUDIT_RESULTS,
  auditsApi,
  type AuditDetail,
  type AuditResult,
  type AuditStatus,
} from "@/services/auditsApi";

type Answers = Record<number, { result?: AuditResult; comment: string }>;

const resultClass: Record<AuditResult, string> = {
  conform: "bg-green-600 text-white hover:bg-green-700",
  non_conform: "bg-red-600 text-white hover:bg-red-700",
  not_applicable: "bg-gray-500 text-white hover:bg-gray-600",
};

const NEXT: Partial<Record<AuditStatus, AuditStatus>> = {
  planned: "in_progress",
  in_progress: "completed",
};

const AuditExecution = () => {
  const { id } = useParams();
  const auditId = Number(id);
  const { t } = useTranslation();
  const { toast } = useToast();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [createActions, setCreateActions] = useState(false);
  const [ownerId, setOwnerId] = useState<number | undefined>();
  const [dueDate, setDueDate] = useState("");

  const apply = useCallback((a: AuditDetail) => {
    setAudit(a);
    setAnswers(
      Object.fromEntries(a.responses.map((r) => [r.itemId, { result: r.result, comment: r.comment ?? "" }]))
    );
    setDirty(false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      apply((await auditsApi.get(auditId)).data);
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("audits.loadError")), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [auditId, apply, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const editable = audit?.status === "planned" || audit?.status === "in_progress";
  const items = audit?.template?.items ?? [];

  const live = useMemo(() => {
    const vals = Object.values(answers);
    const c = vals.filter((a) => a.result === "conform").length;
    const n = vals.filter((a) => a.result === "non_conform").length;
    return { answered: vals.filter((a) => a.result).length, nonConform: n, score: c + n ? Math.round((c / (c + n)) * 1000) / 10 : null };
  }, [answers]);

  const setAnswer = (itemId: number, patch: Partial<Answers[number]>) => {
    setAnswers((p) => ({ ...p, [itemId]: { comment: "", ...p[itemId], ...patch } }));
    setDirty(true);
  };

  const save = async () => {
    const responses = Object.entries(answers)
      .filter(([, a]) => a.result)
      .map(([itemId, a]) => ({
        itemId: Number(itemId),
        result: a.result as AuditResult,
        ...(a.comment.trim() ? { comment: a.comment.trim() } : {}),
      }));
    setSaving(true);
    try {
      const res = await auditsApi.saveResponses(auditId, {
        responses,
        ...(createActions
          ? { createActions: true, actionOwnerId: ownerId, actionDueDate: dueDate || undefined }
          : {}),
      });
      apply(res.data);
      toast({ title: t("audits.exec.saved") });
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("audits.saveError")), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status: AuditStatus) => {
    if (status === "completed" && !window.confirm(t("audits.exec.confirmComplete"))) return;
    try {
      await auditsApi.update(auditId, { status });
      await load();
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("audits.saveError")), variant: "destructive" });
    }
  };

  if (loading && !audit) {
    return (
      <PageShell title={t("audits.title")}>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
        </div>
      </PageShell>
    );
  }
  if (!audit) {
    return (
      <PageShell title={t("audits.title")}>
        <p className="text-gray-500">{t("audits.loadError")}</p>
      </PageShell>
    );
  }

  const score = audit.status === "completed" ? audit.score : dirty ? live.score : audit.summary.score;
  const pct = items.length ? Math.round((live.answered / items.length) * 100) : 0;

  return (
    <PageShell
      title={audit.title}
      subtitle={`${t(`audits.types.${audit.type}`)} · ${audit.standard ?? ""} · ${fmtDateTime(audit.scheduledAt)} · ${auditorLabel(audit)}`}
      actions={
        <div className="flex items-center gap-2">
          <AuditStatusBadge status={audit.status} />
          {NEXT[audit.status] && (
            <Button
              size="sm"
              className={audit.status === "in_progress" ? "bg-green-600 hover:bg-green-700" : "bg-prosafe-600 hover:bg-prosafe-700"}
              onClick={() => changeStatus(NEXT[audit.status] as AuditStatus)}
            >
              {t(`audits.exec.to.${NEXT[audit.status]}`)}
            </Button>
          )}
          {editable && (
            <Button size="sm" variant="outline" onClick={() => changeStatus("cancelled")}>
              {t("audits.exec.to.cancelled")}
            </Button>
          )}
        </div>
      }
    >
      <Link to="/audits" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-prosafe-600">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("audits.exec.back")}
      </Link>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-gray-500">{t("audits.fields.score")}</div>
            <div className={`text-3xl font-bold ${scoreClass(score)}`}>{score != null ? `${score}%` : "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-gray-500">{t("audits.exec.progress")}</div>
            <div className="text-2xl font-bold">
              {live.answered} / {items.length}
            </div>
            <Progress value={pct} className="mt-1 h-2" />
          </CardContent>
        </Card>
        {(["conform", "non_conform", "not_applicable"] as const).map((r) => {
          const n = Object.values(answers).filter((a) => a.result === r).length;
          return (
            <Card key={r}>
              <CardContent className="pt-6">
                <div className="text-xs text-gray-500">{t(`audits.results.${r}`)}</div>
                <div className={`text-2xl font-bold ${r === "conform" ? "text-green-600" : r === "non_conform" ? "text-red-600" : "text-gray-600"}`}>
                  {n}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{audit.template?.name ?? t("audits.exec.checklist")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((it) => {
            const a = answers[it.id];
            const nc = a?.result === "non_conform";
            return (
              <div key={it.id} className={`rounded-lg border p-3 ${nc ? "border-red-300 bg-red-50" : a?.result === "conform" ? "border-green-200" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="me-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold">{it.clause}</span>
                    <span className="text-sm">{it.question}</span>
                  </div>
                  <div className="flex gap-1">
                    {AUDIT_RESULTS.map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        disabled={!editable}
                        variant={a?.result === r ? "default" : "outline"}
                        className={a?.result === r ? resultClass[r] : ""}
                        onClick={() => setAnswer(it.id, { result: r })}
                      >
                        {t(`audits.results.${r}`)}
                      </Button>
                    ))}
                  </div>
                </div>
                <Textarea
                  className="mt-2 min-h-10"
                  rows={1}
                  disabled={!editable}
                  value={a?.comment ?? ""}
                  onChange={(e) => setAnswer(it.id, { comment: e.target.value })}
                  placeholder={t("audits.exec.comment")}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {editable && (
        <Card className="mb-6">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2">
              <Checkbox id="ca" checked={createActions} onCheckedChange={(v) => setCreateActions(v === true)} />
              <Label htmlFor="ca">
                {t("audits.exec.createActions")} ({live.nonConform})
              </Label>
            </div>
            {createActions && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>{t("actions.owner")}</Label>
                  <UserPicker value={ownerId} onChange={setOwnerId} />
                </div>
                <div>
                  <Label>{t("actions.dueDate")}</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
            )}
            <Button onClick={save} disabled={saving || (!dirty && !createActions)} className="bg-prosafe-600 hover:bg-prosafe-700">
              {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
              {t("audits.exec.save")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <CorrectiveActionsPanel
            sourceType="audit"
            sourceId={audit.id}
            actions={audit.correctiveActions ?? []}
            onChanged={load}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default AuditExecution;
