import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { CHANGELOG_ENTRIES, filterChangelogEntries } from "@/lib/publicSiteData";
import { PUBLIC_COPY, usePublicLocale } from "@/lib/publicSiteCopy";

const Updates = () => {
  const locale = usePublicLocale();
  const copy = PUBLIC_COPY[locale].updates;
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const visibleEntries = filterChangelogEntries(CHANGELOG_ENTRIES, selectedCategory);

  return (
    <PublicLayout
      kicker={copy.kicker}
      title={copy.title}
      subtitle={copy.subtitle}
      headerActions={
        <Button asChild variant="outline">
          <Link to="/contact?topic=demo">{copy.cta}</Link>
        </Button>
      }
    >
      <section className="py-10 md:py-14">
        <div className="container max-w-4xl mx-auto px-4">
          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200/80 mb-8"
            role="tablist"
            aria-label="Filter changelog by category"
          >
            {copy.categories.map((cat) => {
              const active = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    active
                      ? "bg-prosafe-600 text-white shadow-sm"
                      : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            {visibleEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                  <span className="font-mono font-semibold text-prosafe-600 tabular-nums">
                    {entry.version}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.category}</span>
                </div>

                <h2 className="text-xl font-semibold text-slate-900">{entry.title}</h2>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{entry.summary}</p>

                <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
                  {entry.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-prosafe-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Updates;
