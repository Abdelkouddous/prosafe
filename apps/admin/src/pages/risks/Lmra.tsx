import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, X } from "lucide-react";
import PageShell from "@/components/PageShell";
import SectionTabs from "@/components/SectionTabs";
import PagerBar from "@/components/PagerBar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { fmtDateTime } from "@/components/manager/ManagerPage";
import { riskTabs } from "@/components/risks/riskNav";
import { fullName } from "@/components/risks/riskBits";
import { risksApi, type Lmra as LmraRow } from "@/services/risksApi";

const ALL = "all";
const LIMIT = 20;

export const DecisionBadge = ({ decision }: { decision: "go" | "stop" }) => {
  const { t } = useTranslation();
  return (
    <Badge
      className={
        decision === "go"
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-red-100 text-red-800 border-red-300"
      }
    >
      {t(`risks.lmra.decisions.${decision}`)}
    </Badge>
  );
};

const Lmra = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<LmraRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<LmraRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await risksApi.listLmra({
        decision: decision === ALL ? undefined : decision,
        from: from || undefined,
        to: to ? `${to}T23:59:59` : undefined,
        page,
        limit: LIMIT,
      });
      setRows(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast({ title: t("risks.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [decision, from, to, page, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const flagged = (l: LmraRow) => l.hazards.filter((h) => h.present && !h.controlled).length;

  return (
    <PageShell title={t("risks.title")} subtitle={t("risks.lmra.subtitle")}>
      <SectionTabs tabs={riskTabs(t)} />
      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3">
          <div>
            <Label>{t("risks.lmra.decision")}</Label>
            <Select value={decision} onValueChange={(v) => { setDecision(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("risks.lmra.allDecisions")}</SelectItem>
                <SelectItem value="go">{t("risks.lmra.decisions.go")}</SelectItem>
                <SelectItem value="stop">{t("risks.lmra.decisions.stop")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("incidents.from")}</Label>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <Label>{t("incidents.to")}</Label>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("risks.lmra.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("risks.lmra.user")}</TableHead>
                  <TableHead>{t("risks.lmra.task")}</TableHead>
                  <TableHead>{t("risks.lmra.location")}</TableHead>
                  <TableHead>{t("risks.lmra.decision")}</TableHead>
                  <TableHead>{t("risks.lmra.uncontrolled")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((l) => (
                  <TableRow
                    key={l.id}
                    onClick={() => setDetail(l)}
                    className={`cursor-pointer ${l.decision === "stop" ? "bg-red-50 hover:bg-red-100" : ""}`}
                  >
                    <TableCell>{fullName(l.user) || `#${l.userId}`}</TableCell>
                    <TableCell className="font-medium">{l.task}</TableCell>
                    <TableCell>{l.location || "—"}</TableCell>
                    <TableCell>
                      <DecisionBadge decision={l.decision} />
                    </TableCell>
                    <TableCell className={flagged(l) > 0 ? "font-semibold text-orange-600" : ""}>
                      {flagged(l)} / {l.hazards.length}
                    </TableCell>
                    <TableCell>{fmtDateTime(l.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <PagerBar page={page} limit={LIMIT} total={total} onPage={setPage} />
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.task}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <DecisionBadge decision={detail.decision} />
                  <span className="text-gray-600">
                    {fullName(detail.user)} · {detail.location || "—"} · {fmtDateTime(detail.createdAt)}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-start text-xs text-gray-500">
                      <th className="text-start">{t("risks.lmra.hazard")}</th>
                      <th>{t("risks.lmra.present")}</th>
                      <th>{t("risks.lmra.controlled")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.hazards.map((h, i) => (
                      <tr
                        key={i}
                        className={h.present && !h.controlled ? "bg-orange-50 font-medium text-orange-800" : ""}
                      >
                        <td className="py-1">{h.label}</td>
                        <td className="text-center">{h.present ? <Check className="mx-auto h-4 w-4" /> : <X className="mx-auto h-4 w-4 text-gray-400" />}</td>
                        <td className="text-center">{h.controlled ? <Check className="mx-auto h-4 w-4 text-green-600" /> : <X className="mx-auto h-4 w-4 text-gray-400" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {detail.comments && <p className="whitespace-pre-line rounded-lg bg-gray-50 p-3">{detail.comments}</p>}
                {detail.riskIds && detail.riskIds.length > 0 && (
                  <p className="text-xs text-gray-500">{t("risks.lmra.createdRisks", { count: detail.riskIds.length })}</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default Lmra;
