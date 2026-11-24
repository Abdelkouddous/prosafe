import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { PUBLIC_COPY, usePublicLocale } from "@/lib/publicSiteCopy";

const SECURITY_PILLARS = [
  {
    number: "01",
    title: "Authentication & Role-Based Access Control (RBAC)",
    summary:
      "Every API route and Socket.IO WebSocket channel enforces server-side identity and role validation before returning or modifying operational data.",
    controls: [
      "Passwords hashed with bcrypt and verified in constant time",
      "Optional Google Workspace / Firebase OAuth verified server-side via public JWKS",
      "Strict Admin, SST Manager, and Employee middleware separation on all routes",
    ],
  },
  {
    number: "02",
    title: "Encryption in Transit & Database Isolation",
    summary:
      "All web traffic, realtime WebSocket channels, and managed PostgreSQL connections are protected with TLS encryption.",
    controls: [
      "HTTPS enforced across custom domains with managed TLS certificates",
      "Parameterized Drizzle ORM queries eliminating SQL injection vectors",
      "Zero hardcoded secrets in client bundles or source repositories",
    ],
  },
  {
    number: "03",
    title: "Auditability & Compliance Readiness",
    summary:
      "Workplace safety records require verifiable traceability for ISO 45001 auditors and internal investigations.",
    controls: [
      "Immutable incident status history recording actor, timestamp, and notes",
      "Explicit CORS allowlisting restricted to approved application origins",
      "Structured server health probes without exposing internal credentials",
    ],
  },
];

const Security = () => {
  const locale = usePublicLocale();
  const copy = PUBLIC_COPY[locale].security;

  return (
    <PublicLayout
      kicker={copy.kicker}
      title={copy.title}
      subtitle={copy.subtitle}
      headerActions={
        <>
          <Button asChild className="bg-prosafe-600 hover:bg-prosafe-700">
            <Link to="/contact?topic=support">{copy.primaryCta}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/privacy">{copy.secondaryCta}</Link>
          </Button>
        </>
      }
    >
      <section className="py-10 md:py-14">
        <div className="container max-w-6xl mx-auto px-4 space-y-6">
          {SECURITY_PILLARS.map((pillar) => (
            <article
              key={pillar.number}
              className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-5">
                <p className="font-mono text-xs font-semibold text-prosafe-600 tabular-nums mb-2">
                  {pillar.number}
                </p>
                <h2 className="text-xl font-semibold text-slate-900">{pillar.title}</h2>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{pillar.summary}</p>
              </div>
              <ul className="lg:col-span-7 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-8">
                {pillar.controls.map((control) => (
                  <li key={control} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-prosafe-600 mt-0.5 shrink-0" />
                    <span>{control}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="py-12 border-t border-slate-200 bg-slate-50/70">
        <div className="container max-w-4xl mx-auto px-4 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">{copy.disclosureTitle}</h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {copy.disclosurePrefix}{" "}
            <a
              href="mailto:contact@prosafe.aymenhamel.com"
              className="font-medium text-prosafe-600 hover:underline"
            >
              contact@prosafe.aymenhamel.com
            </a>{" "}
            {copy.disclosureMid}{" "}
            <Link to="/contact?topic=support" className="font-medium text-prosafe-600 hover:underline">
              {copy.disclosureLink}
            </Link>
            {copy.disclosureSuffix}
          </p>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Security;
