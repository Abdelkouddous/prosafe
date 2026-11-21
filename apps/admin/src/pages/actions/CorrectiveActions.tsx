import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Trash2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import UserPicker from "@/components/UserPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  correctiveActionApi,
  isOverdue,
  type ActionStatus,
  type CorrectiveAction,
} from "@/services/correctiveActionApi";

const ALL = "all";
const COLUMNS: ActionStatus[] = ["todo", "in_progress", "done"];
const columnTone: Record<string, string> = {
  todo: "border-t-orange-500",
  in_progress: "border-t-blue-500",
  done: "border-t-green-500",
};

const CorrectiveActions = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [items, setItems] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(ALL);
  const [ownerId, setOwnerId] = useState<number | undefined>();
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await correctiveActionApi.list({
        sourceType: source === ALL ? undefined : source,
        ownerId,
        limit: 100,
      });
      setItems(res.data.data);
    } catch {
      toast({ title: t("actions.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [source, ownerId, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (onlyOverdue ? items.filter(isOverdue) : items),
    [items, onlyOverdue]
  );
  const overdueCount = useMemo(() => items.filter(isOverdue).length, [items]);

  const move = async (a: CorrectiveAction, status: ActionStatus) => {
    try {
      await correctiveActionApi.update(a.id, { status });
      load();
    } catch {
      toast({ title: t("actions.saveError"), variant: "destructive" });
    }
  };

  const remove = async (a: CorrectiveAction) => {
    if (!window.confirm(t("actions.confirmDelete"))) return;
    try {
      await correctiveActionApi.remove(a.id);
      load();
    } catch {
      toast({ title: t("actions.saveError"), variant: "destructive" });
    }
  };

  return (
    <PageShell title={t("actions.pageTitle")} subtitle={t("actions.pageSubtitle")}>
      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>{t("actions.source")}</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("actions.allSources")}</SelectItem>
                {(["incident", "risk", "audit"] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`actions.sources.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("actions.owner")}</Label>
            <UserPicker value={ownerId} onChange={setOwnerId} allLabel={t("actions.allOwners")} />
          </div>
          <div className="flex items-end">
            <Button
              variant={onlyOverdue ? "default" : "outline"}
              className={onlyOverdue ? "bg-red-600 hover:bg-red-700" : "border-red-300 text-red-700"}
              onClick={() => setOnlyOverdue((v) => !v)}
            >
              {t("actions.overdue")} ({overdueCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colItems = visible.filter((a) => a.status === col);
            return (
              <Card key={col} className={`border-t-4 ${columnTone[col]}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    {t(`actions.statuses.${col}`)}
                    <Badge variant="outline">{colItems.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {colItems.length === 0 && (
                    <p className="py-4 text-center text-sm text-gray-400">{t("actions.empty")}</p>
                  )}
                  {colItems.map((a) => {
                    const overdue = isOverdue(a);
                    return (
                      <div
                        key={a.id}
                        className={`rounded-lg border p-3 ${overdue ? "border-red-300 bg-red-50" : "bg-white"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium">{a.title}</div>
                          <button
                            type="button"
                            aria-label={t("common.delete")}
                            onClick={() => remove(a)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {a.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-gray-600">{a.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <Badge variant="outline">
                            {t(`actions.sources.${a.sourceType}`)} #{a.sourceId}
                          </Badge>
                          <span>
                            {a.owner
                              ? `${a.owner.firstName} ${a.owner.lastName}`
                              : t("actions.unassigned")}
                          </span>
                          {a.dueDate && (
                            <span className={overdue ? "font-semibold text-red-600" : ""}>
                              {new Date(a.dueDate).toLocaleDateString(i18n.language)}
                              {overdue && ` (${t("actions.overdue")})`}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <Select value={a.status} onValueChange={(v) => move(a, v as ActionStatus)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(["todo", "in_progress", "done", "cancelled"] as ActionStatus[]).map(
                                (s) => (
                                  <SelectItem key={s} value={s}>
                                    {t(`actions.statuses.${s}`)}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default CorrectiveActions;
