import { RiskLevel } from './enums/risk.enums';
import { buildRiskMatrix, computeRiskScore, riskLevelFromScore } from './risk-level';

describe('risk level', () => {
  it('score = gravity x probability', () => {
    expect(computeRiskScore(3, 4)).toBe(12);
  });

  it.each([
    [1, RiskLevel.LOW], [4, RiskLevel.LOW], [5, RiskLevel.MEDIUM], [9, RiskLevel.MEDIUM],
    [10, RiskLevel.HIGH], [14, RiskLevel.HIGH], [15, RiskLevel.CRITICAL], [25, RiskLevel.CRITICAL],
  ])('score %d is %s', (score, level) => {
    expect(riskLevelFromScore(score)).toBe(level);
  });

  it('matrix has 25 zero-filled cells and aggregates risk ids', () => {
    const cells = buildRiskMatrix([
      { id: 1, gravity: 5, probability: 5 },
      { id: 2, gravity: 5, probability: 5 },
      { id: 3, gravity: 1, probability: 2 },
    ]);
    expect(cells).toHaveLength(25);
    expect(cells.find((c) => c.gravity === 5 && c.probability === 5)).toMatchObject({ count: 2, riskIds: [1, 2], score: 25, level: 'critical' });
    expect(cells.find((c) => c.gravity === 1 && c.probability === 2)).toMatchObject({ count: 1, riskIds: [3], level: 'low' });
    expect(cells.filter((c) => c.count === 0)).toHaveLength(23);
  });
});
