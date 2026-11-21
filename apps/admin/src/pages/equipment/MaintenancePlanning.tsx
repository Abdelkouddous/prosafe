import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarPlus, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem, inventoryApi } from "@/services/inventoryApi";
import {
  Maintenance,
  MaintenanceResult,
  MaintenanceType,
  maintenanceApi,
} from "@/services/maintenanceApi";
import {
  ManagerPage,
  apiErrorMessage,
  fmtDate,
} from "@/components/manager/ManagerPage";
import { equipmentNav } from "@/components/manager/links";

const TYPES: MaintenanceType[] = ["inspection", "preventive", "corrective"];
const RESULTS: MaintenanceResult[] = ["ok", "issues", "failed"];

const weekStart = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
};
const isoDay = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const MaintenancePlanning = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [cItem, setCItem] = useState("");
  const [cType, setCType] = useState<MaintenanceType>("inspection");
  const [cDate, setCDate] = useState(isoDay(new Date()));
  const [cNotes, setCNotes] = useState("");

  const [completing, setCompleting] = useState<Maintenance | null>(null);
  const [rResult, setRResult] = useState<MaintenanceResult>("ok");
  const [rNotes, setRNotes] = useState("");
  const [rDoneAt, setRDoneAt] = useState(isoDay(new Date()));
  const [rNext, setRNext] = useState("");
  const [busy, setBusy] = useState(false);

  const fail = useCallback(
    (e: unknown, key: string) =>
      toast({
        title: t("common.error"),
        description: apiErrorMessage(e, t(key)),
        variant: "destructive",
      }),
    [t, toast]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [planned, overdue] = await Promise.all([
        maintenanceApi.list({ status: "planned", limit: 100 }),
        maintenanceApi.list({ status: "overdue", limit: 100 }),
      ]);
      setRows([...overdue.data.data, ...planned.data.data]);
    } catch (e) {
      fail(e, "maintenance.errors.load");
    } finally {
      setLoading(false);
    }
  }, [fail]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = async () => {
    setCItem("");
    setCType("inspection");
    setCDate(isoDay(new Date()));
    setCNotes("");
    setCreateOpen(true);
    if (items.length === 0) {
      try {
        const res = await inventoryApi.getItems({ limit: 100 });
        setItems(res.data.data ?? res.data.items ?? []);
      } catch (e) {
        fail(e, "equipment.errors.load");
      }
    }
  };

  const create = async () => {
    if (!cItem || !cDate) {
      toast({ title: t("common.error"), description: t("maintenance.errors.required"), variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await maintenanceApi.create({
        itemId: Number(cItem),
        type: cType,
        scheduledAt: cDate,
        notes: cNotes || undefined,
      });
      toast({ title: t("maintenance.created") });
      setCreateOpen(false);
      load();
    } catch (e) {
      fail(e, "maintenance.errors.save");
    } finally {
      setBusy(false);
    }
  };

  const openComplete = (m: Maintenance) => {
    setCompleting(m);
    setRResult("ok");
    setRNotes("");
    setRDoneAt(isoDay(new Date()));
    setRNext("");
  };

  const complete = async () => {
    if (!completing) return;
    setBusy(true);
    try {
      await maintenanceApi.complete(completing.id, {
        result: rResult,
        notes: rNotes || undefined,
        doneAt: rDoneAt || undefined,
        nextScheduledAt: rNext || undefined,
      });
      toast({ title: t("maintenance.completed") });
      setCompleting(null);
      load();
    } catch (e) {
      fail(e, "maintenance.errors.save");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (m: Maintenance) => {
    try {
      await maintenanceApi.update(m.id, { status: "cancelled" });
      toast({ title: t("maintenance.cancelled") });
      load();
    } catch (e) {
      fail(e, "maintenance.errors.save");
    }
  };

  const overdue = rows.filter((r) => r.status === "overdue");
  const groups = useMemo(() => {
    const map = new Map<string, Maintenance[]>();
    rows
      .filter((r) => r.status !== "overdue")
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .forEach((r) => {
        const key = isoDay(weekStart(new Date(r.scheduledAt)));
        map.set(key, [...(map.get(key) ?? []), r]);
      });
    return Array.from(map.entries());
  }, [rows]);

  const renderRow = (m: Maintenance) => (
    <div
      key={m.id}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 ${
        m.status === "overdue" ? "border-red-300 bg-red-50" : "bg-white"
      }`}
    >
      <div>
        <div className="font-medium">
          {m.item?.name ?? `#${m.itemId}`}
          {m.item?.condition === "non_functional" && (
            <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
              {t("equipment.condition.non_functional")}
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {t(`maintenance.type.${m.type}`)} · {fmtDate(m.scheduledAt)}
          {m.item?.location ? ` · ${m.item.location}` : ""}
        </div>
        {m.notes && <div className="text-sm mt-1">{m.notes}</div>}
      </div>
      <div className="flex items-center gap-2">
        {m.status === "overdue" && (
          <Badge className="bg-red-600 hover:bg-red-600">{t("maintenance.status.overdue")}</Badge>
        )}
        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openComplete(m)}>
          <CheckCircle2 className="h-4 w-4 mr-1" />
          {t("maintenance.complete")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => cancel(m)}>
          <XCircle className="h-4 w-4 mr-1" />
          {t("maintenance.cancel")}
        </Button>
      </div>
    </div>
  );

  return (
    <ManagerPage
      title={t("maintenance.title")}
      subtitle={t("maintenance.subtitle")}
      nav={equipmentNav(t)}
      actions={
        <Button onClick={openCreate}>
          <CalendarPlus className="h-4 w-4 mr-2" />
          {t("maintenance.add")}
        </Button>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">{t("maintenance.empty")}</p>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <Card className="border-red-300">
              <CardHeader>
                <CardTitle className="text-red-700 text-lg">
                  {t("maintenance.overdueSection", { count: overdue.length })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">{overdue.map(renderRow)}</CardContent>
            </Card>
          )}
          {groups.map(([start, list]) => {
            const s = new Date(start + "T00:00:00");
            const e = new Date(s);
            e.setDate(e.getDate() + 6);
            return (
              <Card key={start}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("maintenance.week", { from: fmtDate(s.toISOString()), to: fmtDate(e.toISOString()) })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">{list.map(renderRow)}</CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("maintenance.add")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>{t("maintenance.fields.item")} *</Label>
              <Select value={cItem} onValueChange={setCItem}>
                <SelectTrigger><SelectValue placeholder={t("maintenance.pickItem")} /></SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name}{i.location ? ` (${i.location})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("maintenance.fields.type")}</Label>
                <Select value={cType} onValueChange={(v) => setCType(v as MaintenanceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((x) => (
                      <SelectItem key={x} value={x}>{t(`maintenance.type.${x}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("maintenance.fields.scheduledAt")} *</Label>
                <Input type="date" value={cDate} onChange={(e) => setCDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("maintenance.fields.notes")}</Label>
              <Textarea value={cNotes} onChange={(e) => setCNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={create} disabled={busy}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!completing} onOpenChange={(o) => !o && setCompleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("maintenance.complete")} — {completing?.item?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("maintenance.fields.result")}</Label>
                <Select value={rResult} onValueChange={(v) => setRResult(v as MaintenanceResult)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESULTS.map((x) => (
                      <SelectItem key={x} value={x}>{t(`maintenance.result.${x}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("maintenance.fields.doneAt")}</Label>
                <Input type="date" value={rDoneAt} onChange={(e) => setRDoneAt(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t(`maintenance.resultHint.${rResult}`)}</p>
            <div className="space-y-1">
              <Label>{t("maintenance.fields.notes")}</Label>
              <Textarea value={rNotes} onChange={(e) => setRNotes(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("maintenance.fields.nextScheduledAt")}</Label>
              <Input type="date" value={rNext} onChange={(e) => setRNext(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleting(null)}>{t("common.cancel")}</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={complete} disabled={busy}>
              {t("maintenance.complete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerPage>
  );
};

export default MaintenancePlanning;
