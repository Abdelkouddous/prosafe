import { Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { PUBLIC_COPY, usePublicLocale } from "@/lib/publicSiteCopy";

const PRINCIPLES = [
  {
    number: "01",
    title: "Closed loops over paper binders",
    description:
      "Reporting a hazard only matters if it leads to an evaluated risk score, an assigned owner, and a verified fix. Every PROSAFE record links forward to measurable resolution.",
  },
  {
    number: "02",
    title: "Built for the workshop floor, not just headquarters",
    description:
      "Maintenance engineers, forklift operators, and fire wardens need interfaces that work in French, Arabic (RTL), and English with clear contrast and zero unnecessary clicks.",
  },
  {
    number: "03",
    title: "Audit evidence generated as a byproduct of daily work",
    description:
      "When training attendance, gas detector calibrations, LMRA stop-work checks, and drill times live in one relational system, ISO 45001 compliance stays continuously verifiable.",
  },
];

const About = () => {
  const locale = usePublicLocale();
  const copy = PUBLIC_COPY[locale].about;

  return (
    <PublicLayout
      kicker={copy.kicker}
      title={copy.title}
      subtitle={copy.subtitle}
      headerActions={
        <>
          <Button asChild className="bg-prosafe-600 hover:bg-prosafe-700">
            <Link to="/contact">{copy.primaryCta}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/careers">{copy.secondaryCta}</Link>
          </Button>
        </>
      }
    >
      {/* Story & Key Metrics */}
      <section className="py-10 md:py-14">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-5 text-base text-slate-600 leading-relaxed">
              <h2 className="text-2xl font-bold text-slate-900">{copy.storyTitle}</h2>
              <p>
                Across manufacturing plants, logistics hubs, and maintenance workshops, safety
                teams carry enormous responsibility with tools that were never built for real-time
                risk prevention. Incident reports arrive by phone or messaging apps, equipment
                calibration logs sit in separate binders, and managers only discover expired
                training certificates during an audit.
              </p>
              <p>
                PROSAFE brings those disciplines together into a single web and realtime platform:
                geolocated incident triage, a live 5x5 risk matrix, Last Minute Risk Assessments
                (LMRA), ISO 45001 audit checklists, preventive equipment maintenance, training
                compliance tracking, and WebSocket-powered emergency drills.
              </p>
              <p>
                Designed from day one for multilingual industrial teams across North Africa and
                Europe, PROSAFE supports seamless switching between English, French, and
                right-to-left Arabic while maintaining strict PostgreSQL data integrity and
                role-based access control.
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {copy.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-5"
                >
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{stat.value}</p>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Operating Principles */}
      <section className="py-12 border-t border-slate-200 bg-slate-50/70">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{copy.principlesTitle}</h2>
            <p className="mt-2 text-slate-600">{copy.principlesSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRINCIPLES.map((item) => (
              <div
                key={item.number}
                className="rounded-xl border border-slate-200 bg-white p-6 space-y-3"
              >
                <p className="font-mono text-xs font-semibold text-prosafe-600 tabular-nums">
                  {item.number}
                </p>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default About;
