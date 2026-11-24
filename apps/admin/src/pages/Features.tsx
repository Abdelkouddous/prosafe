import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Loader2, PlayCircle } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { FEATURE_MODULES } from "@/lib/publicSiteData";
import { PUBLIC_COPY, usePublicLocale } from "@/lib/publicSiteCopy";

type FilterId = "all" | "field" | "risk" | "workforce";

const Features = () => {
  const locale = usePublicLocale();
  const copy = PUBLIC_COPY[locale].features;
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [launchingDemo, setLaunchingDemo] = useState(false);
  const { loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const visibleModules =
    activeFilter === "all"
      ? FEATURE_MODULES
      : FEATURE_MODULES.filter((m) => m.category === activeFilter);

  const handleOpenDemo = async (targetRoute = "/dashboard") => {
    if (isAuthenticated) {
      navigate(targetRoute);
      return;
    }
    setLaunchingDemo(true);
    try {
      await loginDemo();
      navigate(targetRoute);
    } catch {
      navigate("/login");
    } finally {
      setLaunchingDemo(false);
    }
  };

  return (
    <PublicLayout
      kicker={copy.kicker}
      title={copy.title}
      subtitle={copy.subtitle}
      headerActions={
        <>
          <Button
            onClick={() => handleOpenDemo("/dashboard")}
            disabled={launchingDemo}
            className="bg-prosafe-600 hover:bg-prosafe-700"
          >
            {launchingDemo ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            {copy.launchDemo}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/pricing">{copy.comparePlans}</Link>
          </Button>
        </>
      }
    >
      {/* Interactive Module Filter & Capability Grid */}
      <section className="py-10 md:py-14">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{copy.sectionTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">{copy.sectionSubtitle}</p>
            </div>

            <div
              className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200/80 self-start"
              role="tablist"
              aria-label="Filter safety modules"
            >
              {copy.filters.map((tab) => {
                const selected = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                      selected
                        ? "bg-prosafe-600 text-white shadow-sm"
                        : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleModules.map((mod) => (
              <article
                key={mod.id}
                className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span className="font-mono font-semibold text-prosafe-600 tabular-nums">
                      {mod.number}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{mod.categoryLabel}</span>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900">{mod.title}</h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{mod.summary}</p>

                  <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
                    {mod.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-prosafe-600 mt-0.5 shrink-0" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenDemo(mod.dashboardRoute)}
                    disabled={launchingDemo}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-prosafe-600 hover:text-prosafe-800 transition-colors"
                  >
                    {copy.inspectModule}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Operational Architecture Strip */}
      <section className="py-12 border-t border-slate-200 bg-slate-50/70">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{copy.archTitle}</h2>
            <p className="mt-2 text-slate-600">{copy.archSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {copy.archStats.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-slate-200 bg-white p-5 space-y-1.5"
              >
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{item.metric}</p>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Features;
