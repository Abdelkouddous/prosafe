import { Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { PUBLIC_COPY, usePublicLocale } from "@/lib/publicSiteCopy";

const SECTIONS = [
  {
    id: "scope",
    title: "1. Scope and Controller",
    body: [
      "This Privacy Policy explains how PROSAFE collects, processes, and safeguards personal information when organizations and employees use our Occupational Health and Safety (OHS / SST) web platform, API, and public website.",
      "For workspace safety records (incident reports, training attendance, audit logs, and emergency drills), your employing organization acts as the Data Controller and PROSAFE processes data strictly on its documented instructions.",
    ],
  },
  {
    id: "data-collected",
    title: "2. Information We Collect",
    body: [
      "Account and profile data: full name, work email address, role (Employee, SST Manager, Administrator), department, facility zone, and optional phone number used for safety alerts.",
      "Operational safety records: incident descriptions, timestamps, optional facility geolocation coordinates, risk evaluations, LMRA checklists, training scores, and compliance documents uploaded by authorized users.",
      "Authentication and technical logs: signed session tokens, Firebase Google OAuth identifiers when chosen by the user, and security error telemetry required to keep the service reliable.",
    ],
  },
  {
    id: "usage",
    title: "3. How We Use Personal Data",
    body: [
      "We use personal information exclusively to deliver workplace safety workflows: routing incident escalations, tracking ISO 45001 corrective actions, notifying employees of expiring mandatory certifications, and broadcasting live emergency evacuation alerts.",
      "PROSAFE never sells, rents, or shares customer safety data with third-party advertising networks or data brokers.",
    ],
  },
  {
    id: "retention",
    title: "4. Storage, Sub-processors, and Retention",
    body: [
      "Workspace records are stored in encrypted PostgreSQL databases hosted in European cloud regions. Authentication tokens are verified via Firebase Authentication and HMAC-SHA256 signed server sessions.",
      "Safety and compliance records are retained for the duration of the organization's active subscription or as required by applicable occupational safety recordkeeping regulations, and deleted within 30 days of verified contract termination.",
    ],
  },
  {
    id: "rights",
    title: "5. Your Data Protection Rights",
    body: [
      "Depending on your jurisdiction (including GDPR in the EU/EEA and Law 18-07 in Algeria), you have the right to request access, correction, export, or deletion of your personal data, and to configure notification preferences directly inside your account Settings.",
      "To submit a privacy or data deletion request, contact our privacy team via the Contact page or email contact@prosafe.aymenhamel.com.",
    ],
  },
];

const Privacy = () => {
  const locale = usePublicLocale();
  const copy = PUBLIC_COPY[locale].privacy;

  return (
    <PublicLayout kicker={copy.kicker} title={copy.title} subtitle={copy.subtitle}>
      <section className="py-10 md:py-14">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <aside className="lg:col-span-3 lg:sticky lg:top-24">
              <p className="text-xs font-semibold text-slate-900 mb-3">{copy.onThisPage}</p>
              <nav aria-label="Privacy policy sections" className="space-y-2 text-sm">
                {SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block text-slate-600 hover:text-prosafe-600 transition-colors"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </aside>

            <div className="lg:col-span-9 space-y-10 max-w-3xl">
              {SECTIONS.map((sec) => (
                <section key={sec.id} id={sec.id} className="scroll-mt-24 space-y-3">
                  <h2 className="text-xl font-semibold text-slate-900">{sec.title}</h2>
                  {sec.body.map((paragraph, idx) => (
                    <p key={idx} className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}

              <div className="border-t border-slate-200 pt-6 text-sm text-slate-600">
                {copy.footerPrefix}{" "}
                <Link to="/contact?topic=support" className="font-medium text-prosafe-600 hover:underline">
                  {copy.footerContact}
                </Link>{" "}
                {copy.footerMid}{" "}
                <Link to="/security" className="font-medium text-prosafe-600 hover:underline">
                  {copy.footerSecurity}
                </Link>
                .
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Privacy;
