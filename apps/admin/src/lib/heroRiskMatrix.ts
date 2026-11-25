export type HeroRiskLevel = "low" | "medium" | "high" | "critical";

export interface HeroRiskEvaluation {
  gravity: number;
  probability: number;
  score: number;
  level: HeroRiskLevel;
}

export function clampRiskAxis(value: number): number {
  return Math.max(1, Math.min(5, Math.round(value)));
}

/**
 * Computes the ISO 45001 5x5 risk score and severity band.
 * Mirrors the backend thresholds in src/lib/riskMath.ts.
 */
export function evaluateRiskCell(gravity: number, probability: number): HeroRiskEvaluation {
  const g = clampRiskAxis(gravity);
  const p = clampRiskAxis(probability);
  const score = g * p;

  let level: HeroRiskLevel = "low";
  if (score >= 16) {
    level = "critical";
  } else if (score >= 10) {
    level = "high";
  } else if (score >= 5) {
    level = "medium";
  }

  return { gravity: g, probability: p, score, level };
}

export const GRAVITY_LEVELS = [5, 4, 3, 2, 1] as const;
export const PROBABILITY_LEVELS = [1, 2, 3, 4, 5] as const;
