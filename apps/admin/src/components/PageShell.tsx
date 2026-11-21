import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";

const PageShell = ({
  title,
  subtitle,
  actions,
  children,
  fullHeight,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  fullHeight?: boolean;
}) => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <main className={`container mx-auto px-4 py-6 ${fullHeight ? "" : "pb-12"}`}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </main>
  </div>
);

export default PageShell;
