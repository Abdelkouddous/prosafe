import crypto from "crypto";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export function computeRiskLevel(score: number): RiskLevel {
  if (score >= 16) return "critical";
  if (score >= 10) return "high";
  if (score >= 5) return "medium";
  return "low";
}

export function computeRiskScore(gravity: number, probability: number): {
  score: number;
  level: RiskLevel;
} {
  const g = Math.max(1, Math.min(5, Math.round(gravity)));
  const p = Math.max(1, Math.min(5, Math.round(probability)));
  const score = g * p;
  return { score, level: computeRiskLevel(score) };
}

export function computeAuditScore(
  responses: { result: string }[],
  totalItems: number
): {
  conform: number;
  nonConform: number;
  notApplicable: number;
  unanswered: number;
  score: number | null;
} {
  let conform = 0;
  let nonConform = 0;
  let notApplicable = 0;
  for (const r of responses) {
    if (r.result === "conform") conform++;
    else if (r.result === "non_conform") nonConform++;
    else if (r.result === "not_applicable") notApplicable++;
  }
  const answered = conform + nonConform + notApplicable;
  const unanswered = Math.max(0, totalItems - answered);
  const applicable = conform + nonConform;
  const score = applicable > 0 ? Math.round((conform / applicable) * 100) : null;
  return { conform, nonConform, notApplicable, unanswered, score };
}

export function computeRewardBadge(points: number): string | null {
  if (points >= 200) return "platinum";
  if (points >= 100) return "gold";
  if (points >= 50) return "silver";
  if (points >= 10) return "bronze";
  return null;
}

export function forecastMonthlyCounts(
  history: { month: string; count: number }[],
  monthsAhead: number
): { month: string; count: number; method: "linear_regression" | "moving_average" }[] {
  const n = history.length;
  if (n === 0 || monthsAhead <= 0) return [];
  const last = history[n - 1].month;
  const [yStr, mStr] = last.split("-");
  let year = Number(yStr);
  let month = Number(mStr);

  const out: { month: string; count: number; method: "linear_regression" | "moving_average" }[] = [];

  if (n < 3) {
    const avg = Math.round(history.reduce((s, h) => s + h.count, 0) / n);
    for (let i = 1; i <= monthsAhead; i++) {
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
      out.push({
        month: `${year}-${String(month).padStart(2, "0")}`,
        count: Math.max(0, avg),
        method: "moving_average",
      });
    }
    return out;
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += history[i].count;
    sumXY += i * history[i].count;
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  for (let i = 1; i <= monthsAhead; i++) {
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
    const predicted = Math.max(0, Math.round(intercept + slope * (n - 1 + i)));
    out.push({
      month: `${year}-${String(month).padStart(2, "0")}`,
      count: predicted,
      method: "linear_regression",
    });
  }
  return out;
}

export interface SessionPayload {
  sub: number;
  email: string;
  roles: string[];
  exp: number;
}

const DEFAULT_SECRET = crypto.randomBytes(32).toString("hex");
function getSessionSecret(): string {
  return process.env.SESSION_SECRET || DEFAULT_SECRET;
}

export function signSessionToken(
  payload: Omit<SessionPayload, "exp">,
  ttlSeconds = 60 * 60 * 24 * 7
): string {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto
    .createHmac("sha256", getSessionSecret())
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed || typeof parsed.sub !== "number" || typeof parsed.exp !== "number") {
      return null;
    }
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}
