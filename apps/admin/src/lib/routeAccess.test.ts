import test from "node:test";
import assert from "node:assert/strict";
import { getHomeRoute, isGuestOnlyPath, isManagerRole } from "./routeAccess";

test("isManagerRole detects admin and sst_manager roles accurately", () => {
  assert.equal(isManagerRole(["admin"]), true);
  assert.equal(isManagerRole(["sst_manager"]), true);
  assert.equal(isManagerRole(["employee", "sst_manager"]), true);
  assert.equal(isManagerRole(["employee"]), false);
  assert.equal(isManagerRole([]), false);
  assert.equal(isManagerRole(undefined), false);
  assert.equal(isManagerRole(null), false);
});

test("getHomeRoute routes managers to /dashboard and employees to /incidents", () => {
  assert.equal(getHomeRoute(["admin"]), "/dashboard");
  assert.equal(getHomeRoute(["sst_manager"]), "/dashboard");
  assert.equal(getHomeRoute(["employee"]), "/incidents");
  assert.equal(getHomeRoute([]), "/incidents");
  assert.equal(getHomeRoute(undefined), "/incidents");
});

test("isGuestOnlyPath isolates landing, marketing, and auth pages from workspace routes", () => {
  assert.equal(isGuestOnlyPath("/"), true);
  assert.equal(isGuestOnlyPath("/features"), true);
  assert.equal(isGuestOnlyPath("/pricing/"), true);
  assert.equal(isGuestOnlyPath("/contact"), true);
  assert.equal(isGuestOnlyPath("/login"), true);
  assert.equal(isGuestOnlyPath("/forgot-password"), true);

  assert.equal(isGuestOnlyPath("/dashboard"), false);
  assert.equal(isGuestOnlyPath("/incidents"), false);
  assert.equal(isGuestOnlyPath("/incidents/manage"), false);
  assert.equal(isGuestOnlyPath("/settings"), false);
  assert.equal(isGuestOnlyPath("/profile"), false);
});
