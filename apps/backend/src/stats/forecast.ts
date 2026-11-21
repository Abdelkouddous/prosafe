/** Pure forecasting helpers (no dependencies) used by GET /stats/forecast. */

export interface Regression {
  slope: number;
  intercept: number;
}

/** Ordinary least squares over x = 0..n-1. Fewer than 2 points -> flat line at the single value (or 0). */
export function linearRegression(values: number[]): Regression {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: values[0] };
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  values.forEach((y, x) => {
    num += (x - meanX) * (y - meanY);
    den += (x - meanX) ** 2;
  });
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: meanY - slope * meanX };
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Next `steps` values on the regression line (never below 0), rounded to 1 decimal. */
export function linearForecast(values: number[], steps: number): number[] {
  const { slope, intercept } = linearRegression(values);
  return Array.from({ length: steps }, (_, i) => round1(Math.max(0, intercept + slope * (values.length + i))));
}

/** Recursive moving average: each forecast is the mean of the previous `window` values (history then forecasts). */
export function movingAverageForecast(values: number[], steps: number, window = 3): number[] {
  const series = [...values];
  const out: number[] = [];
  for (let i = 0; i < steps; i++) {
    const tail = series.slice(-window);
    const next = tail.length ? tail.reduce((a, b) => a + b, 0) / tail.length : 0;
    series.push(next);
    out.push(round1(next));
  }
  return out;
}

/** 'YYYY-MM' list of `count` months starting at (and including) `start`. */
export function monthRange(start: string, count: number): string[] {
  const [y, m] = start.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}
