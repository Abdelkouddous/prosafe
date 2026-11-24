import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { PUBLIC_COPY, usePublicLocale } from "@/lib/publicSiteCopy";

const SERVICES = [
  {
    number: "01",
    title: "Site Safety Digitization & Onboarding",
    timeline: "2 – 3 weeks",
    summary:
      "We migrate your legacy Excel incident registers, PPE inventories, and employee certification matrices into PROSAFE with clean zone hierarchies and role permissions.",
    deliverables: [
      "Facility zone mapping for workshops, warehouses, and administrative areas",
      "Historical incident and risk register import with verified severity scores",
      "Role-based access setup for Admins, HSE Managers, and field employees",
    ],
  },
  {
    number: "02",
    title: "ISO 45001 Audit Preparation & Template Localization",
    timeline: "3 – 4 weeks",
    summary:
      "Our HSE specialists configure clause-mapped ISO 45001 and NFPA inspection checklists in English, French, and Arabic so your team enters surveillance audits with closed-loop evidence.",
    deliverables: [
      "Custom internal audit templates aligned with ISO 45001:2018 clauses",
      "Automated non-conformity to corrective action workflows",
      "Document vault setup with 30-day renewal reminders on certificates and SOPs",
    ],
  },
  {
    number: "03",
    title: "Custom ERP, HRIS & Sensor Integrations",
    timeline: "4 – 6 weeks",
    summary:
      "Connect PROSAFE's REST API and WebSocket gateway with your existing employee directory, maintenance CMMS, or fixed gas-detection alarms.",
    deliverables: [
      "Automated employee sync and training compliance updates from HRIS",
      "Webhook ingestion for critical equipment faults and environmental sensors",
      "Single Sign-On via Google Workspace or enterprise SAML identity providers",
    ],
  },
  {
    number: "04",
    title: "Frontline Adoption & Emergency Drill Coaching",
    timeline: "Ongoing / Quarterly",
    summary:
      "Hands-on workshops for shift supervisors and fire wardens ensuring fast near-miss capture, 90-second LMRA checks, and timed evacuation exercises.",
    deliverables: [
      "On-site or remote supervisor training sessions in EN, FR, or AR",
      "Fire and chemical spill drill benchmarking with post-exercise review reports",
      "Quarterly safety KPI review with plant leadership",
    ],
  },
];

const Services = () => {
  const locale = usePublicLocale();
  const copy = PUBLIC_COPY[locale].services;

  return (
    <PublicLayout
      kicker={copy.kicker}
      title={copy.title}
      subtitle={copy.subtitle}
      headerActions={
        <>
          <Button asChild className="bg-prosafe-600 hover:bg-prosafe-700">
            <Link to="/contact?topic=iso45001">{copy.primaryCta}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/features">{copy.secondaryCta}</Link>
          </Button>
        </>
      }
    >
      {/* Numbered Services List */}
      <section className="py-10 md:py-14">
        <div className="container max-w-6xl mx-auto px-4 space-y-6">
          {SERVICES.map((service) => (
            <article
              key={service.number}
              className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10"
            >
              <div className="lg:col-span-5">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <span className="font-mono font-semibold text-prosafe-600 tabular-nums">
                    {service.number}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {copy.deliveryPrefix} {service.timeline}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
                  {service.title}
                </h2>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{service.summary}</p>
              </div>

              <div className="lg:col-span-7 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-8">
                <ul className="space-y-3">
                  {service.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-prosafe-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link
                    to="/contact?topic=iso45001"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-prosafe-600 hover:text-prosafe-800"
                  >
                    {copy.requestScope}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Proof of Impact Adjacent to Services */}
      <section className="py-12 border-t border-slate-200 bg-slate-50/70">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {copy.impactStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-3xl font-bold text-slate-900 tabular-nums">{stat.metric}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{stat.label}</p>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Services;
