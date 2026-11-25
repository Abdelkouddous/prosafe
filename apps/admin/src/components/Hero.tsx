import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  PlayCircle,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const MONTHLY_TREND = [
  { key: "jan", incidents: 9, heightPct: 82 },
  { key: "feb", incidents: 7, heightPct: 64 },
  { key: "mar", incidents: 8, heightPct: 73 },
  { key: "apr", incidents: 5, heightPct: 48 },
  { key: "may", incidents: 4, heightPct: 38 },
  { key: "jun", incidents: 3, heightPct: 28 },
];

const Hero = () => {
  const { t } = useTranslation();
  const { loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [launchingDemo, setLaunchingDemo] = useState(false);

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

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="container max-w-6xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-prosafe-100 dark:bg-prosafe-500/15 text-prosafe-800 dark:text-prosafe-200 border border-transparent dark:border-prosafe-500/30 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-prosafe-600 dark:text-prosafe-400" />
            <span>{t("hero.introducing")}</span>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
          {t("hero.title")}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto">
          {t("hero.description")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <Button
            size="lg"
            className="bg-prosafe-600 hover:bg-prosafe-700 text-white h-12 px-8"
            onClick={handleLaunchDemo}
            disabled={launchingDemo}
            data-testid="hero-live-demo-btn"
          >
            {launchingDemo ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            {t("hero.tryLiveDemo")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-8" asChild>
            <Link to="/contact">{t("hero.requestDemo")}</Link>
          </Button>
        </div>

        {/* Realistic PROSAFE OHS / SST Dashboard Preview */}
        <div className="relative text-start">
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 prosafe-shadow bg-slate-950">
            {/* Browser Chrome */}
            <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/90" />
                <span className="w-3 h-3 rounded-full bg-amber-400/90" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/90" />
              </div>
              <div className="bg-slate-800 rounded-md px-3 py-1 text-xs font-medium text-slate-300 truncate max-w-[220px] sm:max-w-none">
                {t("hero.dashboardPreview")}
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ISO 45001
              </span>
            </div>

            {/* Preview Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5">
                  <p className="text-xs text-slate-400">{t("heroPreview.complianceRate")}</p>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-white">94%</span>
                    <span className="text-xs font-medium text-emerald-400">+6%</span>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5">
                  <p className="text-xs text-slate-400">{t("heroPreview.openIncidents")}</p>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-white">4</span>
                    <span className="text-xs font-medium text-amber-400">
                      1 {t("adminDashboard.status.critical")}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5">
                  <p className="text-xs text-slate-400">{t("heroPreview.trainingCoverage")}</p>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-white">89%</span>
                    <span className="text-xs font-medium text-sky-400">ISO 45001</span>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5">
                  <p className="text-xs text-slate-400">{t("heroPreview.meanResolution")}</p>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-white">18.4h</span>
                    <span className="inline-flex items-center text-xs font-medium text-emerald-400">
                      <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                      -32%
                    </span>
                  </div>
                </div>
              </div>

              {/* Charts + Alerts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Incident & Near-Miss Trend */}
                <div className="lg:col-span-2 rounded-lg bg-slate-900/90 border border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {t("dashboard.securityOverview")}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {t("heroPreview.monthlyTrendSubtitle")}
                      </p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-prosafe-400" />
                  </div>

                  <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
                    {MONTHLY_TREND.map((bar) => (
                      <div key={bar.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-[11px] font-medium text-slate-300">
                          {bar.incidents}
                        </span>
                        <div className="w-full max-w-[44px] bg-slate-800 rounded-t-md h-28 flex items-end overflow-hidden">
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-prosafe-600 to-sky-400 transition-all"
                            style={{ height: `${bar.heightPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] uppercase tracking-wide text-slate-400">
                          {t(`heroPreview.months.${bar.key}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Recent OHS Alerts */}
                <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">
                      {t("dashboard.recentAlerts")}
                    </h3>
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  </div>

                  <div className="space-y-2.5 flex-grow">
                    <div className="rounded-md bg-slate-800/80 border border-slate-700/70 p-2.5 flex items-start gap-2.5">
                      <span className="mt-1 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-100 truncate">
                          {t("heroPreview.alert1Title")}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {t("heroPreview.alert1Meta")}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md bg-slate-800/80 border border-slate-700/70 p-2.5 flex items-start gap-2.5">
                      <span className="mt-1 h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-100 truncate">
                          {t("heroPreview.alert2Title")}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {t("heroPreview.alert2Meta")}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md bg-slate-800/80 border border-slate-700/70 p-2.5 flex items-start gap-2.5">
                      <span className="mt-1 h-2 w-2 rounded-full bg-sky-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-100 truncate">
                          {t("heroPreview.alert3Title")}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t("heroPreview.alert3Meta")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
