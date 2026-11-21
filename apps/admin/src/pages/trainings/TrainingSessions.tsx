import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Ban, CalendarPlus, Pencil, Trash2, Users } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Enrollment,
  EnrollmentStatus,
  PickableUser,
  SessionStatus,
  Training,
  TrainingSession,
  fetchEnrollableUsers,
  trainingApi,
} from "@/services/trainingApi";
import {
  ManagerPage,
  apiErrorMessage,
  fmtDateTime,
  toDateTimeInput,
} from "@/components/manager/ManagerPage";
import { trainingNav } from "@/components/manager/links";

const SESSION_STATUSES: SessionStatus[] = ["planned", "ongoing", "completed", "cancelled"];
const ENROLL_STATUSES: EnrollmentStatus[] = ["registered", "attended", "passed", "failed", "cancelled"];

const sessionCls: Record<SessionStatus, string> = {
  planned: "bg-blue-100 text-blue-800",
  ongoing: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

interface Form {
  trainingId: string;
  startAt: string;
  endAt: string;
  location: string;
  trainer: string;
  capacity: string;
  status: SessionStatus;
}
const emptyForm: Form = {
  trainingId: "",
  startAt: "",
  endAt: "",
  location: "",
  trainer: "",
  capacity: "",
  status: "planned",
};

const TrainingSessions = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<TrainingSession[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [fTraining, setFTraining] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingSession | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<TrainingSession | null>(null);
  const [toCancel, setToCancel] = useState<TrainingSession | null>(null);
  const [drawer, setDrawer] = useState<TrainingSession | null>(null);

  const fail = useCallback(
    (e: unknown, key: string) =>
      toast({ title: t("common.error"), description: apiErrorMessage(e, t(key)), variant: "destructive" }),
    [t, toast]
  );

  useEffect(() => {
    trainingApi
      .list({ limit: 100 })
      .then((r) => setTrainings(r.data.data))
      .catch((e) => fail(e, "trainings.errors.load"));
  }, [fail]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await trainingApi.listSessions({
        trainingId: fTraining === "all" ? undefined : Number(fTraining),
        status: fStatus,
        limit: 100,
      });
      setRows(res.data.data);
    } catch (e) {
      fail(e, "sessions.errors.load");
    } finally {
      setLoading(false);
    }
  }, [fTraining, fStatus, fail]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (s: TrainingSession) => {
    setEditing(s);
    setForm({
      trainingId: String(s.trainingId),
      startAt: toDateTimeInput(s.startAt),
      endAt: toDateTimeInput(s.endAt),
      location: s.location ?? "",
      trainer: s.trainer ?? "",
      capacity: s.capacity != null ? String(s.capacity) : "",
      status: s.status,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.trainingId || !form.startAt) {
      toast({ title: t("common.error"), description: t("sessions.errors.required"), variant: "destructive" });
      return;
    }
    const payload = {
      startAt: new Date(form.startAt).toISOString(),
      endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
      location: form.location || undefined,
      trainer: form.trainer || undefined,
      capacity: form.capacity !== "" ? Number(form.capacity) : undefined,
      status: form.status,
    };
    setSaving(true);
    try {
      if (editing) await trainingApi.updateSession(editing.id, payload);
      else await trainingApi.createSession({ ...payload, trainingId: Number(form.trainingId) });
      toast({ title: t("sessions.saved") });
      setOpen(false);
      load();
    } catch (e) {
      fail(e, "sessions.errors.save");
    } finally {
      setSaving(false);
    }
  };

  const confirmCancel = async () => {
    if (!toCancel) return;
    try {
      await trainingApi.updateSession(toCancel.id, { status: "cancelled" });
      toast({ title: t("sessions.cancelled") });
      load();
    } catch (e) {
      fail(e, "sessions.errors.save");
    }
    setToCancel(null);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await trainingApi.deleteSession(toDelete.id);
      toast({ title: t("sessions.deleted") });
      load();
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      toast({
        title: t("common.error"),
        description: status === 409 ? t("sessions.errors.hasEnrollments") : apiErrorMessage(e, t("sessions.errors.delete")),
        variant: "destructive",
      });
    }
    setToDelete(null);
  };

  return (
    <ManagerPage
      title={t("sessions.title")}
      subtitle={t("sessions.subtitle")}
      nav={trainingNav(t)}
      actions={
        <Button onClick={openCreate}>
          <CalendarPlus className="h-4 w-4 mr-2" />
          {t("sessions.add")}
        </Button>
      }
    >
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={fTraining} onValueChange={setFTraining}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("sessions.allTrainings")}</SelectItem>
                {trainings.map((tr) => (
                  <SelectItem key={tr.id} value={String(tr.id)}>{tr.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("sessions.allStatuses")}</SelectItem>
                {SESSION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{t(`sessions.status.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("sessions.fields.training")}</TableHead>
                  <TableHead>{t("sessions.fields.startAt")}</TableHead>
                  <TableHead>{t("sessions.fields.location")}</TableHead>
                  <TableHead>{t("sessions.fields.trainer")}</TableHead>
                  <TableHead>{t("sessions.fields.enrolled")}</TableHead>
                  <TableHead>{t("sessions.fields.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("sessions.empty")}</TableCell></TableRow>
                ) : (
                  rows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.training?.title ?? `#${s.trainingId}`}</TableCell>
                      <TableCell>{fmtDateTime(s.startAt)}</TableCell>
                      <TableCell>{s.location ?? "—"}</TableCell>
                      <TableCell>{s.trainer ?? "—"}</TableCell>
                      <TableCell>
                        <span className={s.capacity != null && s.enrolledCount >= s.capacity ? "text-orange-600 font-medium" : ""}>
                          {s.enrolledCount}{s.capacity != null ? ` / ${s.capacity}` : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={sessionCls[s.status]}>{t(`sessions.status.${s.status}`)}</Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" aria-label={t("sessions.enrollments")} onClick={() => setDrawer(s)}>
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={t("common.edit")} onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {s.status !== "cancelled" && s.status !== "completed" && (
                          <Button variant="ghost" size="icon" aria-label={t("sessions.cancel")} onClick={() => setToCancel(s)}>
                            <Ban className="h-4 w-4 text-orange-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" aria-label={t("common.delete")} onClick={() => setToDelete(s)}>
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? t("sessions.edit") : t("sessions.add")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>{t("sessions.fields.training")} *</Label>
              <Select value={form.trainingId} onValueChange={(v) => setForm({ ...form, trainingId: v })} disabled={!!editing}>
                <SelectTrigger><SelectValue placeholder={t("sessions.pickTraining")} /></SelectTrigger>
                <SelectContent>
                  {trainings.filter((tr) => tr.isActive || tr.id === editing?.trainingId).map((tr) => (
                    <SelectItem key={tr.id} value={String(tr.id)}>{tr.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("sessions.fields.startAt")} *</Label>
              <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{t("sessions.fields.endAt")}</Label>
              <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{t("sessions.fields.location")}</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{t("sessions.fields.trainer")}</Label>
              <Input value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{t("sessions.fields.capacity")}</Label>
              <Input type="number" min={1} placeholder={t("sessions.unlimited")} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{t("sessions.fields.status")}</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SessionStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SESSION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{t(`sessions.status.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save} disabled={saving}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toCancel} onOpenChange={(o) => !o && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sessions.cancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("sessions.cancelConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.no")}</AlertDialogCancel>
            <AlertDialogAction className="bg-orange-600 hover:bg-orange-700" onClick={confirmCancel}>{t("sessions.cancel")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sessions.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("sessions.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EnrollmentsDrawer session={drawer} onClose={() => setDrawer(null)} onChanged={load} />
    </ManagerPage>
  );
};

interface DrawerProps {
  session: TrainingSession | null;
  onClose: () => void;
  onChanged: () => void;
}

const EnrollmentsDrawer = ({ session, onClose, onChanged }: DrawerProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<PickableUser[]>([]);
  const [userId, setUserId] = useState("");
  const [edits, setEdits] = useState<Record<number, { status: EnrollmentStatus; score: string; progress: string }>>({});

  const fail = useCallback(
    (e: unknown, key: string) =>
      toast({ title: t("common.error"), description: apiErrorMessage(e, t(key)), variant: "destructive" }),
    [t, toast]
  );

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await trainingApi.listEnrollments(session.id);
      setRows(res.data.data);
      const m: typeof edits = {};
      res.data.data.forEach((e) => {
        m[e.id] = {
          status: e.status,
          score: e.score != null ? String(e.score) : "",
          progress: String(e.progress ?? 0),
        };
      });
      setEdits(m);
    } catch (e) {
      fail(e, "sessions.errors.loadEnrollments");
    } finally {
      setLoading(false);
    }
  }, [session, fail]);

  useEffect(() => {
    if (!session) return;
    setUserId("");
    load();
    fetchEnrollableUsers()
      .then(setUsers)
      .catch((e) => fail(e, "sessions.errors.loadUsers"));
  }, [session, load, fail]);

  const enrolledIds = new Set(rows.filter((r) => r.status !== "cancelled").map((r) => r.userId));
  const available = users.filter((u) => !enrolledIds.has(u.id));

  const enroll = async () => {
    if (!session || !userId) return;
    try {
      await trainingApi.enroll(session.id, Number(userId));
      toast({ title: t("sessions.enrolled") });
      setUserId("");
      load();
      onChanged();
    } catch (e) {
      fail(e, "sessions.errors.enroll");
    }
  };

  const saveRow = async (id: number) => {
    const ed = edits[id];
    if (!ed) return;
    const progress = Math.min(100, Math.max(0, Number(ed.progress) || 0));
    try {
      await trainingApi.updateEnrollment(id, {
        status: ed.status,
        progress,
        score: ed.score !== "" ? Number(ed.score) : undefined,
      });
      toast({ title: t("sessions.enrollmentSaved") });
      load();
      onChanged();
    } catch (e) {
      fail(e, "sessions.errors.save");
    }
  };

  const setEdit = (id: number, patch: Partial<{ status: EnrollmentStatus; score: string; progress: string }>) =>
    setEdits((m) => ({ ...m, [id]: { ...m[id], ...patch } }));

  return (
    <Sheet open={!!session} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("sessions.enrollments")}</SheetTitle>
          <SheetDescription>
            {session?.training?.title} · {fmtDateTime(session?.startAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex gap-2">
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger><SelectValue placeholder={t("sessions.pickUser")} /></SelectTrigger>
            <SelectContent>
              {available.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.firstName} {u.lastName}{u.department ? ` (${u.department})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={enroll} disabled={!userId}>{t("sessions.enroll")}</Button>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-muted-foreground">{t("common.loading")}</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">{t("sessions.noEnrollments")}</p>
          ) : (
            rows.map((e) => {
              const ed = edits[e.id];
              if (!ed) return null;
              return (
                <div key={e.id} className="rounded-md border p-3 space-y-2">
                  <div className="font-medium">
                    {e.user ? `${e.user.firstName} ${e.user.lastName}` : `#${e.userId}`}
                    {e.user?.department && <span className="text-muted-foreground font-normal"> · {e.user.department}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("sessions.fields.status")}</Label>
                      <Select value={ed.status} onValueChange={(v) => setEdit(e.id, { status: v as EnrollmentStatus })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ENROLL_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{t(`sessions.enrollmentStatus.${s}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("sessions.fields.score")}</Label>
                      <Input type="number" min={0} max={100} value={ed.score} onChange={(ev) => setEdit(e.id, { score: ev.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("sessions.fields.progress")}</Label>
                      <Input type="number" min={0} max={100} value={ed.progress} onChange={(ev) => setEdit(e.id, { progress: ev.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {e.expiresAt ? t("sessions.expiresAt", { date: new Date(e.expiresAt).toLocaleDateString() }) : ""}
                    </span>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => saveRow(e.id)}>
                      {t("common.save")}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TrainingSessions;
