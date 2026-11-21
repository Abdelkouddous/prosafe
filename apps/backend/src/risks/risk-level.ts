import { RiskLevel } from './enums/risk.enums';

/** score = gravity (1-5) x probability (1-5), range 1-25. */
export const computeRiskScore = (gravity: number, probability: number): number => gravity * probability;

/** low 1-4, medium 5-9, high 10-14, critical 15-25. */
export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 15) return RiskLevel.CRITICAL;
  if (score >= 10) return RiskLevel.HIGH;
  if (score >= 5) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

export interface MatrixCell {
  gravity: number;
  probability: number;
  score: number;
  level: RiskLevel;
  count: number;
  riskIds: number[];
}

/** Always returns the 25 cells (gravity 1-5 x probability 1-5), zero-filled, ordered by gravity then probability. */
export function buildRiskMatrix(risks: { id: number; gravity: number; probability: number }[]): MatrixCell[] {
  const cells: MatrixCell[] = [];
  for (let gravity = 1; gravity <= 5; gravity++) {
    for (let probability = 1; probability <= 5; probability++) {
      const score = computeRiskScore(gravity, probability);
      cells.push({ gravity, probability, score, level: riskLevelFromScore(score), count: 0, riskIds: [] });
    }
  }
  for (const r of risks) {
    const cell = cells.find((c) => c.gravity === r.gravity && c.probability === r.probability);
    if (cell) {
      cell.count++;
      cell.riskIds.push(r.id);
    }
  }
  return cells;
}
