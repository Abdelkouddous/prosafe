import { Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { PUBLIC_COPY, usePublicLocale } from "@/lib/publicSiteCopy";

const TERMS_SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using the PROSAFE platform, interactive demo environment, or API, you agree to be bound by these Terms of Service. If you use PROSAFE on behalf of an industrial organization or employer, you represent that you have authority to bind that entity.",
    ],
  },
  {
    id: "accounts",
    title: "2. Accounts and Role-Based Access",
    body: [
      "Organization administrators control user provisioning and role assignments (Administrator, SST Manager, Employee). Users are responsible for maintaining the confidentiality of their login credentials and promptly reporting any suspected unauthorized access.",
      "The public Live Demo environment is provided strictly for evaluation and portfolio demonstration purposes. Do not enter confidential personal or regulated production incident data into the shared demo workspace.",
    ],
  },
  {
    id: "ownership",
    title: "3. Customer Data Ownership",
    body: [
      "You retain 100% ownership of all incident reports, hazard evaluations, audit responses, compliance documents, and employee training records stored in your dedicated PROSAFE workspace.",
      "You grant PROSAFE a limited license solely to host, back up, transmit, and display your content as required to operate and maintain the platform.",
    ],
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable Use",
    body: [
      "You agree not to attempt to probe, bypass authentication or RBAC boundaries, upload malicious binaries, overload API endpoints, or use PROSAFE in violation of applicable workplace health, safety, or privacy laws.",
    ],
  },
  {
    id: "disclaimers",
    title: "5. Operational Safety Responsibility",
    body: [
      "PROSAFE is a digital management, reporting, and compliance support platform. It assists HSE teams in coordinating safety programs and ISO 45001 workflows, but it does not replace certified physical emergency systems, statutory fire alarms, or licensed safety supervision on site.",
    ],
  },
  {
    id: "changes",
    title: "6. Updates and Contact",
    body: [
      "We may update these Terms as our platform evolves. Material updates are communicated to workspace administrators at least 15 days in advance.",
    ],
  },
];

const Terms = () => {
  const locale = usePublicLocale();
  const copy = PUBLIC_COPY[locale].terms;

  return (
    <PublicLayout kicker={copy.kicker} title={copy.title} subtitle={copy.subtitle}>
      <section className="py-10 md:py-14">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <aside className="lg:col-span-3 lg:sticky lg:top-24">
              <p className="text-xs font-semibold text-slate-900 mb-3">{copy.onThisPage}</p>
              <nav aria-label="Terms of service sections" className="space-y-2 text-sm">
                {TERMS_SECTIONS.map((sec) => (
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
              {TERMS_SECTIONS.map((sec) => (
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
                <Link
                  to="/contact?topic=enterprise"
                  className="font-medium text-prosafe-600 hover:underline"
                >
                  {copy.footerContact}
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

export default Terms;
