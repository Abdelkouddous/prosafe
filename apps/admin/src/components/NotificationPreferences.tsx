import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  notificationApi,
  type NotificationPreferences as Prefs,
} from "@/services/notificationApi";

const KEYS: (keyof Prefs)[] = [
  "incidents",
  "trainings",
  "audits",
  "inventory",
  "emergency",
  "messages",
  "push",
  "email",
];

const NotificationPreferences = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    notificationApi
      .getPreferences()
      .then((r) => setPrefs(r.data))
      .catch(() =>
        toast({ title: t("notifications.loadError"), variant: "destructive" })
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      const body = KEYS.reduce(
        (acc, k) => ({ ...acc, [k]: !!prefs[k] }),
        {} as Prefs
      );
      const res = await notificationApi.updatePreferences(body);
      setPrefs(res.data);
      toast({ title: t("notifications.saved") });
    } catch {
      toast({ title: t("notifications.saveError"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!prefs)
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      {KEYS.map((k, idx) => (
        <div key={k}>
          {idx > 0 && <Separator className="mb-4" />}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t(`notifications.prefs.${k}`)}</Label>
              <p className="text-sm text-gray-500">{t(`notifications.prefs.${k}Desc`)}</p>
            </div>
            <Switch
              checked={!!prefs[k]}
              onCheckedChange={(c) => setPrefs({ ...prefs, [k]: c })}
            />
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? t("notifications.saving") : t("notifications.save")}
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
