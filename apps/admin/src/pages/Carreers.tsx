import { useState } from "react";
import { Check, CheckCircle2, Loader2, Send } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/services/api";
import {
  OPEN_ROLES,
  filterOpenRoles,
  validateContactInquiry,
  type OpenRole,
} from "@/lib/publicSiteData";
import {
  PUBLIC_COPY,
  localizeValidationErrors,
  usePublicLocale,
} from "@/lib/publicSiteCopy";

const Carreers = () => {
  const locale = usePublicLocale();
  const copy = PUBLIC_COPY[locale].careers;
  const [department, setDepartment] = useState<string>("All");
  const [applyingRole, setApplyingRole] = useState<OpenRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const visibleRoles = filterOpenRoles(OPEN_ROLES, department);

  const openApplication = (role: OpenRole) => {
    setApplyingRole(role);
    setSubmittedRef(null);
    setFieldErrors({});
    setServerError(null);
    setFullName("");
    setEmail("");
    setPortfolioUrl("");
    setNote("");
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingRole) return;

    const compiledMessage = portfolioUrl.trim()
      ? `Role: ${applyingRole.title}\nPortfolio/LinkedIn: ${portfolioUrl.trim()}\n\n${note.trim()}`
      : `Role: ${applyingRole.title}\n\n${note.trim()}`;

    const validation = validateContactInquiry({
      fullName,
      email,
      topic: `career:${applyingRole.id}`,
      message: note,
    });
    if (!validation.valid) {
      setFieldErrors(localizeValidationErrors(validation.errors, locale));
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const { data } = await api.post<{ referenceId: string }>("/public/contact", {
        fullName,
        email,
        company: applyingRole.department,
        topic: `career:${applyingRole.id}`,
        message: compiledMessage,
      });
      setSubmittedRef(data.referenceId);
    } catch {
      setServerError(copy.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout kicker={copy.kicker} title={copy.title} subtitle={copy.subtitle}>
      <section className="py-10 md:py-14">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {copy.openPositions}{" "}
                <span className="text-base font-normal text-slate-500 tabular-nums">
                  ({visibleRoles.length})
                </span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">{copy.filterHint}</p>
            </div>

            <div
              className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200/80 self-start"
              role="tablist"
              aria-label="Filter open roles by department"
            >
              {copy.departments.map((dept) => {
                const selected = department === dept.value;
                return (
                  <button
                    key={dept.value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setDepartment(dept.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                      selected
                        ? "bg-prosafe-600 text-white shadow-sm"
                        : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70"
                    }`}
                  >
                    {dept.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            {visibleRoles.map((role) => (
              <article
                key={role.id}
                className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6"
              >
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="font-medium text-prosafe-600">{role.department}</span>
                    <span aria-hidden="true">·</span>
                    <span>{role.location}</span>
                    <span aria-hidden="true">·</span>
                    <span>{role.type}</span>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900">{role.title}</h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{role.summary}</p>

                  <ul className="mt-4 space-y-2">
                    {role.requirements.map((req) => (
                      <li key={req} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-prosafe-600 mt-0.5 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="shrink-0">
                  <Button
                    onClick={() => openApplication(role)}
                    className="bg-prosafe-600 hover:bg-prosafe-700 whitespace-nowrap"
                  >
                    {copy.applyCta}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!applyingRole} onOpenChange={(open) => !open && setApplyingRole(null)}>
        <DialogContent className="max-w-lg">
          {applyingRole && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {copy.applyDialogPrefix} · {applyingRole.title}
                </DialogTitle>
                <DialogDescription>
                  {applyingRole.department} · {applyingRole.location} · {applyingRole.type}
                </DialogDescription>
              </DialogHeader>

              {submittedRef ? (
                <div className="py-4 space-y-4" role="status">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {copy.submittedPrefix}{" "}
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {submittedRef}
                    </span>
                    {copy.submittedSuffix}
                  </p>
                  <Button variant="outline" onClick={() => setApplyingRole(null)}>
                    {copy.close}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} noValidate className="space-y-4 mt-2">
                  {serverError && (
                    <p role="alert" className="text-xs text-red-600">
                      {serverError}
                    </p>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-name">{copy.fullName}</Label>
                    <Input
                      id="apply-name"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setFieldErrors((p) => ({ ...p, fullName: undefined }));
                      }}
                      placeholder={copy.fullNamePlaceholder}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-xs text-red-600" role="alert">
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="apply-email">{copy.email}</Label>
                    <Input
                      id="apply-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((p) => ({ ...p, email: undefined }));
                      }}
                      placeholder="you@example.com"
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-600" role="alert">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="apply-link">{copy.linkLabel}</Label>
                    <Input
                      id="apply-link"
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="apply-note">{copy.noteLabel}</Label>
                    <Textarea
                      id="apply-note"
                      rows={4}
                      value={note}
                      onChange={(e) => {
                        setNote(e.target.value);
                        setFieldErrors((p) => ({ ...p, message: undefined }));
                      }}
                      placeholder={copy.notePlaceholder}
                    />
                    {fieldErrors.message && (
                      <p className="text-xs text-red-600" role="alert">
                        {fieldErrors.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setApplyingRole(null)}
                    >
                      {copy.cancel}
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-prosafe-600 hover:bg-prosafe-700"
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
};

export default Carreers;
