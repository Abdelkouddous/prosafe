import test from "node:test";
import assert from "node:assert/strict";
import {
  BLOG_ARTICLES,
  CHANGELOG_ENTRIES,
  OPEN_ROLES,
  calculatePlanPrice,
  filterBlogArticles,
  filterChangelogEntries,
  filterOpenRoles,
  validateContactInquiry,
} from "./publicSiteData";

test("calculatePlanPrice returns monthly rate without discount on monthly cycle", () => {
  const result = calculatePlanPrice(199, "monthly");
  assert.equal(result.perMonth, 199);
  assert.equal(result.billedAnnually, null);
  assert.equal(result.annualSavings, 0);
});

test("calculatePlanPrice applies 20% annual discount and computes savings accurately", () => {
  const result = calculatePlanPrice(199, "annual");
  assert.equal(result.perMonth, 159);
  assert.equal(result.billedAnnually, 1908);
  assert.equal(result.annualSavings, 480);
});

test("calculatePlanPrice preserves custom enterprise pricing (null)", () => {
  const result = calculatePlanPrice(null, "annual");
  assert.equal(result.perMonth, null);
  assert.equal(result.billedAnnually, null);
  assert.equal(result.annualSavings, 0);
});

test("validateContactInquiry rejects empty or malformed inputs", () => {
  const res = validateContactInquiry({
    fullName: "A",
    email: "not-an-email",
    topic: "demo",
    message: "short",
  });
  assert.equal(res.valid, false);
  assert.ok(res.errors.fullName);
  assert.ok(res.errors.email);
  assert.ok(res.errors.message);
});

test("validateContactInquiry accepts valid work inquiry", () => {
  const res = validateContactInquiry({
    fullName: "Aymen Hamel",
    email: "aymen@prosafe.dz",
    company: "Prosafe Industrial",
    topic: "demo",
    message: "We want to deploy PROSAFE across 3 manufacturing sites.",
  });
  assert.equal(res.valid, true);
  assert.deepEqual(res.errors, {});
});

test("filterBlogArticles filters by category and search query", () => {
  const isoOnly = filterBlogArticles(BLOG_ARTICLES, "ISO 45001", "");
  assert.equal(isoOnly.length, 1);
  assert.equal(isoOnly[0].id, "iso-45001-clause-8-readiness");

  const searchLmra = filterBlogArticles(BLOG_ARTICLES, "All", "LMRA");
  assert.equal(searchLmra.length, 1);
  assert.equal(searchLmra[0].id, "lmra-stop-work-authority");

  const noMatch = filterBlogArticles(BLOG_ARTICLES, "Emergency Readiness", "LMRA");
  assert.equal(noMatch.length, 0);
});

test("filterOpenRoles and filterChangelogEntries filter accurately", () => {
  const engRoles = filterOpenRoles(OPEN_ROLES, "Engineering");
  assert.equal(engRoles.length, 2);
  assert.equal(filterOpenRoles(OPEN_ROLES, "All").length, OPEN_ROLES.length);

  const complianceUpdates = filterChangelogEntries(CHANGELOG_ENTRIES, "Compliance");
  assert.equal(complianceUpdates.length, 1);
  assert.equal(complianceUpdates[0].version, "v2.2.0");
});
