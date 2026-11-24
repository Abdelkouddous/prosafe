import test from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_EMPLOYEE_EMAIL,
  buildSafetyReportHtml,
  escapeHtml,
  filterCommandItems,
  isDemoAccount,
} from "./workspaceFeatures";

test("isDemoAccount identifies only seeded demo accounts case-insensitively", () => {
  assert.equal(isDemoAccount(DEMO_ADMIN_EMAIL), true);
  assert.equal(isDemoAccount("ADMIN@PROSAFE.DEMO"), true);
  assert.equal(isDemoAccount(DEMO_EMPLOYEE_EMAIL), true);
  assert.equal(isDemoAccount("aymen.pharm980@gmail.com"), false);
  assert.equal(isDemoAccount(null), false);
});

test("filterCommandItems matches titles, subtitles, and keywords", () => {
  const items = [
    { id: "1", group: "navigation" as const, title: "Incidents", keywords: ["near miss", "accident"] },
    { id: "2", group: "navigation" as const, title: "Audits", subtitle: "ISO 45001" },
    { id: "3", group: "actions" as const, title: "Export PDF Report", keywords: ["print"] },
  ];
  assert.equal(filterCommandItems(items, "").length, 3);
  assert.equal(filterCommandItems(items, "iso").length, 1);
  assert.equal(filterCommandItems(items, "iso")[0].id, "2");
  assert.equal(filterCommandItems(items, "near").length, 1);
  assert.equal(filterCommandItems(items, "near")[0].id, "1");
  assert.equal(filterCommandItems(items, "nonexistent").length, 0);
});

test("escapeHtml neutralizes script injection and HTML control characters", () => {
  const escaped = escapeHtml(`<script>alert("xss" & '1')</script>`);
  assert.equal(
    escaped,
    "&lt;script&gt;alert(&quot;xss&quot; &amp; &#39;1&#39;)&lt;/script&gt;"
  );
  assert.ok(!escaped.includes("<script>"));
});

test("buildSafetyReportHtml escapes untrusted incident data and formats RTL/LTR cleanly", () => {
  const html = buildSafetyReportHtml({
    title: "Safety Summary <img onerror=alert(1)>",
    organization: "PROSAFE Industrial",
    generatedBy: "Admin User",
    generatedAtIso: "2026-11-23T14:00:00.000Z",
    periodLabel: "2026-01-01 → 2026-11-23",
    locale: "fr",
    kpis: {
      totalIncidents: 12,
      openIncidents: 3,
      resolutionRatePct: 75,
      avgResolutionHours: 14.5,
      trainingCompliancePct: 92,
      overdueActions: 1,
    },
    incidents: [
      {
        incidentId: "INC-2026-001",
        type: "near_miss",
        severity: "high",
        status: "open",
        zone: "<b>Workshop A</b>",
        department: "Maintenance",
        reportedAt: "2026-11-20T08:00:00.000Z",
      },
    ],
  });

  assert.ok(html.includes('dir="ltr"'));
  assert.ok(html.includes("&lt;img onerror=alert(1)&gt;"));
  assert.ok(html.includes("&lt;b&gt;Workshop A&lt;/b&gt;"));
  assert.ok(!html.includes("<img onerror"));
  assert.ok(html.includes("75%"));
  assert.ok(html.includes("14.5 h"));

  const arHtml = buildSafetyReportHtml({
    title: "تقرير السلامة",
    organization: "PROSAFE",
    generatedBy: "Admin",
    generatedAtIso: "2026-11-23T14:00:00.000Z",
    periodLabel: "2026",
    locale: "ar",
    kpis: {
      totalIncidents: 0,
      openIncidents: 0,
      resolutionRatePct: null,
      avgResolutionHours: null,
      trainingCompliancePct: null,
      overdueActions: 0,
    },
    incidents: [],
  });
  assert.ok(arHtml.includes('dir="rtl"'));
});
