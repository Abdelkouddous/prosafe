import test from "node:test";
import assert from "node:assert/strict";
import {
  computeAuditScore,
  computeRewardBadge,
  computeRiskScore,
  forecastMonthlyCounts,
  signSessionToken,
  verifySessionToken,
} from "./riskMath";

test("computeRiskScore clamps bounds and maps risk levels", () => {
  assert.deepEqual(computeRiskScore(1, 2), { score: 2, level: "low" });
  assert.deepEqual(computeRiskScore(2, 3), { score: 6, level: "medium" });
  assert.deepEqual(computeRiskScore(3, 4), { score: 12, level: "high" });
  assert.deepEqual(computeRiskScore(5, 4), { score: 20, level: "critical" });
  assert.deepEqual(computeRiskScore(9, -2), { score: 5, level: "medium" });
});

test("computeAuditScore calculates compliance percentage excluding N/A", () => {
  const summary = computeAuditScore(
    [
      { result: "conform" },
      { result: "conform" },
      { result: "non_conform" },
      { result: "not_applicable" },
    ],
    5
  );
  assert.equal(summary.conform, 2);
  assert.equal(summary.nonConform, 1);
  assert.equal(summary.notApplicable, 1);
  assert.equal(summary.unanswered, 1);
  assert.equal(summary.score, 67);
});

test("computeRewardBadge assigns tiers accurately", () => {
  assert.equal(computeRewardBadge(5), null);
  assert.equal(computeRewardBadge(10), "bronze");
  assert.equal(computeRewardBadge(55), "silver");
  assert.equal(computeRewardBadge(120), "gold");
  assert.equal(computeRewardBadge(250), "platinum");
});

test("forecastMonthlyCounts predicts future months via linear regression", () => {
  const forecast = forecastMonthlyCounts(
    [
      { month: "2026-10", count: 4 },
      { month: "2026-11", count: 6 },
      { month: "2026-12", count: 8 },
    ],
    2
  );
  assert.equal(forecast.length, 2);
  assert.equal(forecast[0].month, "2027-01");
  assert.equal(forecast[0].count, 10);
  assert.equal(forecast[0].method, "linear_regression");
  assert.equal(forecast[1].month, "2027-02");
  assert.equal(forecast[1].count, 12);
});

test("signSessionToken and verifySessionToken round-trip and reject tampering", () => {
  const token = signSessionToken({ sub: 42, email: "admin@prosafe.demo", roles: ["admin"] });
  const verified = verifySessionToken(token);
  assert.ok(verified);
  assert.equal(verified.sub, 42);
  assert.equal(verified.email, "admin@prosafe.demo");
  assert.deepEqual(verified.roles, ["admin"]);

  assert.equal(verifySessionToken(`${token}tampered`), null);
  assert.equal(verifySessionToken("invalid"), null);
});
