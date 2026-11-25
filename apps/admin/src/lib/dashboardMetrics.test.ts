import test from "node:test";
import assert from "node:assert/strict";
import {
  computePipelineSegments,
  computeOverallCompliance,
  computeResolutionFraction,
  computeMonthlySeries,
} from "./dashboardMetrics";

test("computePipelineSegments calculates percentages accurately", () => {
  const segs = computePipelineSegments({
    total: 20,
    open: 4,
    investigating: 2,
    resolved: 10,
    closed: 4,
  });
  assert.deepEqual(
    segs.map((s) => [s.key, s.pct]),
    [
      ["open", 20],
      ["investigating", 10],
      ["resolved", 50],
      ["closed", 20],
    ]
  );
});

test("computePipelineSegments handles zero incidents safely without NaN", () => {
  const segs = computePipelineSegments({
    total: 0,
    open: 0,
    investigating: 0,
    resolved: 0,
    closed: 0,
  });
  assert.equal(segs.length, 4);
  for (const seg of segs) {
    assert.equal(seg.pct, 0);
    assert.equal(Number.isNaN(seg.pct), false);
  }
});

test("computeOverallCompliance averages available non-null pillars", () => {
  assert.equal(
    computeOverallCompliance({
      equipmentComplianceRate: 94.2,
      trainingComplianceRate: 91.8,
      auditComplianceRate: 96.0,
    }),
    94
  );
  assert.equal(
    computeOverallCompliance({
      equipmentComplianceRate: 80,
      trainingComplianceRate: null,
      auditComplianceRate: 90,
    }),
    85
  );
  assert.equal(
    computeOverallCompliance({
      equipmentComplianceRate: null,
      trainingComplianceRate: null,
      auditComplianceRate: null,
    }),
    null
  );
});

test("computeResolutionFraction combines resolved and closed counts", () => {
  const res = computeResolutionFraction({
    total: 18,
    open: 3,
    investigating: 2,
    resolved: 9,
    closed: 4,
  });
  assert.deepEqual(res, {
    resolvedCount: 13,
    totalCount: 18,
    percentage: 72,
  });
});

test("computeMonthlySeries marks peak month and clamps bar heights", () => {
  const series = computeMonthlySeries([
    { month: "2026-07", count: 4 },
    { month: "2026-08", count: 0 },
    { month: "2026-09", count: 6 },
    { month: "2026-10", count: 3 },
  ]);
  assert.equal(series.length, 4);
  assert.equal(series[2].isPeak, true);
  assert.equal(series[2].heightPct, 100);
  assert.equal(series[1].heightPct, 8);
  assert.equal(series[0].shortLabel, "07");
});
