import { useTranslation } from "react-i18next";

const Testimonials = () => {
  const { t } = useTranslation();

  const items = [
    {
      name: "Michael Roberts",
      role: t("testimonials.item1Role"),
      quote: t("testimonials.item1Quote"),
      initials: "MR",
      accent: "bg-prosafe-100 text-prosafe-700 dark:bg-prosafe-500/20 dark:text-prosafe-300",
    },
    {
      name: "Sarah Johnson",
      role: t("testimonials.item2Role"),
      quote: t("testimonials.item2Quote"),
      initials: "SJ",
      accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    },
    {
      name: "David Kumar",
      role: t("testimonials.item3Role"),
      quote: t("testimonials.item3Quote"),
      initials: "DK",
      accent: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            {t("testimonials.title")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-slate-400 max-w-3xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div
              key={item.name}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 prosafe-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center mb-4">
                  <div
                    className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center font-semibold text-sm ${item.accent}`}
                    aria-hidden="true"
                  >
                    {item.initials}
                  </div>
                  <div className="ms-4">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{item.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-slate-300">&ldquo;{item.quote}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
