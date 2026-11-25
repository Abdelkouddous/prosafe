import { useEffect, type ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PublicLayoutProps {
  kicker?: string;
  title: string;
  subtitle: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

const PublicLayout = ({
  kicker,
  title,
  subtitle,
  headerActions,
  children,
}: PublicLayoutProps) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [title]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <header className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
        <div className="container max-w-6xl mx-auto px-4 py-10 md:py-12">
          <div className="max-w-3xl">
            {kicker && (
              <p className="text-sm font-medium text-prosafe-600 dark:text-prosafe-400 mb-2">
                {kicker}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              {title}
            </h1>
            <p className="mt-3.5 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
            {headerActions && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <Footer />
    </div>
  );
};

export default PublicLayout;
