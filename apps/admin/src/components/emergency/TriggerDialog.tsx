import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { emergencyApi, notifyEmergencyChanged, type Scenario } from "@/services/emergencyApi";

const NONE = "__none__";

interface Props {
  open: boolean;
  scenarios: Scenario[];
  onClose: () => void;
  onTriggered: () => void;
}

/** Two-step dialog: fill the alert, then explicitly confirm before notifying everyone. */
const TriggerDialog = ({ open, scenarios, onClose, onTriggered }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [scenarioId, setScenarioId] = useState<number | undefined>();
  const [message, setMessage] = useState("");
  const [zone, setZone] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("form");
      setScenarioId(undefined);
      setMessage("");
      setZone("");
    }
  }, [open]);

  const pick = (v: string) => {
    const id = v === NONE ? undefined : Number(v);
    setScenarioId(id);
    const sc = scenarios.find((s) => s.id === id);
    if (sc && !message.trim()) setMessage(sc.title);
  };

  const send = async () => {
    setSending(true);
    try {
      await emergencyApi.trigger({
        scenarioId,
        message: message.trim(),
        ...(zone.trim() ? { zone: zone.trim() } : {}),
      });
      toast({ title: t("emergency.trigger.sent") });
      notifyEmergencyChanged();
      onTriggered();
      onClose();
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("emergency.trigger.error")), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !sending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Siren className="h-5 w-5" />
            {t("emergency.trigger.button")}
          </DialogTitle>
        </DialogHeader>
        {step === "form" ? (
          <>
            <div className="space-y-3">
              <div>
                <Label>{t("emergency.trigger.scenario")}</Label>
                <Select value={scenarioId ? String(scenarioId) : NONE} onValueChange={pick}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("emergency.trigger.noScenario")}</SelectItem>
                    {scenarios
                      .filter((s) => s.isActive)
                      .map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("emergency.trigger.message")} *</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
              </div>
              <div>
                <Label>{t("emergency.trigger.zone")}</Label>
                <Input value={zone} onChange={(e) => setZone(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                disabled={!message.trim()}
                onClick={() => setStep("confirm")}
              >
                {t("emergency.trigger.next")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-4 text-sm">
              <p className="font-semibold text-red-700">{t("emergency.trigger.warning")}</p>
              <p className="whitespace-pre-line">{message}</p>
              {zone.trim() && <p className="text-xs text-gray-600">{t("emergency.trigger.zone")}: {zone}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" disabled={sending} onClick={() => setStep("form")}>
                {t("emergency.trigger.back")}
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" disabled={sending} onClick={send}>
                {sending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("emergency.trigger.confirm")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TriggerDialog;
