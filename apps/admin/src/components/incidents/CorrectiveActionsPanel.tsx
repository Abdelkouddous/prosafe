import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/components/ui/use-toast";
import UserPicker from "@/components/UserPicker";
import {
  ACTION_STATUSES,
  correctiveActionApi,
  isOverdue,
  type ActionSource,
  type ActionStatus,
  type CorrectiveAction,
} from "@/services/correctiveActionApi";

export const actionStatusClasses: Record<ActionStatus, string> = {
  todo: "bg-orange-100 text-orange-800 border-orange-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const CorrectiveActionsPanel = ({
  incidentId,
  sourceType = "incident",
  sourceId,
  actions,
  onChanged,
}: {
  incidentId?: number;
  sourceType?: ActionSource;
  sourceId?: number;
  actions: CorrectiveAction[];
  onChanged: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState<number | undefined>();
  const [dueDate, setDueDate] = useState("");

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await correctiveActionApi.create({
        sourceType,
        sourceId: (sourceId ?? incidentId) as number,
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(ownerId ? { ownerId } : {}),
        ...(dueDate ? { dueDate } : {}),
      });
      toast({ title: t("actions.created") });
      setAdding(false);
      setTitle("");
      setDescription("");
      setOwnerId(undefined);
      setDueDate("");
      onChanged();
    } catch {
      toast({ title: t("actions.saveError"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (a: CorrectiveAction, status: ActionStatus) => {
    try {
      await correctiveActionApi.update(a.id, { status });
      onChanged();
    } catch {
      toast({ title: t("actions.saveError"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase text-gray-500">
          {t("actions.title")}
        </div>
        <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
          <Plus className="me-1 h-4 w-4" />
          {t("actions.add")}
        </Button>
      </div>

      {adding && (
        <div className="space-y-2 rounded-lg border bg-gray-50 p-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("actions.titlePlaceholder")}
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("actions.description")}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{t("actions.owner")}</Label>
              <UserPicker value={ownerId} onChange={setOwnerId} />
            </div>
            <div>
              <Label>{t("actions.dueDate")}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <Button
            size="sm"
            onClick={create}
            disabled={!title.trim() || saving}
            className="bg-prosafe-600 hover:bg-prosafe-700"
          >
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </div>
      )}

      {actions.length === 0 ? (
        <p className="text-sm text-gray-500">{t("actions.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {actions.map((a) => {
            const overdue = isOverdue(a);
            return (
              <li
                key={a.id}
                className={`rounded-lg border p-3 ${overdue ? "border-red-300 bg-red-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-gray-500">
                      {a.owner ? `${a.owner.firstName} ${a.owner.lastName}` : t("actions.unassigned")}
                      {a.dueDate && (
                        <span className={overdue ? "ms-2 font-semibold text-red-600" : "ms-2"}>
                          {t("actions.due")}: {new Date(a.dueDate).toLocaleDateString(i18n.language)}
                          {overdue && ` (${t("actions.overdue")})`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={actionStatusClasses[a.status]}>
                    {t(`actions.statuses.${a.status}`)}
                  </Badge>
                </div>
                <div className="mt-2">
                  <Select value={a.status} onValueChange={(v) => setStatus(a, v as ActionStatus)}>
                    <SelectTrigger className="h-8 w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`actions.statuses.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CorrectiveActionsPanel;
