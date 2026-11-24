import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BLOG_ARTICLES,
  filterBlogArticles,
  type BlogArticle,
} from "@/lib/publicSiteData";
import { PUBLIC_COPY, usePublicLocale } from "@/lib/publicSiteCopy";

const Blog = () => {
  const locale = usePublicLocale();
  const copy = PUBLIC_COPY[locale].blog;
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [activeArticle, setActiveArticle] = useState<BlogArticle | null>(null);

  const visibleArticles = filterBlogArticles(BLOG_ARTICLES, category, query);

  return (
    <PublicLayout kicker={copy.kicker} title={copy.title} subtitle={copy.subtitle}>
      <section className="py-10 md:py-14">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Controls Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div
              className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200/80 self-start"
              role="tablist"
              aria-label="Filter articles by topic"
            >
              {copy.categories.map((cat) => {
                const selected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                      selected
                        ? "bg-prosafe-600 text-white shadow-sm"
                        : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="search"
                aria-label={copy.searchPlaceholder}
                placeholder={copy.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {visibleArticles.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-10 text-center space-y-3">
              <p className="text-base font-medium text-slate-900">{copy.emptyTitle}</p>
              <p className="text-sm text-slate-500">{copy.emptySubtitle}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCategory("All");
                  setQuery("");
                }}
              >
                {copy.resetFilters}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleArticles.map((article) => (
                <article
                  key={article.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                      <span className="font-medium text-prosafe-600">{article.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.publishedAt}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.readTime}</span>
                    </div>

                    <h2 className="text-xl font-semibold text-slate-900 leading-snug">
                      {article.title}
                    </h2>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="text-xs text-slate-500">
                      <span className="font-medium text-slate-800">{article.author}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{article.authorRole}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveArticle(article)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-prosafe-600 hover:text-prosafe-800 whitespace-nowrap shrink-0"
                    >
                      {copy.readArticle}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!activeArticle} onOpenChange={(open) => !open && setActiveArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {activeArticle && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="font-medium text-prosafe-600">{activeArticle.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeArticle.publishedAt}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeArticle.readTime}</span>
                </div>
                <DialogTitle className="text-2xl leading-snug text-slate-900">
                  {activeArticle.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 pt-1">
                  {copy.byPrefix} {activeArticle.author}, {activeArticle.authorRole}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                {activeArticle.body.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
};

export default Blog;
