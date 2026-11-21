import { linearForecast, linearRegression, monthRange, movingAverageForecast } from './forecast';

describe('forecast math', () => {
  it('linear regression recovers an exact line', () => {
    const { slope, intercept } = linearRegression([2, 4, 6, 8]);
    expect(slope).toBeCloseTo(2);
    expect(intercept).toBeCloseTo(2);
    expect(linearForecast([2, 4, 6, 8], 3)).toEqual([10, 12, 14]);
  });

  it('is flat for constant data, never negative, and handles tiny inputs', () => {
    expect(linearForecast([5, 5, 5], 2)).toEqual([5, 5]);
    expect(linearForecast([9, 6, 3], 3)).toEqual([0, 0, 0]);
    expect(linearForecast([4], 2)).toEqual([4, 4]);
    expect(linearForecast([], 2)).toEqual([0, 0]);
  });

  it('moving average is recursive over a 3-month window', () => {
    // (3+6+9)/3 = 6 ; (6+9+6)/3 = 7 ; (9+6+7)/3 = 7.3
    expect(movingAverageForecast([1, 3, 6, 9], 3)).toEqual([6, 7, 7.3]);
    expect(movingAverageForecast([], 2)).toEqual([0, 0]);
  });

  it('monthRange crosses year boundaries', () => {
    expect(monthRange('2025-11', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });
});
