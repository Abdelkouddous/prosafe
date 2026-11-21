import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface SectionTab {
  to: string;
  label: string;
  end?: boolean;
}

/** Sub-route tabs shown under a page title (risks, audits…). */
const SectionTabs = ({ tabs }: { tabs: SectionTab[] }) => (
  <nav className="mb-6 flex flex-wrap gap-1 border-b">
    {tabs.map((tb) => (
      <NavLink
        key={tb.to}
        to={tb.to}
        end={tb.end}
        className={({ isActive }) =>
          cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
            isActive
              ? "border-prosafe-600 text-prosafe-700"
              : "border-transparent text-gray-600 hover:text-gray-900"
          )
        }
      >
        {tb.label}
      </NavLink>
    ))}
  </nav>
);

export default SectionTabs;
