import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const CHART_COLORS = [
  "#F97316",
  "#0565d3",
  "#16A34A",
  "#DC2626",
  "#EAB308",
  "#7C3AED",
  "#0891B2",
  "#6B7280",
];

export const SEVERITY_COLORS: Record<string, string> = {
  low: "#16A34A",
  medium: "#EAB308",
  high: "#F97316",
  critical: "#DC2626",
};

export const STATUS_COLORS: Record<string, string> = {
  open: "#F97316",
  investigating: "#0565d3",
  resolved: "#16A34A",
  closed: "#6B7280",
};

export const fmtRate = (v: number | null | undefined) =>
  v == null ? "-" : `${Math.round(v * 10) / 10}%`;

export const fmtHours = (v: number | null | undefined) => {
  if (v == null) return "-";
  return v >= 48 ? `${Math.round((v / 24) * 10) / 10} d` : `${Math.round(v * 10) / 10} h`;
};

type Tone = "default" | "danger" | "warning" | "success";
const toneClass: Record<Tone, string> = {
  default: "text-gray-900",
  danger: "text-red-600",
  warning: "text-orange-600",
  success: "text-green-600",
};

export const KpiCard = ({
  label,
  value,
  tone = "default",
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
  icon?: ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-3xl font-bold ${toneClass[tone]}`}>{value}</div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </CardContent>
  </Card>
);

export const ChartCard = ({
  title,
  children,
  empty,
  className,
}: {
  title: string;
  children: ReactNode;
  empty?: string;
  className?: string;
}) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {empty ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-gray-500">
          {empty}
        </div>
      ) : (
        <div className="h-[260px]">{children}</div>
      )}
    </CardContent>
  </Card>
);
