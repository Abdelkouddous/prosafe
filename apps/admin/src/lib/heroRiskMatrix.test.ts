import test from "node:test";
import assert from "node:assert/strict";
import { clampRiskAxis, evaluateRiskCell } from "./heroRiskMatrix";

test("clampRiskAxis clamps out-of-range and fractional inputs to 1..5", () => {
  assert.equal(clampRiskAxis(0), 1);
  assert.equal(clampRiskAxis(-3), 1);
  assert.equal(clampRiskAxis(7), 5);
  assert.equal(clampRiskAxis(3.6), 4);
});

test("evaluateRiskCell maps scores to low, medium, high, and critical bands matching backend", () => {
  assert.deepEqual(evaluateRiskCell(1, 4), {
    gravity: 1,
    probability: 4,
    score: 4,
    level: "low",
  });
  assert.deepEqual(evaluateRiskCell(2, 3), {
    gravity: 2,
    probability: 3,
    score: 6,
    level: "medium",
  });
  assert.deepEqual(evaluateRiskCell(3, 4), {
    gravity: 3,
    probability: 4,
    score: 12,
    level: "high",
  });
  assert.deepEqual(evaluateRiskCell(4, 4), {
    gravity: 4,
    probability: 4,
    score: 16,
    level: "critical",
  });
  assert.deepEqual(evaluateRiskCell(5, 5), {
    gravity: 5,
    probability: 5,
    score: 25,
    level: "critical",
  });
});
