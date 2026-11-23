import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle2, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSubmitted(true);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast({
        title: t("common.error"),
        description: msg || t("auth.forgotPasswordError"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container max-w-md mx-auto flex-grow flex flex-col justify-center px-4 py-12">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>{t("auth.backToLogin")}</span>
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-prosafe-100 mb-4">
              <Shield className="h-6 w-6 text-prosafe-600" />
            </div>
            <h1 className="text-2xl font-bold">{t("auth.forgotPasswordTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {t("auth.forgotPasswordSubtitle")}
            </p>
          </div>

          {submitted ? (
            <div className="space-y-5 text-center" role="status">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("auth.resetSentTitle")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("auth.resetSentDescription", { email })}
                </p>
              </div>
              <Button className="w-full bg-prosafe-600 hover:bg-prosafe-700" asChild>
                <Link to="/login">{t("auth.backToLogin")}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.emailPlaceholder")}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-prosafe-600 hover:bg-prosafe-700"
              >
                {submitting ? t("common.loading") : t("auth.sendResetLink")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
