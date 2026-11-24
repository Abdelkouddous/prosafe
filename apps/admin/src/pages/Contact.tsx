import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, Mail, MapPin, Clock, PlayCircle, Send } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import {
  validateContactInquiry,
  type ContactFormInput,
} from "@/lib/publicSiteData";
import {
  PUBLIC_COPY,
  localizeValidationErrors,
  usePublicLocale,
} from "@/lib/publicSiteCopy";

interface SubmissionReceipt {
  referenceId: string;
  receivedAt: string;
  email: string;
  topicValue: string;
}

const Contact = () => {
  const locale = usePublicLocale();
  const copy = PUBLIC_COPY[locale].contact;

  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get("topic") || "demo";
  const validInitialTopic = copy.topics.some((o) => o.value === initialTopic)
    ? initialTopic
    : "demo";

  const [form, setForm] = useState<ContactFormInput>({
    fullName: "",
    email: "",
    company: "",
    phone: "",
    topic: validInitialTopic,
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormInput, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [launchingDemo, setLaunchingDemo] = useState(false);

  const { loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const updateField = <K extends keyof ContactFormInput>(key: K, value: ContactFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateContactInquiry(form);
    if (!validation.valid) {
      setErrors(localizeValidationErrors(validation.errors, locale));
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const { data } = await api.post<{
        ok: boolean;
        referenceId: string;
        receivedAt: string;
      }>("/public/contact", form);

      setReceipt({
        referenceId: data.referenceId,
        receivedAt: data.receivedAt,
        email: form.email.trim(),
        topicValue: form.topic,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setServerError(msg || copy.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setReceipt(null);
    setErrors({});
    setServerError(null);
    setForm({
      fullName: "",
      email: "",
      company: "",
      phone: "",
      topic: "demo",
      message: "",
    });
  };

  const handleLaunchDemo = async () => {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }
    setLaunchingDemo(true);
    try {
      await loginDemo();
      navigate("/dashboard");
    } catch {
      navigate("/login");
    } finally {
      setLaunchingDemo(false);
    }
  };

  const receiptTopicLabel = receipt
    ? copy.topics.find((opt) => opt.value === receipt.topicValue)?.label ?? receipt.topicValue
    : "";

  return (
    <PublicLayout kicker={copy.kicker} title={copy.title} subtitle={copy.subtitle}>
      <section className="py-10 md:py-14">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Lead Capture Form */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
              {receipt ? (
                <div className="py-6 space-y-5" role="status" aria-live="polite">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">{copy.receiptTitle}</h2>
                    <p className="mt-2 text-slate-600 leading-relaxed">
                      {copy.receiptBodyPrefix}{" "}
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {receipt.referenceId}
                      </span>{" "}
                      {copy.receiptBodyMid}{" "}
                      <span className="font-medium text-slate-900">{receipt.email}</span>{" "}
                      {copy.receiptBodySuffix}
                    </p>
                  </div>
                  <div className="border-t border-slate-200 pt-4 text-sm text-slate-600 space-y-1">
                    <p>
                      <span className="font-medium text-slate-900">{copy.receiptTopic}</span>{" "}
                      {receiptTopicLabel}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">{copy.receiptSubmitted}</span>{" "}
                      <span className="tabular-nums">
                        {new Date(receipt.receivedAt).toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button
                      onClick={handleLaunchDemo}
                      disabled={launchingDemo}
                      className="bg-prosafe-600 hover:bg-prosafe-700"
                    >
                      {launchingDemo ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PlayCircle className="mr-2 h-4 w-4" />
                      )}
                      {copy.exploreDemo}
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      {copy.sendAnother}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{copy.formTitle}</h2>
                    <p className="mt-1 text-sm text-slate-500">{copy.formSubtitle}</p>
                  </div>

                  {serverError && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {serverError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-fullName">{copy.fullName}</Label>
                      <Input
                        id="contact-fullName"
                        name="fullName"
                        placeholder={copy.fullNamePlaceholder}
                        value={form.fullName}
                        onChange={(e) => updateField("fullName", e.target.value)}
                        aria-invalid={!!errors.fullName}
                      />
                      {errors.fullName && (
                        <p className="text-xs text-red-600" role="alert">
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email">{copy.email}</Label>
                      <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder={copy.emailPlaceholder}
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-600" role="alert">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-company">{copy.company}</Label>
                      <Input
                        id="contact-company"
                        name="company"
                        placeholder={copy.companyPlaceholder}
                        value={form.company}
                        onChange={(e) => updateField("company", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contact-phone">{copy.phone}</Label>
                      <Input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        placeholder={copy.phonePlaceholder}
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-topic">{copy.topic}</Label>
                    <select
                      id="contact-topic"
                      name="topic"
                      value={form.topic}
                      onChange={(e) => updateField("topic", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {copy.topics.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message">{copy.message}</Label>
                    <Textarea
                      id="contact-message"
                      name="message"
                      rows={4}
                      placeholder={copy.messagePlaceholder}
                      value={form.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      aria-invalid={!!errors.message}
                    />
                    {errors.message && (
                      <p className="text-xs text-red-600" role="alert">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
                    <p className="text-xs text-slate-500">
                      {copy.privacyPrefix}{" "}
                      <Link to="/privacy" className="underline hover:text-prosafe-600">
                        {copy.privacyLink}
                      </Link>
                      {copy.privacySuffix}
                    </p>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-prosafe-600 hover:bg-prosafe-700 whitespace-nowrap shrink-0"
                    >
                      {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      {copy.submit}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Direct Contact Channels & Instant Demo */}
            <aside className="lg:col-span-5 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 sm:p-7 space-y-5">
                <h2 className="text-lg font-semibold text-slate-900">{copy.directTitle}</h2>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-prosafe-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{copy.salesLabel}</p>
                      <a
                        href="mailto:contact@prosafe.aymenhamel.com"
                        className="text-slate-600 hover:text-prosafe-600"
                      >
                        contact@prosafe.aymenhamel.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-prosafe-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{copy.hoursLabel}</p>
                      <p className="text-slate-600">{copy.hoursLine1}</p>
                      <p className="text-slate-500 mt-0.5">{copy.hoursLine2}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-prosafe-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{copy.coverageLabel}</p>
                      <p className="text-slate-600">{copy.coverageBody}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">{copy.demoCardTitle}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{copy.demoCardBody}</p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    onClick={handleLaunchDemo}
                    disabled={launchingDemo}
                    className="bg-prosafe-600 hover:bg-prosafe-700"
                  >
                    {launchingDemo ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="mr-2 h-4 w-4" />
                    )}
                    {copy.tryDemo}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/pricing">{copy.viewPricing}</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Contact;
