import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Training, TrainingRole, trainingApi } from "@/services/trainingApi";
import { ManagerPage, apiErrorMessage } from "@/components/manager/ManagerPage";
import { trainingNav } from "@/components/manager/links";

const ROLES: TrainingRole[] = ["employee", "sst_manager", "admin"];

interface Form {
  title: string;
  description: string;
  category: string;
  durationHours: string;
  validityMonths: string;
  mandatoryForRoles: TrainingRole[];
  isActive: boolean;
}
const emptyForm: Form = {
  title: "",
  description: "",
  category: "",
  durationHours: "",
  validityMonths: "",
  mandatoryForRoles: [],
  isActive: true,
};

const TrainingCatalogue = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Training | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Training | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await trainingApi.list({ limit: 100, search: search.trim() || undefined });
      setRows(res.data.data);
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("trainings.errors.load")), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, t, toast]);

  useEffect(() => {
    const h = setTimeout(load, 300);
    return () => clearTimeout(h);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (tr: Training) => {
    setEditing(tr);
    setForm({
      title: tr.title,
      description: tr.description ?? "",
      category: tr.category ?? "",
      durationHours: tr.durationHours != null ? String(tr.durationHours) : "",
      validityMonths: tr.validityMonths != null ? String(tr.validityMonths) : "",
      mandatoryForRoles: tr.mandatoryForRoles ?? [],
      isActive: tr.isActive,
    });
    setOpen(true);
  };

  const toggleRole = (r: TrainingRole, on: boolean) =>
    setForm((f) => ({
      ...f,
      mandatoryForRoles: on
        ? [...f.mandatoryForRoles, r]
        : f.mandatoryForRoles.filter((x) => x !== r),
    }));

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: t("common.error"), description: t("trainings.errors.titleRequired"), variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description,
      category: form.category || undefined,
      durationHours: form.durationHours !== "" ? Number(form.durationHours) : undefined,
      validityMonths: form.validityMonths !== "" ? Number(form.validityMonths) : undefined,
      mandatoryForRoles: form.mandatoryForRoles,
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (editing) await trainingApi.update(editing.id, payload);
      else await trainingApi.create(payload);
      toast({ title: t("trainings.saved") });
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("trainings.errors.save")), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await trainingApi.remove(toDelete.id);
      toast({ title: t("trainings.deleted") });
      setToDelete(null);
      load();
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      toast({
        title: t("common.error"),
        description: status === 409 ? t("trainings.errors.hasEnrollments") : apiErrorMessage(e, t("trainings.errors.delete")),
        variant: "destructive",
      });
      setToDelete(null);
    }
  };

  return (
    <ManagerPage
      title={t("trainings.title")}
      subtitle={t("trainings.subtitle")}
      nav={trainingNav(t)}
      actions={
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t("trainings.add")}
        </Button>
      }
    >
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input
            className="max-w-sm"
            placeholder={t("trainings.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("trainings.fields.title")}</TableHead>
                  <TableHead>{t("trainings.fields.category")}</TableHead>
                  <TableHead>{t("trainings.fields.durationHours")}</TableHead>
                  <TableHead>{t("trainings.fields.validityMonths")}</TableHead>
                  <TableHead>{t("trainings.fields.mandatoryForRoles")}</TableHead>
                  <TableHead>{t("trainings.fields.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("trainings.empty")}</TableCell></TableRow>
                ) : (
                  rows.map((tr) => (
                    <TableRow key={tr.id}>
                      <TableCell>
                        <div className="font-medium">{tr.title}</div>
                        {tr.description && (
                          <div className="text-xs text-muted-foreground max-w-xs truncate">{tr.description}</div>
                        )}
                      </TableCell>
                      <TableCell>{tr.category ?? "—"}</TableCell>
                      <TableCell>{tr.durationHours ?? "—"}</TableCell>
                      <TableCell>{tr.validityMonths ?? t("trainings.noExpiry")}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(tr.mandatoryForRoles ?? []).length === 0
                            ? "—"
                            : tr.mandatoryForRoles.map((r) => (
                                <Badge key={r} variant="outline" className="bg-orange-50 text-orange-800">
                                  {t(`trainings.roles.${r}`)}
                                </Badge>
                              ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tr.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                          {tr.isActive ? t("trainings.active") : t("trainings.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" aria-label={t("common.edit")} onClick={() => openEdit(tr)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={t("common.delete")} onClick={() => setToDelete(tr)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("trainings.edit") : t("trainings.add")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>{t("trainings.fields.title")} *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{t("trainings.fields.description")}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>{t("trainings.fields.category")}</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{t("trainings.fields.durationHours")}</Label>
                <Input type="number" min={0} step="0.5" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{t("trainings.fields.validityMonths")}</Label>
                <Input type="number" min={1} value={form.validityMonths} onChange={(e) => setForm({ ...form, validityMonths: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("trainings.fields.mandatoryForRoles")}</Label>
              <div className="flex flex-wrap gap-4">
                {ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.mandatoryForRoles.includes(r)}
                      onCheckedChange={(c) => toggleRole(r, c === true)}
                    />
                    {t(`trainings.roles.${r}`)}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isActive} onCheckedChange={(c) => setForm({ ...form, isActive: c })} />
              {t("trainings.active")}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save} disabled={saving}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("trainings.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("trainings.deleteConfirm", { name: toDelete?.title })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ManagerPage>
  );
};

export default TrainingCatalogue;
