import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Audit } from "@/services/auditsApi";
import { auditStatusClasses } from "./auditBits";

interface Props {
  month: Date;
  audits: Audit[];
  onMonthChange: (d: Date) => void;
  onAuditClick: (a: Audit) => void;
  onDayClick: (d: Date) => void;
}

/** Simple Monday-first month grid with audits displayed on their scheduled day. */
const MonthCalendar = ({ month, audits, onMonthChange, onAuditClick, onDayClick }: Props) => {
  const { i18n } = useTranslation();
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month]
  );
  const weekdays = days.slice(0, 7).map((d) =>
    new Intl.DateTimeFormat(i18n.language, { weekday: "short" }).format(d)
  );
  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric" }).format(month);
  const today = new Date();

  const shift = (n: number) => onMonthChange(addDays(startOfMonth(month), n < 0 ? -1 : 32));

  return (
    <div dir="ltr">
      <div className="mb-3 flex items-center justify-between">
        <Button size="icon" variant="outline" onClick={() => shift(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-lg font-semibold capitalize">{monthLabel}</div>
        <Button size="icon" variant="outline" onClick={() => shift(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-gray-200">
        {weekdays.map((w) => (
          <div key={w} className="bg-gray-50 py-1 text-center text-xs font-medium capitalize text-gray-500">
            {w}
          </div>
        ))}
        {days.map((d) => {
          const items = audits.filter((a) => isSameDay(new Date(a.scheduledAt), d));
          return (
            <div
              key={d.toISOString()}
              onClick={() => onDayClick(d)}
              className={`min-h-24 cursor-pointer bg-white p-1 hover:bg-gray-50 ${
                isSameMonth(d, month) ? "" : "opacity-50"
              }`}
            >
              <div
                className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isSameDay(d, today) ? "bg-prosafe-600 font-bold text-white" : "text-gray-600"
                }`}
              >
                {format(d, "d")}
              </div>
              <div className="space-y-1">
                {items.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAuditClick(a);
                    }}
                    className={`block w-full truncate rounded border px-1 py-0.5 text-start text-[11px] ${auditStatusClasses[a.status]}`}
                    title={a.title}
                  >
                    {a.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendar;
