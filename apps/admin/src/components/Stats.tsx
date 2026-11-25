import { useTranslation } from "react-i18next";

const Stats = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-prosafe-600 dark:text-prosafe-400 tabular-nums mb-2">
              99.9%
            </p>
            <p className="text-gray-600 dark:text-slate-400">{t("landingStats.uptime")}</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-prosafe-600 dark:text-prosafe-400 tabular-nums mb-2">
              24/7
            </p>
            <p className="text-gray-600 dark:text-slate-400">{t("landingStats.support")}</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-prosafe-600 dark:text-prosafe-400 tabular-nums mb-2">
              500+
            </p>
            <p className="text-gray-600 dark:text-slate-400">{t("landingStats.enterprises")}</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-prosafe-600 dark:text-prosafe-400 mb-2">
              ISO 45001
            </p>
            <p className="text-gray-600 dark:text-slate-400">{t("landingStats.compliance")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
