import { AuditResult } from './enums/audit.enums';

export interface ScoreSummary {
  conform: number;
  nonConform: number;
  notApplicable: number;
  /** items of the template without any response */
  unanswered: number;
  /** percentage 0-100 (1 decimal) = conform / (conform + non_conform); null when nothing is applicable */
  score: number | null;
}

export function summarizeResponses(results: AuditResult[], itemCount: number): ScoreSummary {
  const conform = results.filter((r) => r === AuditResult.CONFORM).length;
  const nonConform = results.filter((r) => r === AuditResult.NON_CONFORM).length;
  const notApplicable = results.filter((r) => r === AuditResult.NOT_APPLICABLE).length;
  const applicable = conform + nonConform;
  return {
    conform,
    nonConform,
    notApplicable,
    unanswered: Math.max(0, itemCount - results.length),
    score: applicable > 0 ? Math.round((conform / applicable) * 1000) / 10 : null,
  };
}
