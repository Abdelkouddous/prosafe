import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import SectionTabs from "@/components/SectionTabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { riskTabs } from "@/components/risks/riskNav";
import { LevelBadge, cellClasses } from "@/components/risks/riskBits";
import RiskDetailSheet from "@/components/risks/RiskDetailSheet";
import { RISK_STATUSES, risksApi, type MatrixCell, type Risk, type RiskMatrix as Matrix } from "@/services/risksApi";

const AXIS = [1, 2, 3, 4, 5];

const RiskMatrix = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [status, setStatus] = useState("validated");
  const [zoneInput, setZoneInput] = useState("");
  const [zone, setZone] = useState("");
  const [data, setData] = useState<Matrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [cell, setCell] = useState<MatrixCell | null>(null);
  const [cellRisks, setCellRisks] = useState<Risk[]>([]);
  const [cellLoading, setCellLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const h = setTimeout(() => setZone(zoneInput.trim()), 400);
    return () => clearTimeout(h);
  }, [zoneInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData((await risksApi.matrix({ status, zone })).data);
    } catch {
      toast({ title: t("risks.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [status, zone, t, toast]);

  useEffect(() => {
    setCell(null);
    load();
  }, [load]);

  const byKey = useMemo(() => {
    const m = new Map<string, MatrixCell>();
    data?.cells.forEach((c) => m.set(`${c.gravity}-${c.probability}`, c));
    return m;
  }, [data]);

  const openCell = async (c: MatrixCell) => {
    setCell(c);
    setCellRisks([]);
    if (c.riskIds.length === 0) return;
    setCellLoading(true);
    try {
      const res = await Promise.all(c.riskIds.slice(0, 50).map((id) => risksApi.get(id)));
      setCellRisks(res.map((r) => r.data));
    } catch {
      toast({ title: t("risks.loadError"), variant: "destructive" });
    } finally {
      setCellLoading(false);
    }
  };

  return (
    <PageShell title={t("risks.title")} subtitle={t("risks.matrix.subtitle")}>
      <SectionTabs tabs={riskTabs(t)} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RISK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`risks.statuses.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="w-48"
          value={zoneInput}
          onChange={(e) => setZoneInput(e.target.value)}
          placeholder={t("risks.fields.zone")}
        />
        {data && (
          <span className="text-sm text-gray-600">{t("risks.matrix.total", { count: data.total })}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            {loading || !data ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
              </div>
            ) : (
              <div className="flex gap-2" dir="ltr">
                <div className="flex w-6 items-center justify-center">
                  <span className="-rotate-90 whitespace-nowrap text-xs font-semibold text-gray-500">
                    {t("risks.fields.gravity")}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-[1.5rem_repeat(5,1fr)] gap-1">
                    {[...AXIS].reverse().map((g) => (
                      <div key={g} className="contents">
                        <div className="flex items-center justify-center text-xs text-gray-500">{g}</div>
                        {AXIS.map((p) => {
                          const c = byKey.get(`${g}-${p}`);
                          const level = c?.level ?? "low";
                          const active = cell?.gravity === g && cell?.probability === p;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => c && openCell(c)}
                              className={`flex aspect-square flex-col items-center justify-center rounded-md text-sm transition ${cellClasses[level]} ${
                                active ? "ring-2 ring-prosafe-700 ring-offset-1" : ""
                              }`}
                              title={`${g} x ${p} = ${g * p}`}
                            >
                              <span className="text-[10px] opacity-70">{g * p}</span>
                              <span className="text-lg font-bold">{c?.count ?? 0}</span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                    <div />
                    {AXIS.map((p) => (
                      <div key={p} className="text-center text-xs text-gray-500">
                        {p}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 text-center text-xs font-semibold text-gray-500">
                    {t("risks.fields.probability")}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {(["low", "medium", "high", "critical"] as const).map((l) => (
                <LevelBadge key={l} level={l} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {cell
                ? t("risks.matrix.cellTitle", { g: cell.gravity, p: cell.probability, score: cell.score })
                : t("risks.matrix.pick")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!cell ? (
              <p className="text-sm text-gray-500">{t("risks.matrix.pickHint")}</p>
            ) : cellLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-prosafe-600" />
            ) : cellRisks.length === 0 ? (
              <p className="text-sm text-gray-500">{t("risks.matrix.emptyCell")}</p>
            ) : (
              <ul className="space-y-2">
                {cellRisks.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(r.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-start hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{r.title}</div>
                        <div className="text-xs text-gray-500">
                          {r.hazardCategory}
                          {r.zone ? ` · ${r.zone}` : ""}
                        </div>
                      </div>
                      <Badge variant="outline">{t(`risks.statuses.${r.status}`)}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <RiskDetailSheet
        riskId={selected}
        onClose={() => setSelected(null)}
        onChanged={() => {
          load();
          if (cell) openCell(cell);
        }}
      />
    </PageShell>
  );
};

export default RiskMatrix;
