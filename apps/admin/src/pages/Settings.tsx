import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Eye, EyeOff, Globe, Lock, Monitor, Moon, Sun, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import NotificationPreferences from "@/components/NotificationPreferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePublicLocale } from "@/lib/publicSiteCopy";
import {
  getHighContrast,
  getTextSize,
  setHighContrast,
  setTextSize,
  type TextSize,
} from "@/lib/accessibility";
import { HIGH_CONTRAST_CHANGE_EVENT, type ThemeMode } from "@/lib/theme";
import { changePassword } from "@/services/usersApi";

const APPEARANCE_COPY = {
  fr: {
    title: "Apparence",
    desc: "Choisissez le thème d'affichage de votre espace PROSAFE.",
    light: "Clair",
    dark: "Sombre",
    system: "Système",
  },
  en: {
    title: "Appearance",
    desc: "Choose how PROSAFE looks on your workstation or field tablet.",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  ar: {
    title: "المظهر",
    desc: "اختر وضع العرض المناسب لمحطة العمل أو الجهاز اللوحي.",
    light: "فاتح",
    dark: "داكن",
    system: "النظام",
  },
} as const;

const SIZES: { value: TextSize; key: string }[] = [
  { value: "normal", key: "sizeNormal" },
  { value: "large", key: "sizeLarge" },
  { value: "xlarge", key: "sizeXLarge" },
];

const PasswordField = ({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={id === "currentPassword" ? "current-password" : "new-password"}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const locale = usePublicLocale();
  const appearanceCopy = APPEARANCE_COPY[locale];
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [textSize, setTextSizeState] = useState<TextSize>(getTextSize());
  const [contrast, setContrastState] = useState(getHighContrast());
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  const lang = (i18n.language || "en").split("-")[0];

  useEffect(() => {
    const syncContrast = () => setContrastState(getHighContrast());
    window.addEventListener(HIGH_CONTRAST_CHANGE_EVENT, syncContrast);
    return () => window.removeEventListener(HIGH_CONTRAST_CHANGE_EVENT, syncContrast);
  }, []);

  const handleSelectTheme = (mode: ThemeMode) => {
    setTheme(mode);
    if (mode === "dark" && contrast) {
      setContrastState(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwd.next !== pwd.confirm) {
      toast({ title: t("settingsPage.mismatch"), variant: "destructive" });
      return;
    }
    if (pwd.next.length < 8) {
      toast({ title: t("settingsPage.tooShort"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await changePassword({
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });
      toast({ title: t("settingsPage.passwordChanged") });
      setPwd({ current: "", next: "", confirm: "" });
    } catch {
      toast({ title: t("settingsPage.passwordError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("settingsPage.title")}
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-2">
              {t("settingsPage.subtitle")}
            </p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">{t("settingsPage.tabs.general")}</TabsTrigger>
              <TabsTrigger value="notifications">{t("settingsPage.tabs.notifications")}</TabsTrigger>
              <TabsTrigger value="security">{t("settingsPage.tabs.security")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t("settingsPage.profile")}
                  </CardTitle>
                  <CardDescription>{t("settingsPage.profileDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-gray-500 dark:text-slate-400">{t("settingsPage.name")}</p>
                    <p className="font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-slate-400">{t("settingsPage.email")}</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-slate-400">{t("settingsPage.role")}</p>
                    <p className="font-medium">{user?.roles?.join(", ")}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {t("settingsPage.language")}
                  </CardTitle>
                  <CardDescription>{t("settingsPage.languageDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* dir/lang are applied by the i18n languageChanged listener */}
                  <Select value={lang} onValueChange={(v) => i18n.changeLanguage(v)}>
                    <SelectTrigger className="max-w-xs" aria-label={t("settingsPage.language")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    {appearanceCopy.title}
                  </CardTitle>
                  <CardDescription>{appearanceCopy.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="flex flex-wrap gap-2"
                    role="radiogroup"
                    aria-label={appearanceCopy.title}
                    data-testid="settings-theme-selector"
                  >
                    {(
                      [
                        { value: "light" as ThemeMode, label: appearanceCopy.light, Icon: Sun },
                        { value: "dark" as ThemeMode, label: appearanceCopy.dark, Icon: Moon },
                        { value: "system" as ThemeMode, label: appearanceCopy.system, Icon: Monitor },
                      ] as const
                    ).map(({ value, label, Icon }) => (
                      <Button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={theme === value}
                        data-testid={`settings-theme-${value}`}
                        variant={theme === value ? "default" : "outline"}
                        onClick={() => handleSelectTheme(value)}
                      >
                        <Icon className="h-4 w-4 me-2" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("settingsPage.accessibility")}</CardTitle>
                  <CardDescription>{t("settingsPage.accessibilityDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("settingsPage.textSize")}</Label>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("settingsPage.textSize")}>
                      {SIZES.map((s) => (
                        <Button
                          key={s.value}
                          type="button"
                          role="radio"
                          aria-checked={textSize === s.value}
                          variant={textSize === s.value ? "default" : "outline"}
                          onClick={() => {
                            setTextSize(s.value);
                            setTextSizeState(s.value);
                          }}
                        >
                          {t(`settingsPage.${s.key}`)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="high-contrast">{t("settingsPage.highContrast")}</Label>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {t("settingsPage.highContrastDesc")}
                      </p>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={contrast}
                      onCheckedChange={(c) => {
                        setHighContrast(c);
                        setContrastState(c);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    {t("settingsPage.tabs.notifications")}
                  </CardTitle>
                  <CardDescription>{t("settingsPage.notificationsDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationPreferences />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    {t("settingsPage.password")}
                  </CardTitle>
                  <CardDescription>{t("settingsPage.passwordDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PasswordField
                    id="currentPassword"
                    label={t("settingsPage.currentPassword")}
                    value={pwd.current}
                    onChange={(v) => setPwd((p) => ({ ...p, current: v }))}
                  />
                  <PasswordField
                    id="newPassword"
                    label={t("settingsPage.newPassword")}
                    value={pwd.next}
                    onChange={(v) => setPwd((p) => ({ ...p, next: v }))}
                  />
                  <PasswordField
                    id="confirmPassword"
                    label={t("settingsPage.confirmPassword")}
                    value={pwd.confirm}
                    onChange={(v) => setPwd((p) => ({ ...p, confirm: v }))}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handlePasswordChange} disabled={loading}>
                      {loading ? t("settingsPage.changing") : t("settingsPage.changePassword")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
