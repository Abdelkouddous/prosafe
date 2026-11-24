import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  PRICING_TIERS,
  calculatePlanPrice,
  type BillingCycle,
} from "@/lib/publicSiteData";
import { PUBLIC_COPY, usePublicLocale } from "@/lib/publicSiteCopy";

const Pricing = () => {
  const locale = usePublicLocale();
  const copy = PUBLIC_COPY[locale].pricing;
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <PublicLayout kicker={copy.kicker} title={copy.title} subtitle={copy.subtitle}>
      {/* Billing Toggle + Pricing Tiers */}
      <section className="py-10 md:py-14">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <p className="text-sm text-slate-600">{copy.banner}</p>

            <div
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200/80 self-start"
              role="group"
              aria-label="Billing cycle"
            >
              <button
                type="button"
                onClick={() => setCycle("monthly")}
                aria-pressed={cycle === "monthly"}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  cycle === "monthly"
                    ? "bg-prosafe-600 text-white shadow-sm"
                    : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70"
                }`}
              >
                {copy.monthly}
              </button>
              <button
                type="button"
                onClick={() => setCycle("annual")}
                aria-pressed={cycle === "annual"}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  cycle === "annual"
                    ? "bg-prosafe-600 text-white shadow-sm"
                    : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70"
                }`}
              >
                {copy.annual}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {PRICING_TIERS.map((tier) => {
              const price = calculatePlanPrice(tier.monthlyPrice, cycle);
              const localizedTier = copy.tiers[tier.id];
              return (
                <div
                  key={tier.id}
                  className={`rounded-xl border bg-white p-6 sm:p-7 flex flex-col justify-between ${
                    tier.highlighted
                      ? "border-prosafe-600 ring-1 ring-prosafe-600"
                      : "border-slate-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xl font-semibold text-slate-900">
                        {localizedTier.name}
                      </h2>
                      {tier.highlighted && (
                        <span className="text-xs font-medium text-prosafe-600">
                          {copy.popular}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {localizedTier.tagline}
                    </p>

                    <div className="mt-5 pb-5 border-b border-slate-200">
                      {price.perMonth !== null ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span
                              className="text-4xl font-bold text-slate-900 tabular-nums"
                              data-testid={`price-${tier.id}`}
                            >
                              ${price.perMonth}
                            </span>
                            <span className="text-sm text-slate-500">{copy.perMonth}</span>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
                            {cycle === "annual" && price.billedAnnually
                              ? copy.billedAnnually(price.billedAnnually, price.annualSavings)
                              : copy.billedMonthly}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl font-bold text-slate-900">{copy.custom}</div>
                          <p className="mt-1.5 text-xs text-slate-500">{copy.customSub}</p>
                        </>
                      )}
                      <p className="mt-3 text-xs font-medium text-slate-700">
                        {localizedTier.siteLimit} · {localizedTier.userLimit}
                      </p>
                    </div>

                    <ul className="mt-5 space-y-2.5">
                      {localizedTier.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <Check className="h-4 w-4 text-prosafe-600 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-7 pt-2">
                    <Button
                      asChild
                      variant={tier.highlighted ? "default" : "outline"}
                      className={`w-full ${
                        tier.highlighted ? "bg-prosafe-600 hover:bg-prosafe-700" : ""
                      }`}
                    >
                      <Link to={tier.ctaTo}>{localizedTier.ctaLabel}</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 border-t border-slate-200 bg-slate-50/70">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{copy.faqTitle}</h2>
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {copy.faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-medium text-slate-900">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Pricing;
