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
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />

      <header className="border-b border-slate-200 bg-slate-50/70">
        <div className="container max-w-6xl mx-auto px-4 py-10 md:py-12">
          <div className="max-w-3xl">
            {kicker && (
              <p className="text-sm font-medium text-prosafe-600 mb-2">{kicker}</p>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
              {title}
            </h1>
            <p className="mt-3.5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
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
