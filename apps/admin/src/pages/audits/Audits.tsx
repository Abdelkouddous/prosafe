import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { CalendarDays, List, Loader2, Plus, Trash2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import SectionTabs from "@/components/SectionTabs";
import PagerBar from "@/components/PagerBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { fmtDateTime } from "@/components/manager/ManagerPage";
import AuditFormDialog from "@/components/audits/AuditFormDialog";
import MonthCalendar from "@/components/audits/MonthCalendar";
import { AuditStatusBadge, auditTabs, auditorLabel, scoreClass } from "@/components/audits/auditBits";
import { AUDIT_STATUSES, auditsApi, type Audit } from "@/services/auditsApi";

const ALL = "all";
const LIMIT = 20;

const Audits = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [status, setStatus] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Audit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; audit?: Audit | null; date?: string }>({ open: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const common = {
        status: status === ALL ? undefined : status,
        type: type === ALL ? undefined : type,
      };
      const res =
        view === "calendar"
          ? await auditsApi.list({
              ...common,
              from: format(startOfMonth(month), "yyyy-MM-dd"),
              to: format(endOfMonth(month), "yyyy-MM-dd"),
              limit: 100,
            })
          : await auditsApi.list({ ...common, page, limit: LIMIT });
      setRows(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast({ title: t("audits.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [view, month, status, type, page, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (a: Audit) => {
    if (!window.confirm(t("audits.confirmDelete"))) return;
    try {
      await auditsApi.remove(a.id);
      load();
    } catch {
      toast({ title: t("audits.saveError"), variant: "destructive" });
    }
  };

  return (
    <PageShell
      title={t("audits.title")}
      subtitle={t("audits.subtitle")}
      actions={
        <Button onClick={() => setDialog({ open: true })} className="bg-prosafe-600 hover:bg-prosafe-700">
          <Plus className="me-2 h-4 w-4" />
          {t("audits.create")}
        </Button>
      }
    >
      <SectionTabs tabs={auditTabs(t)} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border bg-white">
          <Button
            size="sm"
            variant={view === "calendar" ? "default" : "ghost"}
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="me-1 h-4 w-4" />
            {t("audits.view.calendar")}
          </Button>
          <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}>
            <List className="me-1 h-4 w-4" />
            {t("audits.view.list")}
          </Button>
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("audits.allStatuses")}</SelectItem>
            {AUDIT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`audits.statuses.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("audits.allTypes")}</SelectItem>
            <SelectItem value="internal">{t("audits.types.internal")}</SelectItem>
            <SelectItem value="external">{t("audits.types.external")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {view === "calendar" ? (
            <div className="relative">
              {loading && (
                <Loader2 className="absolute end-2 top-2 h-5 w-5 animate-spin text-prosafe-600" />
              )}
              <MonthCalendar
                month={month}
                audits={rows}
                onMonthChange={(d) => setMonth(startOfMonth(d))}
                onAuditClick={(a) => navigate(`/audits/${a.id}`)}
                onDayClick={(d) => setDialog({ open: true, date: format(d, "yyyy-MM-dd") })}
              />
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("audits.empty")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("audits.fields.title")}</TableHead>
                    <TableHead>{t("audits.fields.type")}</TableHead>
                    <TableHead>{t("audits.fields.scheduledAt")}</TableHead>
                    <TableHead>{t("audits.fields.auditor")}</TableHead>
                    <TableHead>{t("audits.fields.status")}</TableHead>
                    <TableHead>{t("audits.fields.score")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((a) => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => navigate(`/audits/${a.id}`)}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{t(`audits.types.${a.type}`)}</TableCell>
                      <TableCell>{fmtDateTime(a.scheduledAt)}</TableCell>
                      <TableCell>{auditorLabel(a)}</TableCell>
                      <TableCell>
                        <AuditStatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className={`font-semibold ${scoreClass(a.score)}`}>
                        {a.score != null ? `${a.score}%` : "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="text-end">
                        <Button size="sm" variant="ghost" onClick={() => setDialog({ open: true, audit: a })}>
                          {t("common.edit")}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(a)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PagerBar page={page} limit={LIMIT} total={total} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <AuditFormDialog
        open={dialog.open}
        audit={dialog.audit}
        defaultDate={dialog.date}
        onClose={() => setDialog({ open: false })}
        onSaved={load}
      />
    </PageShell>
  );
};

export default Audits;
