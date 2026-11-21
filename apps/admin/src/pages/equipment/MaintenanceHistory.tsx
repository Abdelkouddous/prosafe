import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem, inventoryApi } from "@/services/inventoryApi";
import { Maintenance, maintenanceApi } from "@/services/maintenanceApi";
import {
  ManagerPage,
  apiErrorMessage,
  fmtDate,
} from "@/components/manager/ManagerPage";
import { equipmentNav } from "@/components/manager/links";

const LIMIT = 15;

const MaintenanceHistory = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<Maintenance[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemId, setItemId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    inventoryApi
      .getItems({ limit: 100 })
      .then((r) => setItems(r.data.data ?? r.data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await maintenanceApi.list({
        status: "done",
        itemId: itemId === "all" ? undefined : Number(itemId),
        from: from || undefined,
        to: to || undefined,
        page,
        limit: LIMIT,
      });
      setRows(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      toast({
        title: t("common.error"),
        description: apiErrorMessage(e, t("maintenance.errors.load")),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [itemId, from, to, page, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const resultCls: Record<string, string> = {
    ok: "bg-green-100 text-green-800",
    issues: "bg-orange-100 text-orange-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <ManagerPage
      title={t("history.title")}
      subtitle={t("history.subtitle")}
      nav={equipmentNav(t)}
    >
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label>{t("maintenance.fields.item")}</Label>
              <Select value={itemId} onValueChange={(v) => { setItemId(v); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("history.allItems")}</SelectItem>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("history.from")}</Label>
              <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1">
              <Label>{t("history.to")}</Label>
              <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("maintenance.fields.item")}</TableHead>
                  <TableHead>{t("maintenance.fields.type")}</TableHead>
                  <TableHead>{t("maintenance.fields.scheduledAt")}</TableHead>
                  <TableHead>{t("maintenance.fields.doneAt")}</TableHead>
                  <TableHead>{t("maintenance.fields.result")}</TableHead>
                  <TableHead>{t("history.performedBy")}</TableHead>
                  <TableHead>{t("maintenance.fields.notes")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("history.empty")}</TableCell></TableRow>
                ) : (
                  rows.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.item?.name ?? `#${m.itemId}`}</TableCell>
                      <TableCell>{t(`maintenance.type.${m.type}`)}</TableCell>
                      <TableCell>{fmtDate(m.scheduledAt)}</TableCell>
                      <TableCell>{fmtDate(m.doneAt)}</TableCell>
                      <TableCell>
                        {m.result && (
                          <Badge variant="outline" className={resultCls[m.result]}>
                            {t(`maintenance.result.${m.result}`)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.performedBy ? `${m.performedBy.firstName} ${m.performedBy.lastName}` : "—"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{m.notes ?? ""}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("common.totalCount", { count: total })}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
              <span>{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </ManagerPage>
  );
};

export default MaintenanceHistory;
