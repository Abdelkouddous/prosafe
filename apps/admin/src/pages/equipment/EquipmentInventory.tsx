import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, ChevronLeft, ChevronRight, Minus, Pencil, Plus, Trash2 } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  INVENTORY_CATEGORIES,
  INVENTORY_STATUSES,
  InventoryItem,
  InventoryPayload,
  InventoryStats,
  inventoryApi,
} from "@/services/inventoryApi";
import {
  ManagerPage,
  apiErrorMessage,
  fmtDate,
  toDateInput,
} from "@/components/manager/ManagerPage";
import { equipmentNav } from "@/components/manager/links";

const LIMIT = 10;
const DAY = 86400000;

const emptyForm = (): InventoryPayload => ({
  name: "",
  sku: "",
  description: "",
  price: 0,
  quantity: 0,
  min_stock_level: 1,
  category: "other",
  status: "active",
  condition: "functional",
  expiryDate: "",
  lastInspectionAt: "",
  nextInspectionAt: "",
  supplier: "",
  location: "",
});

const EquipmentInventory = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [condition, setCondition] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<InventoryPayload>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const h = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(h);
  }, [searchInput]);

  const loadStats = useCallback(async () => {
    try {
      setStats((await inventoryApi.getStats()).data);
    } catch {
      setStats(null);
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getItems({
        page,
        limit: LIMIT,
        category,
        status,
        condition,
        search,
      });
      setItems(res.data.data ?? res.data.items ?? []);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages || 1);
    } catch (e) {
      toast({
        title: t("common.error"),
        description: apiErrorMessage(e, t("equipment.errors.load")),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, category, status, condition, search, t, toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const refresh = () => {
    loadItems();
    loadStats();
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };
  const openEdit = (it: InventoryItem) => {
    setEditing(it);
    setForm({
      name: it.name,
      sku: it.sku,
      description: it.description,
      price: Number(it.price),
      quantity: it.quantity,
      min_stock_level: it.min_stock_level,
      category: it.category,
      status: it.status,
      condition: it.condition,
      expiryDate: toDateInput(it.expiryDate),
      lastInspectionAt: toDateInput(it.lastInspectionAt),
      nextInspectionAt: toDateInput(it.nextInspectionAt),
      supplier: it.supplier ?? "",
      location: it.location ?? "",
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast({
        title: t("common.error"),
        description: t("equipment.errors.required"),
        variant: "destructive",
      });
      return;
    }
    const payload: InventoryPayload = { ...form };
    (["expiryDate", "lastInspectionAt", "nextInspectionAt"] as const).forEach(
      (k) => {
        if (!payload[k]) delete payload[k];
      }
    );
    if (!payload.supplier) delete payload.supplier;
    if (!payload.location) delete payload.location;
    setSaving(true);
    try {
      if (editing) await inventoryApi.updateItem(editing.id, payload);
      else await inventoryApi.createItem(payload);
      toast({ title: t("equipment.saved") });
      setFormOpen(false);
      refresh();
    } catch (e) {
      toast({
        title: t("common.error"),
        description: apiErrorMessage(e, t("equipment.errors.save")),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const adjustStock = async (it: InventoryItem, delta: number) => {
    const quantity = Math.max(0, it.quantity + delta);
    if (quantity === it.quantity) return;
    try {
      await inventoryApi.updateItem(it.id, { quantity });
      refresh();
    } catch (e) {
      toast({
        title: t("common.error"),
        description: apiErrorMessage(e, t("equipment.errors.save")),
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await inventoryApi.deleteItem(toDelete.id);
      toast({ title: t("equipment.deleted") });
      setToDelete(null);
      refresh();
    } catch (e) {
      toast({
        title: t("common.error"),
        description: apiErrorMessage(e, t("equipment.errors.delete")),
        variant: "destructive",
      });
    }
  };

  const statusBadge = (s: string) => {
    const cls: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      low_stock: "bg-orange-100 text-orange-800",
      out_of_stock: "bg-red-100 text-red-800",
      inactive: "bg-gray-100 text-gray-700",
      discontinued: "bg-gray-100 text-gray-700",
    };
    return (
      <Badge variant="outline" className={cls[s] ?? ""}>
        {t(`equipment.status.${s}`)}
      </Badge>
    );
  };

  const expiryCell = (iso?: string | null) => {
    if (!iso) return <span className="text-muted-foreground">—</span>;
    const days = Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
    if (days < 0)
      return (
        <span className="text-red-600 font-medium">
          {fmtDate(iso)} · {t("equipment.expired")}
        </span>
      );
    if (days <= 30)
      return (
        <span className="text-orange-600 font-medium">
          {fmtDate(iso)} · {t("equipment.expiresIn", { count: days })}
        </span>
      );
    return <span>{fmtDate(iso)}</span>;
  };

  const set = <K extends keyof InventoryPayload>(k: K, v: InventoryPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const statCards = stats
    ? [
        { label: t("equipment.stats.total"), value: stats.totalItems, cls: "" },
        { label: t("equipment.stats.lowStock"), value: stats.lowStockItems, cls: "text-orange-600" },
        { label: t("equipment.stats.outOfStock"), value: stats.outOfStockItems, cls: "text-red-600" },
        { label: t("equipment.stats.nonFunctional"), value: stats.nonFunctionalItems, cls: "text-red-600" },
        { label: t("equipment.stats.value"), value: Number(stats.totalValue).toLocaleString(), cls: "" },
      ]
    : [];

  return (
    <ManagerPage
      title={t("equipment.title")}
      subtitle={t("equipment.subtitle")}
      nav={equipmentNav(t)}
      actions={
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t("equipment.add")}
        </Button>
      }
    >
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {statCards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${c.cls}`}>{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder={t("equipment.searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("equipment.allCategories")}</SelectItem>
                {INVENTORY_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{t(`equipment.category.${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("equipment.allStatuses")}</SelectItem>
                {INVENTORY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{t(`equipment.status.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={condition} onValueChange={(v) => { setCondition(v); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("equipment.allConditions")}</SelectItem>
                <SelectItem value="functional">{t("equipment.condition.functional")}</SelectItem>
                <SelectItem value="non_functional">{t("equipment.condition.non_functional")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("equipment.fields.name")}</TableHead>
                  <TableHead>{t("equipment.fields.category")}</TableHead>
                  <TableHead>{t("equipment.fields.quantity")}</TableHead>
                  <TableHead>{t("equipment.fields.status")}</TableHead>
                  <TableHead>{t("equipment.fields.condition")}</TableHead>
                  <TableHead>{t("equipment.fields.expiryDate")}</TableHead>
                  <TableHead>{t("equipment.fields.nextInspectionAt")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">{t("common.loading")}</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("equipment.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {it.sku}{it.location ? ` · ${it.location}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>{t(`equipment.category.${it.category}`)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline" size="icon" className="h-7 w-7"
                            aria-label={t("equipment.decrease")}
                            disabled={it.quantity <= 0}
                            onClick={() => adjustStock(it, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{it.quantity}</span>
                          <Button
                            variant="outline" size="icon" className="h-7 w-7"
                            aria-label={t("equipment.increase")}
                            onClick={() => adjustStock(it, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("equipment.min")}: {it.min_stock_level}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(it.status)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            it.condition === "functional"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {t(`equipment.condition.${it.condition}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{expiryCell(it.expiryDate)}</TableCell>
                      <TableCell>{fmtDate(it.nextInspectionAt)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" aria-label={t("common.edit")} onClick={() => openEdit(it)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" aria-label={t("common.delete")} onClick={() => setToDelete(it)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </TableCell>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("equipment.edit") : t("equipment.add")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("equipment.fields.name")} *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.sku")}</Label>
              <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>{t("equipment.fields.description")} *</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.category")}</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v as InventoryPayload["category"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVENTORY_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{t(`equipment.category.${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.status")}</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as InventoryPayload["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVENTORY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{t(`equipment.status.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.quantity")}</Label>
              <Input type="number" min={0} value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.min_stock_level")}</Label>
              <Input type="number" min={0} value={form.min_stock_level} onChange={(e) => set("min_stock_level", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.price")}</Label>
              <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.condition")}</Label>
              <Select value={form.condition} onValueChange={(v) => set("condition", v as InventoryPayload["condition"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="functional">{t("equipment.condition.functional")}</SelectItem>
                  <SelectItem value="non_functional">{t("equipment.condition.non_functional")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.expiryDate")}</Label>
              <Input type="date" value={form.expiryDate ?? ""} onChange={(e) => set("expiryDate", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.lastInspectionAt")}</Label>
              <Input type="date" value={form.lastInspectionAt ?? ""} onChange={(e) => set("lastInspectionAt", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.nextInspectionAt")}</Label>
              <Input type="date" value={form.nextInspectionAt ?? ""} onChange={(e) => set("nextInspectionAt", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.supplier")}</Label>
              <Input value={form.supplier ?? ""} onChange={(e) => set("supplier", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("equipment.fields.location")}</Label>
              <Input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save} disabled={saving}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("equipment.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("equipment.deleteConfirm", { name: toDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ManagerPage>
  );
};

export default EquipmentInventory;
