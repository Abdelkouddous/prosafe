import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import PageShell from "@/components/PageShell";
import SectionTabs from "@/components/SectionTabs";
import PagerBar from "@/components/PagerBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { riskTabs } from "@/components/risks/riskNav";
import { LevelBadge, riskStatusClasses } from "@/components/risks/riskBits";
import RiskDetailSheet from "@/components/risks/RiskDetailSheet";
import RiskFormDialog from "@/components/risks/RiskFormDialog";
import { RISK_LEVELS, RISK_STATUSES, risksApi, type Risk } from "@/services/risksApi";
import { usersApi } from "@/services/usersApi";

const ALL = "all";
const LIMIT = 20;

const Risks = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<Risk[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [zone, setZone] = useState("");
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [names, setNames] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  // debounce free-text filters
  const [debounced, setDebounced] = useState({ zone: "", category: "" });
  useEffect(() => {
    const h = setTimeout(() => {
      setSearch(searchInput.trim());
      setDebounced({ zone: zone.trim(), category: category.trim() });
      setPage(1);
    }, 400);
    return () => clearTimeout(h);
  }, [searchInput, zone, category]);

  useEffect(() => {
    usersApi
      .list()
      .then((u) => setNames(Object.fromEntries(u.map((x) => [x.id, `${x.firstName} ${x.lastName}`]))))
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await risksApi.list({
        status: status === ALL ? undefined : status,
        level: level === ALL ? undefined : level,
        zone: debounced.zone,
        hazardCategory: debounced.category,
        search,
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
  }, [status, level, debounced, search, page, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const proposer = (r: Risk) =>
    r.proposedById ? names[r.proposedById] ?? `#${r.proposedById}` : "";

  return (
    <PageShell
      title={t("risks.title")}
      subtitle={t("risks.subtitle")}
      actions={
        <Button onClick={() => setCreating(true)} className="bg-prosafe-600 hover:bg-prosafe-700">
          <Plus className="me-2 h-4 w-4" />
          {t("risks.create")}
        </Button>
      }
    >
      <SectionTabs tabs={riskTabs(t)} />
      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("risks.searchPlaceholder")}
          />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("risks.allStatuses")}</SelectItem>
              {RISK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`risks.statuses.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={(v) => { setLevel(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("risks.allLevels")}</SelectItem>
              {RISK_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {t(`risks.levels.${l}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder={t("risks.fields.zone")} />
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t("risks.fields.hazardCategory")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("risks.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("risks.fields.title")}</TableHead>
                  <TableHead>{t("risks.fields.hazardCategory")}</TableHead>
                  <TableHead>{t("risks.fields.zone")}</TableHead>
                  <TableHead>{t("risks.fields.score")}</TableHead>
                  <TableHead>{t("risks.fields.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.id}
                    onClick={() => setSelected(r.id)}
                    className={`cursor-pointer ${r.status === "proposed" ? "bg-orange-50 hover:bg-orange-100" : ""}`}
                  >
                    <TableCell>
                      <div className="font-medium">{r.title}</div>
                      {r.status === "proposed" && (
                        <div className="text-xs font-medium text-orange-700">
                          {t("risks.proposedBy", { name: proposer(r) })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{r.hazardCategory}</TableCell>
                    <TableCell>{r.zone || "—"}</TableCell>
                    <TableCell>
                      <LevelBadge level={r.level} score={r.score} />
                    </TableCell>
                    <TableCell>
                      <Badge className={riskStatusClasses[r.status]}>{t(`risks.statuses.${r.status}`)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <PagerBar page={page} limit={LIMIT} total={total} onPage={setPage} />
        </CardContent>
      </Card>

      <RiskDetailSheet
        riskId={selected}
        proposedByName={(() => {
          const r = rows.find((x) => x.id === selected);
          return r ? proposer(r) : undefined;
        })()}
        onClose={() => setSelected(null)}
        onChanged={load}
      />
      <RiskFormDialog open={creating} onClose={() => setCreating(false)} onSaved={load} />
    </PageShell>
  );
};

export default Risks;
