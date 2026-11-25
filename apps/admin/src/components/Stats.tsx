import { useTranslation } from "react-i18next";

const Stats = () => {
  const { t } = useTranslation();

  const highlights = [
    {
      value: "12",
      label: t("landingStats.modules"),
      tabular: true,
    },
    {
      value: "5×5",
      label: t("landingStats.riskMatrix"),
      tabular: true,
    },
    {
      value: "ISO 45001",
      label: t("landingStats.compliance"),
      tabular: false,
    },
    {
      value: "FR · EN · AR",
      label: t("landingStats.languages"),
      tabular: false,
    },
  ];

  return (
    <section
      data-testid="landing-capabilities-strip"
      className="py-16 border-y border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950"
    >
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {highlights.map((item) => (
            <div key={item.value} className="space-y-1.5">
              <p
                className={`text-3xl md:text-4xl font-bold tracking-tight text-prosafe-600 dark:text-prosafe-400 ${
                  item.tabular ? "tabular-nums" : ""
                }`}
              >
                {item.value}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
