import test from "node:test";
import assert from "node:assert/strict";
import {
  WORKSPACE_NAV_GROUPS,
  formatBadgeCount,
  isWorkspaceNavActive,
} from "./workspaceNav";

test("isWorkspaceNavActive matches exact and nested sub-routes", () => {
  const risksItem = { to: "/risks" };
  assert.equal(isWorkspaceNavActive("/risks", risksItem), true);
  assert.equal(isWorkspaceNavActive("/risks/matrix", risksItem), true);
  assert.equal(isWorkspaceNavActive("/risks/lmra/", risksItem), true);
  assert.equal(isWorkspaceNavActive("/risks-other", risksItem), false);
});

test("isWorkspaceNavActive matches alternate paths (audits & compliance)", () => {
  const auditsItem = { to: "/audits", also: ["/compliance"] };
  assert.equal(isWorkspaceNavActive("/audits", auditsItem), true);
  assert.equal(isWorkspaceNavActive("/audits/42", auditsItem), true);
  assert.equal(isWorkspaceNavActive("/compliance", auditsItem), true);
  assert.equal(isWorkspaceNavActive("/incidents/manage", auditsItem), false);
});

test("WORKSPACE_NAV_GROUPS includes Incidents and all core OHS modules without duplicates", () => {
  const allItems = WORKSPACE_NAV_GROUPS.flatMap((g) => g.items);
  const routes = allItems.map((i) => i.to);
  assert.equal(new Set(routes).size, routes.length);
  assert.ok(routes.includes("/incidents/manage"));
  assert.ok(routes.includes("/corrective-actions"));
  assert.ok(routes.includes("/risks"));
  assert.ok(routes.includes("/audits"));
  assert.ok(routes.includes("/equipment"));
  assert.ok(routes.includes("/trainings"));
});

test("formatBadgeCount hides zero/negative values and caps at 99+", () => {
  assert.equal(formatBadgeCount(0), null);
  assert.equal(formatBadgeCount(-2), null);
  assert.equal(formatBadgeCount(undefined), null);
  assert.equal(formatBadgeCount(7), "7");
  assert.equal(formatBadgeCount(142), "99+");
});
