import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AutoPlanResult,
  SkillsReport,
  trainingApi,
} from "@/services/trainingApi";
import {
  ManagerPage,
  apiErrorMessage,
  fmtDate,
} from "@/components/manager/ManagerPage";
import { trainingNav } from "@/components/manager/links";

const TrainingCompliance = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [report, setReport] = useState<SkillsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [deptInput, setDeptInput] = useState("");
  const [department, setDepartment] = useState("");
  const [preview, setPreview] = useState<AutoPlanResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = setTimeout(() => setDepartment(deptInput.trim()), 400);
    return () => clearTimeout(h);
  }, [deptInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport((await trainingApi.skillsReport(department || undefined)).data);
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("compliance.errors.load")), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [department, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const runPreview = async () => {
    setBusy(true);
    try {
      const res = await trainingApi.autoPlan({ department: department || undefined, dryRun: true });
      setPreview(res.data);
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("compliance.errors.plan")), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const confirmPlan = async () => {
    setBusy(true);
    try {
      const res = await trainingApi.autoPlan({ department: department || undefined, dryRun: false });
      toast({ title: t("compliance.planDone", { count: res.data.notified }) });
      setPreview(null);
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("compliance.errors.plan")), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const s = report?.summary;
  const cards = s
    ? [
        { label: t("compliance.rate"), value: `${s.complianceRate}%`, cls: s.complianceRate >= 80 ? "text-green-600" : "text-orange-600" },
        { label: t("compliance.compliantUsers"), value: `${s.compliantUsers} / ${s.users}`, cls: "" },
        { label: t("compliance.acquired"), value: s.acquired, cls: "text-green-600" },
        { label: t("compliance.expiring"), value: s.expiring, cls: "text-orange-600" },
        { label: t("compliance.missing"), value: s.missing, cls: "text-red-600" },
      ]
    : [];

  return (
    <ManagerPage
      title={t("compliance.title")}
      subtitle={t("compliance.subtitle")}
      nav={trainingNav(t)}
      actions={
        <Button onClick={runPreview} disabled={busy}>
          <Wand2 className="h-4 w-4 mr-2" />
          {t("compliance.autoPlan")}
        </Button>
      }
    >
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${c.cls}`}>{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input
            className="max-w-sm"
            placeholder={t("compliance.departmentFilter")}
            value={deptInput}
            onChange={(e) => setDeptInput(e.target.value)}
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("compliance.user")}</TableHead>
                  <TableHead>{t("compliance.department")}</TableHead>
                  <TableHead>{t("compliance.acquired")}</TableHead>
                  <TableHead>{t("compliance.expiring")}</TableHead>
                  <TableHead>{t("compliance.missing")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
                ) : !report || report.users.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("compliance.empty")}</TableCell></TableRow>
                ) : (
                  report.users.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                      <TableCell>{u.department ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.acquired.map((x) => (
                            <Badge key={x.trainingId} variant="outline" className="bg-green-100 text-green-800">{x.title}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.expiring.map((x) => (
                            <Badge key={x.trainingId} variant="outline" className="bg-orange-100 text-orange-800">
                              {x.title}{x.expiresAt ? ` · ${fmtDate(x.expiresAt)}` : ""}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.missing.map((x) => (
                            <Badge key={x.trainingId} variant="outline" className="bg-red-100 text-red-800">
                              {x.title}{x.expired ? ` (${t("compliance.expired")})` : ""}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("compliance.previewTitle")}</DialogTitle>
            <DialogDescription>
              {preview && preview.total > 0
                ? t("compliance.previewDesc", { count: preview.total })
                : t("compliance.previewNone")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {preview?.users.map((u) => (
              <div key={u.userId} className="rounded-md border p-3">
                <div className="font-medium">
                  {u.firstName} {u.lastName}
                  {u.department ? <span className="text-muted-foreground font-normal"> · {u.department}</span> : null}
                </div>
                <ul className="mt-1 text-sm space-y-0.5">
                  {u.missing.map((m) => (
                    <li key={m.trainingId} className="flex justify-between gap-2">
                      <span>{m.title}</span>
                      <span className={m.nextSession ? "text-green-700" : "text-orange-600"}>
                        {m.nextSession
                          ? t("compliance.nextSession", { date: fmtDate(m.nextSession.startAt) })
                          : t("compliance.noSession")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>{t("common.cancel")}</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={busy || !preview || preview.total === 0}
              onClick={confirmPlan}
            >
              {t("compliance.confirmNotify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerPage>
  );
};

export default TrainingCompliance;
