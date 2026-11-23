import { Award, Shield, Target, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

const ChooseUs = () => {
  const { t } = useTranslation();

  const pillars = [
    {
      icon: Shield,
      title: t("chooseUs.item1Title"),
      description: t("chooseUs.item1Desc"),
    },
    {
      icon: Target,
      title: t("chooseUs.item2Title"),
      description: t("chooseUs.item2Desc"),
    },
    {
      icon: Zap,
      title: t("chooseUs.item3Title"),
      description: t("chooseUs.item3Desc"),
    },
    {
      icon: Award,
      title: t("chooseUs.item4Title"),
      description: t("chooseUs.item4Desc"),
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            {t("chooseUs.title")}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("chooseUs.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {pillars.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-prosafe-100 text-prosafe-600">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="ms-4">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-gray-600">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChooseUs;
