import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { useToast } from "@/components/ui/use-toast";
import { apiErrorMessage } from "@/components/manager/ManagerPage";
import {
  SCENARIO_TYPES,
  emergencyApi,
  type EmergencyContact,
  type Scenario,
  type ScenarioType,
} from "@/services/emergencyApi";

interface Props {
  open: boolean;
  scenario?: Scenario | null;
  onClose: () => void;
  onSaved: () => void;
}

const ScenarioDialog = ({ open, scenario, onClose, onSaved }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ScenarioType>("fire");
  const [steps, setSteps] = useState<string[]>([""]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [assemblyPoint, setAssemblyPoint] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setTitle(scenario?.title ?? "");
    setType(scenario?.type ?? "fire");
    setSteps(scenario?.steps?.length ? scenario.steps : [""]);
    setContacts(scenario?.contacts ?? []);
    setAssemblyPoint(scenario?.assemblyPoint ?? "");
    setIsActive(scenario?.isActive ?? true);
  }, [open, scenario]);

  const validContacts = contacts.filter((c) => c.name.trim() && c.role.trim() && c.phone.trim());

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const body = {
      title: title.trim(),
      type,
      steps: steps.map((s) => s.trim()).filter(Boolean),
      contacts: validContacts,
      assemblyPoint: assemblyPoint.trim(),
      isActive,
    };
    try {
      if (scenario) await emergencyApi.updateScenario(scenario.id, body);
      else await emergencyApi.createScenario(body);
      toast({ title: t("emergency.scenarios.saved") });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("emergency.saveError")), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{scenario ? t("emergency.scenarios.edit") : t("emergency.scenarios.create")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>{t("emergency.fields.title")} *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div>
              <Label>{t("emergency.fields.type")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as ScenarioType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCENARIO_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`emergency.types.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("emergency.fields.assemblyPoint")}</Label>
              <Input value={assemblyPoint} onChange={(e) => setAssemblyPoint(e.target.value)} />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Switch id="sc-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="sc-active">{t("emergency.fields.active")}</Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("emergency.fields.steps")}</Label>
              <Button size="sm" variant="outline" onClick={() => setSteps((s) => [...s, ""])}>
                <Plus className="me-1 h-4 w-4" />
                {t("emergency.scenarios.addStep")}
              </Button>
            </div>
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-sm text-gray-500">{i + 1}</span>
                <Input
                  value={s}
                  onChange={(e) => setSteps((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                />
                <Button size="icon" variant="ghost" onClick={() => setSteps((p) => p.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("emergency.fields.contacts")}</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setContacts((c) => [...c, { name: "", role: "", phone: "" }])}
              >
                <Plus className="me-1 h-4 w-4" />
                {t("emergency.scenarios.addContact")}
              </Button>
            </div>
            {contacts.map((c, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                {(["name", "role", "phone"] as const).map((k) => (
                  <Input
                    key={k}
                    value={c[k]}
                    placeholder={t(`emergency.contact.${k}`)}
                    onChange={(e) =>
                      setContacts((p) => p.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))
                    }
                  />
                ))}
                <Button size="icon" variant="ghost" onClick={() => setContacts((p) => p.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
            {contacts.length !== validContacts.length && (
              <p className="text-xs text-orange-600">{t("emergency.scenarios.incompleteContacts")}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving || !title.trim()} className="bg-prosafe-600 hover:bg-prosafe-700">
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScenarioDialog;
