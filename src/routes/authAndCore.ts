import { Router, type Response } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  alerts,
  audits,
  conversationMessages,
  conversations,
  correctiveActions,
  enrollments,
  incidentHistory,
  incidents,
  inventoryItems,
  maintenances,
  notificationPreferences,
  notifications,
  passwordResetRequests,
  rewards,
  risks,
  trainings,
  users,
} from "../db/schema.ts";
import { DEMO_ADMIN_EMAIL, ensureDemoDataSeeded } from "../db/seed.ts";
import { adminAuth } from "../lib/firebase-admin.ts";
import {
  computeRiskScore,
  forecastMonthlyCounts,
  signSessionToken,
} from "../lib/riskMath.ts";
import {
  requireAdmin,
  requireAuth,
  requireManager,
  syncFirebaseUser,
  toSafeUser,
  type AuthRequest,
} from "../middleware/auth.ts";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

function parsePositiveInt(raw: unknown): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parsePage(raw: unknown, fallback = 1): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : fallback;
}

function parseLimit(raw: unknown, fallback = 20, max = 200): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return Math.min(n, max);
}

function toPersonRef(u?: typeof users.$inferSelect | null) {
  if (!u) return null;
  return { id: u.id, firstName: u.firstName, lastName: u.lastName };
}

function formatAlert(
  a: typeof alerts.$inferSelect,
  userMap: Map<number, typeof users.$inferSelect>
) {
  const affected = a.affectedUserId ? userMap.get(a.affectedUserId) : undefined;
  const resolver = a.resolvedById ? userMap.get(a.resolvedById) : undefined;
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    severity: a.severity,
    status: a.status,
    type: a.type,
    affected_user_id: a.affectedUserId ?? undefined,
    affected_user: affected
      ? {
          id: affected.id,
          firstName: affected.firstName,
          lastName: affected.lastName,
          email: affected.email,
        }
      : undefined,
    resolved_by_id: a.resolvedById ?? undefined,
    resolved_by: resolver
      ? {
          id: resolver.id,
          firstName: resolver.firstName,
          lastName: resolver.lastName,
          email: resolver.email,
        }
      : undefined,
    resolved_at: a.resolvedAt ? a.resolvedAt.toISOString() : undefined,
    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
  };
}

function sendError(res: Response, status: number, message: string, err?: unknown) {
  if (err) {
    console.error(`[API ${status}] ${message}:`, err);
  }
  return res.status(status).json({ error: message, message });
}

async function safeEnsureSeed() {
  try {
    await ensureDemoDataSeeded();
  } catch (err) {
    console.error("Lazy seed check warning:", err);
  }
}

// ============================================================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================================================

router.post("/auth/demo", async (_req, res) => {
  try {
    await ensureDemoDataSeeded();
    const [demoUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, DEMO_ADMIN_EMAIL))
      .limit(1);

    if (!demoUser) {
      return sendError(res, 500, "Demo account could not be initialized.");
    }

    const safe = toSafeUser(demoUser);
    const access_token = signSessionToken({
      sub: safe.id,
      email: safe.email,
      roles: safe.roles,
    });
    return res.json({ access_token, user: safe });
  } catch (err) {
    return sendError(res, 500, "Failed to initialize demo session.", err);
  }
});

router.post("/auth/firebase", async (req, res) => {
  const idToken = typeof req.body?.idToken === "string" ? req.body.idToken.trim() : "";
  if (!idToken) {
    return sendError(res, 400, "Missing Firebase ID token.");
  }
  try {
    await safeEnsureSeed();
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.email) {
      return sendError(res, 400, "Verified account has no email address.");
    }
    const safe = await syncFirebaseUser({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    });
    if (!safe.isActive) {
      return sendError(res, 403, "This account has been deactivated.");
    }
    const access_token = signSessionToken({
      sub: safe.id,
      email: safe.email,
      roles: safe.roles,
    });
    return res.json({ access_token, user: safe });
  } catch (err) {
    return sendError(res, 401, "Invalid or expired Google sign-in token.", err);
  }
});

router.post("/auth/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return sendError(res, 400, "Email and password are required.");
  }

  try {
    await safeEnsureSeed();
    const [found] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!found || !found.passwordHash) {
      return sendError(res, 401, "Invalid email or password.");
    }
    if (!found.isActive) {
      return sendError(res, 403, "This account is currently disabled.");
    }

    const valid = await bcrypt.compare(password, found.passwordHash);
    if (!valid) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const safe = toSafeUser(found);
    const access_token = signSessionToken({
      sub: safe.id,
      email: safe.email,
      roles: safe.roles,
    });
    return res.json({ access_token, user: safe });
  } catch (err) {
    return sendError(res, 500, "Unable to sign in right now.", err);
  }
});

router.post("/auth/register", async (req, res) => {
  const firstName = typeof req.body?.firstName === "string" ? req.body.firstName.trim() : "";
  const lastName = typeof req.body?.lastName === "string" ? req.body.lastName.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!firstName || !lastName || !email || !email.includes("@") || password.length < 8) {
    return sendError(
      res,
      400,
      "Please provide first name, last name, valid email, and a password of at least 8 characters."
    );
  }

  try {
    await safeEnsureSeed();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return sendError(res, 409, "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [created] = await db
      .insert(users)
      .values({
        firstName: firstName.slice(0, 80),
        lastName: lastName.slice(0, 80),
        email: email.slice(0, 160),
        passwordHash,
        roles: ["employee"],
        department: "Operations",
        zone: "General",
        isActive: true,
      })
      .returning();

    await db
      .insert(notificationPreferences)
      .values({ userId: created.id })
      .onConflictDoNothing();

    const safe = toSafeUser(created);
    const access_token = signSessionToken({
      sub: safe.id,
      email: safe.email,
      roles: safe.roles,
    });
    return res.status(201).json({
      message: "Account created successfully.",
      access_token,
      user: safe,
    });
  } catch (err) {
    return sendError(res, 500, "Unable to complete registration.", err);
  }
});

router.post("/auth/forgot-password", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return sendError(res, 400, "Please enter a valid email address.");
  }
  try {
    await db.insert(passwordResetRequests).values({
      email: email.slice(0, 160),
      status: "requested",
    });
    // Always return generic confirmation to avoid account enumeration
    return res.json({
      message:
        "If an account matches this email address, password reset instructions have been queued for your administrator.",
    });
  } catch (err) {
    return sendError(res, 500, "Unable to process password reset request.", err);
  }
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  await safeEnsureSeed();
  return res.json({ user: req.user });
});

router.get("/auth/users", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    return res.json(rows.map(toSafeUser));
  } catch (err) {
    return sendError(res, 500, "Failed to load users.", err);
  }
});

router.put("/auth/users/:email/approve", requireAuth, requireAdmin, async (req, res) => {
  const email = decodeURIComponent(String(req.params.email || "")).toLowerCase();
  try {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!existing) return sendError(res, 404, "User not found.");
    const nextRoles = (existing.roles || []).filter((r) => r !== "pending");
    if (nextRoles.length === 0) nextRoles.push("employee");
    const [updated] = await db
      .update(users)
      .set({ roles: nextRoles, isActive: true })
      .where(eq(users.id, existing.id))
      .returning();
    return res.json(toSafeUser(updated));
  } catch (err) {
    return sendError(res, 500, "Failed to approve user.", err);
  }
});

router.put("/auth/users/:email/block", requireAuth, requireAdmin, async (req, res) => {
  const email = decodeURIComponent(String(req.params.email || "")).toLowerCase();
  try {
    const [updated] = await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.email, email))
      .returning();
    if (!updated) return sendError(res, 404, "User not found.");
    return res.json(toSafeUser(updated));
  } catch (err) {
    return sendError(res, 500, "Failed to block user.", err);
  }
});

router.put("/auth/users/:email/unblock", requireAuth, requireAdmin, async (req, res) => {
  const email = decodeURIComponent(String(req.params.email || "")).toLowerCase();
  try {
    const [updated] = await db
      .update(users)
      .set({ isActive: true })
      .where(eq(users.email, email))
      .returning();
    if (!updated) return sendError(res, 404, "User not found.");
    return res.json(toSafeUser(updated));
  } catch (err) {
    return sendError(res, 500, "Failed to unblock user.", err);
  }
});

router.put("/auth/users/:email/make-admin", requireAuth, requireAdmin, async (req, res) => {
  const email = decodeURIComponent(String(req.params.email || "")).toLowerCase();
  try {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!existing) return sendError(res, 404, "User not found.");
    const roles = Array.from(new Set([...(existing.roles || []), "admin"]));
    const [updated] = await db
      .update(users)
      .set({ roles })
      .where(eq(users.id, existing.id))
      .returning();
    return res.json(toSafeUser(updated));
  } catch (err) {
    return sendError(res, 500, "Failed to grant admin role.", err);
  }
});

router.put("/auth/users/:email/role", requireAuth, requireAdmin, async (req, res) => {
  const email = decodeURIComponent(String(req.params.email || "")).toLowerCase();
  const role = typeof req.body?.role === "string" ? req.body.role.trim() : "";
  const allowedRoles = new Set(["admin", "sst_manager", "employee"]);
  if (!allowedRoles.has(role)) {
    return sendError(res, 400, "Invalid role specified.");
  }
  try {
    const [updated] = await db
      .update(users)
      .set({ roles: [role] })
      .where(eq(users.email, email))
      .returning();
    if (!updated) return sendError(res, 404, "User not found.");
    return res.json(toSafeUser(updated));
  } catch (err) {
    return sendError(res, 500, "Failed to update role.", err);
  }
});

router.delete("/auth/users/:email", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const email = decodeURIComponent(String(req.params.email || "")).toLowerCase();
  if (req.user?.email.toLowerCase() === email) {
    return sendError(res, 400, "You cannot delete your own active account.");
  }
  try {
    const deleted = await db.delete(users).where(eq(users.email, email)).returning();
    if (deleted.length === 0) return sendError(res, 404, "User not found.");
    return res.json({ deleted: true });
  } catch (err) {
    return sendError(res, 500, "Failed to delete user.", err);
  }
});

// Directory & Profile
router.get("/users", requireAuth, async (req, res) => {
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 100);
  const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
  const role = typeof req.query.role === "string" ? req.query.role.trim() : "";

  try {
    const all = await db.select().from(users).orderBy(users.firstName);
    const filtered = all.filter((u) => {
      if (role && !(u.roles || []).includes(role)) return false;
      if (search) {
        const hay = `${u.firstName} ${u.lastName} ${u.email} ${u.department ?? ""}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit).map(toSafeUser);
    return res.json({ data, total: filtered.length, page, limit });
  } catch (err) {
    return sendError(res, 500, "Failed to list directory users.", err);
  }
});

router.patch("/users/profile", requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) return sendError(res, 401, "Unauthorized.");
  const updates: Partial<typeof users.$inferInsert> = {};
  if (typeof req.body?.firstName === "string" && req.body.firstName.trim()) {
    updates.firstName = req.body.firstName.trim().slice(0, 80);
  }
  if (typeof req.body?.lastName === "string" && req.body.lastName.trim()) {
    updates.lastName = req.body.lastName.trim().slice(0, 80);
  }
  if (typeof req.body?.department === "string") {
    updates.department = req.body.department.trim().slice(0, 80) || null;
  }
  if (typeof req.body?.zone === "string") {
    updates.zone = req.body.zone.trim().slice(0, 80) || null;
  }
  if (typeof req.body?.phone === "string") {
    updates.phone = req.body.phone.trim().slice(0, 40) || null;
  }

  try {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, req.user.id))
      .returning();
    return res.json({ user: toSafeUser(updated) });
  } catch (err) {
    return sendError(res, 500, "Failed to update profile.", err);
  }
});

router.patch("/users/change-password", requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) return sendError(res, 401, "Unauthorized.");
  const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  if (newPassword.length < 8) {
    return sendError(res, 400, "New password must be at least 8 characters long.");
  }

  try {
    const [row] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    if (!row) return sendError(res, 404, "User not found.");
    if (row.passwordHash) {
      const ok = await bcrypt.compare(currentPassword, row.passwordHash);
      if (!ok) return sendError(res, 400, "Current password is incorrect.");
    }
    const nextHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash: nextHash }).where(eq(users.id, row.id));
    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    return sendError(res, 500, "Failed to change password.", err);
  }
});

// ============================================================================
// STATS, KPIS, FORECAST & REPORTS
// ============================================================================

router.get("/stats/overview", requireAuth, async (_req, res) => {
  try {
    const [allIncidents, allAlerts, allInventory, allMaint, allEnroll] = await Promise.all([
      db.select().from(incidents),
      db.select().from(alerts),
      db.select().from(inventoryItems),
      db.select().from(maintenances),
      db.select().from(enrollments),
    ]);

    const open = allIncidents.filter((i) => i.status === "open").length;
    const investigating = allIncidents.filter((i) => i.status === "investigating").length;
    const resolved = allIncidents.filter((i) => i.status === "resolved").length;
    const closed = allIncidents.filter((i) => i.status === "closed").length;
    const criticalOpen = allIncidents.filter(
      (i) => i.severity === "critical" && (i.status === "open" || i.status === "investigating")
    ).length;

    const activeAlerts = allAlerts.filter(
      (a) => a.status === "unresolved" || a.status === "investigating" || a.status === "monitoring"
    ).length;

    const lowStock = allInventory.filter(
      (i) => i.quantity <= i.minStockLevel || i.status === "low_stock" || i.status === "out_of_stock"
    ).length;

    const now = Date.now();
    const overdueMaintenance = allMaint.filter(
      (m) => m.status === "overdue" || (m.status === "planned" && m.scheduledAt.getTime() < now)
    ).length;

    const thirtyDaysAhead = now + 30 * 24 * 60 * 60 * 1000;
    const expiringTrainings = allEnroll.filter(
      (e) => e.expiresAt && e.expiresAt.getTime() <= thirtyDaysAhead && e.expiresAt.getTime() >= now
    ).length;

    return res.json({
      incidents: {
        total: allIncidents.length,
        open,
        investigating,
        resolved,
        closed,
      },
      activeAlerts,
      criticalOpen,
      lowStock,
      overdueMaintenance,
      expiringTrainings,
    });
  } catch (err) {
    return sendError(res, 500, "Failed to compute overview statistics.", err);
  }
});

router.get("/stats/kpis", requireAuth, async (req, res) => {
  const fromDate = typeof req.query.from === "string" && req.query.from ? new Date(req.query.from) : null;
  const toDate = typeof req.query.to === "string" && req.query.to ? new Date(req.query.to) : null;

  try {
    const [allIncidents, allInventory, allActions, allAudits, allEnroll, allTrainings] =
      await Promise.all([
        db.select().from(incidents),
        db.select().from(inventoryItems),
        db.select().from(correctiveActions),
        db.select().from(audits),
        db.select().from(enrollments),
        db.select().from(trainings),
      ]);

    const filteredIncidents = allIncidents.filter((inc) => {
      const t = inc.timestamp.getTime();
      if (fromDate && !Number.isNaN(fromDate.getTime()) && t < fromDate.getTime()) return false;
      if (toDate && !Number.isNaN(toDate.getTime()) && t > toDate.getTime()) return false;
      return true;
    });

    const monthMap = new Map<string, number>();
    for (const inc of filteredIncidents) {
      const key = `${inc.timestamp.getUTCFullYear()}-${String(inc.timestamp.getUTCMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }
    const incidentsPerMonth = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    const resolvedHours: number[] = [];
    for (const inc of filteredIncidents) {
      if (inc.resolvedAt) {
        const diff = (inc.resolvedAt.getTime() - inc.createdAt.getTime()) / (1000 * 60 * 60);
        if (diff >= 0) resolvedHours.push(diff);
      }
    }
    const meanResolutionHours =
      resolvedHours.length > 0
        ? Math.round((resolvedHours.reduce((s, h) => s + h, 0) / resolvedHours.length) * 10) / 10
        : null;

    const functionalItems = allInventory.filter((i) => i.condition === "functional").length;
    const equipmentComplianceRate =
      allInventory.length > 0 ? Math.round((functionalItems / allInventory.length) * 100) : null;

    const passedEnrollments = allEnroll.filter((e) => e.status === "passed").length;
    const trainingComplianceRate =
      allTrainings.length > 0 && allEnroll.length > 0
        ? Math.min(100, Math.round((passedEnrollments / allEnroll.length) * 100))
        : null;

    const now = Date.now();
    const correctiveActionsOverdue = allActions.filter(
      (a) =>
        (a.status === "todo" || a.status === "in_progress") &&
        a.dueDate &&
        a.dueDate.getTime() < now
    ).length;

    const scoredAudits = allAudits.filter((a) => typeof a.score === "number");
    const auditComplianceRate =
      scoredAudits.length > 0
        ? Math.round(
            scoredAudits.reduce((s, a) => s + Number(a.score ?? 0), 0) / scoredAudits.length
          )
        : null;

    return res.json({
      incidentsPerMonth,
      meanResolutionHours,
      equipmentComplianceRate,
      trainingComplianceRate,
      correctiveActionsOverdue,
      auditComplianceRate,
    });
  } catch (err) {
    return sendError(res, 500, "Failed to compute KPI metrics.", err);
  }
});

router.get("/stats/incidents", requireAuth, async (req, res) => {
  const groupBy = typeof req.query.groupBy === "string" ? req.query.groupBy : "type";
  const fromDate = typeof req.query.from === "string" && req.query.from ? new Date(req.query.from) : null;
  const toDate = typeof req.query.to === "string" && req.query.to ? new Date(req.query.to) : null;
  const type = typeof req.query.type === "string" ? req.query.type : "";
  const department = typeof req.query.department === "string" ? req.query.department : "";

  try {
    const all = await db.select().from(incidents);
    const filtered = all.filter((inc) => {
      if (type && inc.type !== type) return false;
      if (department && inc.department !== department) return false;
      if (fromDate && !Number.isNaN(fromDate.getTime()) && inc.timestamp < fromDate) return false;
      if (toDate && !Number.isNaN(toDate.getTime()) && inc.timestamp > toDate) return false;
      return true;
    });

    const counts = new Map<string, number>();
    for (const inc of filtered) {
      let key = "unknown";
      if (groupBy === "month") {
        key = `${inc.timestamp.getUTCFullYear()}-${String(inc.timestamp.getUTCMonth() + 1).padStart(2, "0")}`;
      } else if (groupBy === "type") key = inc.type;
      else if (groupBy === "severity") key = inc.severity;
      else if (groupBy === "zone") key = inc.zone || "Unspecified";
      else if (groupBy === "department") key = inc.department || "Unspecified";
      else if (groupBy === "status") key = inc.status;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const result = Array.from(counts.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => (groupBy === "month" ? a.key.localeCompare(b.key) : b.count - a.count));

    return res.json(result);
  } catch (err) {
    return sendError(res, 500, "Failed to aggregate incidents.", err);
  }
});

router.get("/stats/forecast", requireAuth, async (req, res) => {
  const months = Math.max(1, Math.min(12, Number(req.query.months) || 3));
  try {
    const all = await db.select().from(incidents);
    const monthMap = new Map<string, number>();
    for (const inc of all) {
      const key = `${inc.timestamp.getUTCFullYear()}-${String(inc.timestamp.getUTCMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }
    const history = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    const forecast = forecastMonthlyCounts(history, months);
    return res.json({ history, forecast });
  } catch (err) {
    return sendError(res, 500, "Failed to forecast incident trend.", err);
  }
});

router.get("/admin/dashboard/stats", requireAuth, async (_req, res) => {
  try {
    const [allAlerts, allItems, allUsers, allIncidents, allActions, allMsgs] = await Promise.all([
      db.select().from(alerts),
      db.select().from(inventoryItems),
      db.select().from(users),
      db.select().from(incidents),
      db.select().from(correctiveActions),
      db.select().from(conversationMessages),
    ]);

    return res.json({
      alerts: {
        total: allAlerts.length,
        unresolved: allAlerts.filter((a) => a.status === "unresolved").length,
        critical: allAlerts.filter((a) => a.severity === "critical").length,
        high: allAlerts.filter((a) => a.severity === "high").length,
      },
      inventory: {
        totalItems: allItems.length,
        lowStockItems: allItems.filter((i) => i.quantity <= i.minStockLevel).length,
        outOfStockItems: allItems.filter((i) => i.quantity === 0).length,
        activeItems: allItems.filter((i) => i.status === "active").length,
        totalValue: allItems.reduce((s, i) => s + i.price * i.quantity, 0),
      },
      messages: {
        unreadCount: allMsgs.length,
      },
      totalUsers: allUsers.length,
      totalTasks: allActions.length,
      totalIncidents: allIncidents.length,
    });
  } catch (err) {
    return sendError(res, 500, "Failed to load admin dashboard stats.", err);
  }
});

router.get("/reports/:kind", requireAuth, requireManager, async (req, res) => {
  const kind = String(req.params.kind || "incidents");
  const format = req.query.format === "xlsx" ? "xlsx" : "pdf";
  const allowedKinds = new Set(["incidents", "equipment", "trainings", "risks", "audits"]);
  if (!allowedKinds.has(kind)) {
    return sendError(res, 400, "Unsupported report kind.");
  }

  try {
    let rows: Record<string, unknown>[] = [];
    if (kind === "incidents") rows = await db.select().from(incidents);
    else if (kind === "equipment") rows = await db.select().from(inventoryItems);
    else if (kind === "trainings") rows = await db.select().from(trainings);
    else if (kind === "risks") rows = await db.select().from(risks);
    else if (kind === "audits") rows = await db.select().from(audits);

    const headers = rows.length > 0 ? Object.keys(rows[0]) : ["info"];
    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const body = csvLines.join("\n");
    const ext = format === "xlsx" ? "csv" : "txt";
    res.setHeader("Content-Disposition", `attachment; filename="prosafe-${kind}-report.${ext}"`);
    res.setHeader("Content-Type", format === "xlsx" ? "text/csv; charset=utf-8" : "text/plain; charset=utf-8");
    return res.send(body);
  } catch (err) {
    return sendError(res, 500, "Failed to generate report.", err);
  }
});

// ============================================================================
// INCIDENTS
// ============================================================================

async function enrichIncidents(list: (typeof incidents.$inferSelect)[]) {
  const allUsers = await db.select().from(users);
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  return list.map((inc) => ({
    id: inc.id,
    incidentId: inc.incidentId,
    type: inc.type,
    severity: inc.severity,
    status: inc.status,
    description: inc.description,
    notes: inc.notes,
    zone: inc.zone,
    department: inc.department,
    timestamp: inc.timestamp.toISOString(),
    geoLatitude: inc.geoLatitude,
    geoLongitude: inc.geoLongitude,
    manualAddress: inc.manualAddress,
    reporter: toPersonRef(inc.reporterId ? userMap.get(inc.reporterId) : null),
    resolver: toPersonRef(inc.resolverId ? userMap.get(inc.resolverId) : null),
    media: [],
    evaluation:
      inc.gravity && inc.probability
        ? {
            gravity: inc.gravity,
            probability: inc.probability,
            riskScore: inc.riskScore ?? inc.gravity * inc.probability,
            rootCause: inc.rootCause,
            evaluatedSeverity: inc.evaluatedSeverity,
            evaluatedAt: (inc.evaluatedAt ?? inc.createdAt).toISOString(),
            evaluatedBy: toPersonRef(inc.evaluatedById ? userMap.get(inc.evaluatedById) : null),
          }
        : null,
    createdAt: inc.createdAt.toISOString(),
    resolvedAt: inc.resolvedAt ? inc.resolvedAt.toISOString() : null,
  }));
}

router.get("/incidents", requireAuth, async (req, res) => {
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 20);
  const conditions = [];

  if (typeof req.query.status === "string" && req.query.status) {
    conditions.push(eq(incidents.status, req.query.status));
  }
  if (typeof req.query.type === "string" && req.query.type) {
    conditions.push(eq(incidents.type, req.query.type));
  }
  if (typeof req.query.severity === "string" && req.query.severity) {
    conditions.push(eq(incidents.severity, req.query.severity));
  }
  if (typeof req.query.zone === "string" && req.query.zone) {
    conditions.push(ilike(incidents.zone, `%${req.query.zone}%`));
  }
  if (typeof req.query.department === "string" && req.query.department) {
    conditions.push(ilike(incidents.department, `%${req.query.department}%`));
  }
  if (typeof req.query.search === "string" && req.query.search.trim()) {
    const q = `%${req.query.search.trim()}%`;
    conditions.push(
      or(
        ilike(incidents.description, q),
        ilike(incidents.incidentId, q),
        ilike(incidents.zone, q)
      )!
    );
  }
  if (typeof req.query.from === "string" && req.query.from) {
    const d = new Date(req.query.from);
    if (!Number.isNaN(d.getTime())) conditions.push(gte(incidents.timestamp, d));
  }
  if (typeof req.query.to === "string" && req.query.to) {
    const d = new Date(req.query.to);
    if (!Number.isNaN(d.getTime())) conditions.push(lte(incidents.timestamp, d));
  }

  try {
    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(incidents)
            .where(and(...conditions))
            .orderBy(desc(incidents.timestamp))
        : await db.select().from(incidents).orderBy(desc(incidents.timestamp));

    const start = (page - 1) * limit;
    const enriched = await enrichIncidents(rows.slice(start, start + limit));
    return res.json({ data: enriched, total: rows.length, page, limit });
  } catch (err) {
    return sendError(res, 500, "Failed to load incidents.", err);
  }
});

router.get("/incidents/:id", requireAuth, async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) return sendError(res, 400, "Invalid incident ID.");

  try {
    const [row] = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
    if (!row) return sendError(res, 404, "Incident not found.");

    const [enriched] = await enrichIncidents([row]);
    const [histRows, actionRows, allUsers] = await Promise.all([
      db
        .select()
        .from(incidentHistory)
        .where(eq(incidentHistory.incidentId, id))
        .orderBy(desc(incidentHistory.changedAt)),
      db
        .select()
        .from(correctiveActions)
        .where(
          and(
            eq(correctiveActions.sourceType, "incident"),
            eq(correctiveActions.sourceId, id)
          )
        ),
      db.select().from(users),
    ]);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    return res.json({
      ...enriched,
      history: histRows.map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        comment: h.comment,
        changedAt: h.changedAt.toISOString(),
        changedBy: toPersonRef(h.changedById ? userMap.get(h.changedById) : null),
      })),
      correctiveActions: actionRows.map((a) => ({
        id: a.id,
        sourceType: a.sourceType,
        sourceId: a.sourceId,
        title: a.title,
        description: a.description,
        ownerId: a.ownerId,
        owner: toPersonRef(a.ownerId ? userMap.get(a.ownerId) : null),
        dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        status: a.status,
        doneAt: a.doneAt ? a.doneAt.toISOString() : null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return sendError(res, 500, "Failed to load incident details.", err);
  }
});

router.post("/incidents", requireAuth, upload.array("media", 5), async (req: AuthRequest, res) => {
  const type = typeof req.body?.type === "string" && req.body.type ? req.body.type : "safety";
  const severity =
    typeof req.body?.severity === "string" && req.body.severity ? req.body.severity : "medium";
  const description =
    typeof req.body?.description === "string" ? req.body.description.trim() : "";

  if (!description) {
    return sendError(res, 400, "Incident description is required.");
  }

  try {
    const code = `INC-${new Date().getUTCFullYear()}-${String(Date.now()).slice(-4)}`;
    const lat = req.body?.latitude !== undefined ? Number(req.body.latitude) : null;
    const lng = req.body?.longitude !== undefined ? Number(req.body.longitude) : null;

    const [created] = await db
      .insert(incidents)
      .values({
        incidentId: code,
        type,
        severity,
        status: "open",
        description: description.slice(0, 2000),
        notes: typeof req.body?.notes === "string" ? req.body.notes.slice(0, 2000) : null,
        zone: typeof req.body?.zone === "string" ? req.body.zone.slice(0, 120) : null,
        department:
          typeof req.body?.department === "string" ? req.body.department.slice(0, 120) : null,
        manualAddress:
          typeof req.body?.manualAddress === "string"
            ? req.body.manualAddress.slice(0, 240)
            : null,
        geoLatitude: lat !== null && Number.isFinite(lat) ? lat : null,
        geoLongitude: lng !== null && Number.isFinite(lng) ? lng : null,
        reporterId: req.user?.id ?? null,
        timestamp: req.body?.date ? new Date(req.body.date) : new Date(),
      })
      .returning();

    await db.insert(incidentHistory).values({
      incidentId: created.id,
      fromStatus: null,
      toStatus: "open",
      comment: "Incident submitted",
      changedById: req.user?.id ?? null,
    });

    if (req.user) {
      await db.insert(rewards).values({
        userId: req.user.id,
        points: 10,
        reason: `Reported incident ${code}`,
        incidentId: created.id,
      });
    }

    const [enriched] = await enrichIncidents([created]);
    return res.status(201).json({ ...enriched, rewardPoints: 10 });
  } catch (err) {
    return sendError(res, 500, "Failed to report incident.", err);
  }
});

router.patch("/incidents/:id/status", requireAuth, requireManager, async (req: AuthRequest, res) => {
  const id = parsePositiveInt(req.params.id);
  const nextStatus = typeof req.body?.status === "string" ? req.body.status : "";
  const allowed = new Set(["open", "investigating", "resolved", "closed"]);
  if (!id || !allowed.has(nextStatus)) {
    return sendError(res, 400, "Invalid incident ID or status.");
  }

  try {
    const [existing] = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
    if (!existing) return sendError(res, 404, "Incident not found.");

    const isResolved = nextStatus === "resolved" || nextStatus === "closed";
    const [updated] = await db
      .update(incidents)
      .set({
        status: nextStatus,
        resolverId: isResolved ? req.user?.id ?? null : existing.resolverId,
        resolvedAt: isResolved ? new Date() : existing.resolvedAt,
      })
      .where(eq(incidents.id, id))
      .returning();

    await db.insert(incidentHistory).values({
      incidentId: id,
      fromStatus: existing.status,
      toStatus: nextStatus,
      comment: typeof req.body?.comment === "string" ? req.body.comment.slice(0, 500) : null,
      changedById: req.user?.id ?? null,
    });

    const [enriched] = await enrichIncidents([updated]);
    return res.json(enriched);
  } catch (err) {
    return sendError(res, 500, "Failed to update incident status.", err);
  }
});

router.patch("/incidents/:id/evaluation", requireAuth, requireManager, async (req: AuthRequest, res) => {
  const id = parsePositiveInt(req.params.id);
  const gravity = Number(req.body?.gravity);
  const probability = Number(req.body?.probability);
  if (!id || !Number.isFinite(gravity) || !Number.isFinite(probability)) {
    return sendError(res, 400, "Valid gravity and probability (1-5) are required.");
  }

  try {
    const { score, level } = computeRiskScore(gravity, probability);
    const [updated] = await db
      .update(incidents)
      .set({
        gravity: Math.max(1, Math.min(5, Math.round(gravity))),
        probability: Math.max(1, Math.min(5, Math.round(probability))),
        riskScore: score,
        rootCause: typeof req.body?.rootCause === "string" ? req.body.rootCause.slice(0, 1000) : null,
        evaluatedSeverity:
          typeof req.body?.evaluatedSeverity === "string" ? req.body.evaluatedSeverity : level,
        evaluatedAt: new Date(),
        evaluatedById: req.user?.id ?? null,
      })
      .where(eq(incidents.id, id))
      .returning();

    if (!updated) return sendError(res, 404, "Incident not found.");
    const [enriched] = await enrichIncidents([updated]);
    return res.json(enriched);
  } catch (err) {
    return sendError(res, 500, "Failed to evaluate incident.", err);
  }
});

// ============================================================================
// NOTIFICATIONS & PREFERENCES
// ============================================================================

router.get("/notifications", requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) return sendError(res, 401, "Unauthorized.");
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 20);
  const unreadOnly = req.query.unread === "true";

  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.user.id))
      .orderBy(desc(notifications.createdAt));

    const filtered = unreadOnly ? rows.filter((r) => !r.readAt) : rows;
    const start = (page - 1) * limit;
    return res.json({
      data: filtered.slice(start, start + limit).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data ?? null,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
      })),
      total: filtered.length,
      page,
      limit,
    });
  } catch (err) {
    return sendError(res, 500, "Failed to load notifications.", err);
  }
});

router.patch("/notifications/read-all", requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) return sendError(res, 401, "Unauthorized.");
  try {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.userId, req.user.id));
    return res.json({ updated: true });
  } catch (err) {
    return sendError(res, 500, "Failed to mark all notifications read.", err);
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req: AuthRequest, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id || !req.user) return sendError(res, 400, "Invalid notification ID.");
  try {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, req.user.id)));
    return res.json({ updated: true });
  } catch (err) {
    return sendError(res, 500, "Failed to mark notification read.", err);
  }
});

router.get("/notifications/preferences", requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) return sendError(res, 401, "Unauthorized.");
  try {
    const [existing] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, req.user.id))
      .limit(1);

    if (existing) {
      return res.json({
        incidents: existing.incidents,
        trainings: existing.trainings,
        audits: existing.audits,
        inventory: existing.inventory,
        emergency: existing.emergency,
        messages: existing.messages,
        push: existing.push,
        email: existing.email,
      });
    }

    const [created] = await db
      .insert(notificationPreferences)
      .values({ userId: req.user.id })
      .returning();

    return res.json({
      incidents: created.incidents,
      trainings: created.trainings,
      audits: created.audits,
      inventory: created.inventory,
      emergency: created.emergency,
      messages: created.messages,
      push: created.push,
      email: created.email,
    });
  } catch (err) {
    return sendError(res, 500, "Failed to load notification preferences.", err);
  }
});

router.put("/notifications/preferences", requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) return sendError(res, 401, "Unauthorized.");
  const payload = {
    incidents: Boolean(req.body?.incidents ?? true),
    trainings: Boolean(req.body?.trainings ?? true),
    audits: Boolean(req.body?.audits ?? true),
    inventory: Boolean(req.body?.inventory ?? true),
    emergency: Boolean(req.body?.emergency ?? true),
    messages: Boolean(req.body?.messages ?? true),
    push: Boolean(req.body?.push ?? true),
    email: Boolean(req.body?.email ?? true),
  };

  try {
    const [saved] = await db
      .insert(notificationPreferences)
      .values({ userId: req.user.id, ...payload })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: payload,
      })
      .returning();

    return res.json({
      incidents: saved.incidents,
      trainings: saved.trainings,
      audits: saved.audits,
      inventory: saved.inventory,
      emergency: saved.emergency,
      messages: saved.messages,
      push: saved.push,
      email: saved.email,
    });
  } catch (err) {
    return sendError(res, 500, "Failed to update notification preferences.", err);
  }
});

// ============================================================================
// ALERTS (mounted at both /alerts and /admin/alerts for compatibility)
// ============================================================================

async function handleListAlerts(req: AuthRequest, res: Response) {
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 10);
  const severity = typeof req.query.severity === "string" ? req.query.severity : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";

  try {
    const [allAlerts, allUsers] = await Promise.all([
      db.select().from(alerts).orderBy(desc(alerts.createdAt)),
      db.select().from(users),
    ]);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const filtered = allAlerts.filter((a) => {
      if (severity && a.severity !== severity) return false;
      if (status && a.status !== status) return false;
      return true;
    });
    const start = (page - 1) * limit;
    return res.json({
      alerts: filtered.slice(start, start + limit).map((a) => formatAlert(a, userMap)),
      total: filtered.length,
      page,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    });
  } catch (err) {
    return sendError(res, 500, "Failed to load alerts.", err);
  }
}

async function handleAlertStats(_req: AuthRequest, res: Response) {
  try {
    const allAlerts = await db.select().from(alerts);
    return res.json({
      total: allAlerts.length,
      unresolved: allAlerts.filter((a) => a.status === "unresolved").length,
      critical: allAlerts.filter((a) => a.severity === "critical").length,
      high: allAlerts.filter((a) => a.severity === "high").length,
    });
  } catch (err) {
    return sendError(res, 500, "Failed to load alert stats.", err);
  }
}

router.get("/alerts", requireAuth, handleListAlerts);
router.get("/admin/alerts", requireAuth, handleListAlerts);
router.get("/alerts/stats", requireAuth, handleAlertStats);
router.get("/admin/alerts/stats", requireAuth, handleAlertStats);

router.post("/alerts", requireAuth, requireManager, async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
  if (!title || !description) return sendError(res, 400, "Title and description are required.");

  try {
    const [created] = await db
      .insert(alerts)
      .values({
        title: title.slice(0, 200),
        description: description.slice(0, 1000),
        severity: typeof req.body?.severity === "string" ? req.body.severity : "medium",
        type: typeof req.body?.type === "string" ? req.body.type : "system",
        status: "unresolved",
        affectedUserId: parsePositiveInt(req.body?.affected_user_id),
      })
      .returning();

    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    return res.status(201).json(formatAlert(created, userMap));
  } catch (err) {
    return sendError(res, 500, "Failed to create alert.", err);
  }
});

router.patch("/alerts/:id", requireAuth, requireManager, async (req: AuthRequest, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) return sendError(res, 400, "Invalid alert ID.");
  const status = typeof req.body?.status === "string" ? req.body.status : undefined;

  try {
    const isResolved = status === "resolved" || status === "dismissed";
    const [updated] = await db
      .update(alerts)
      .set({
        ...(status ? { status } : {}),
        ...(isResolved ? { resolvedAt: new Date(), resolvedById: req.user?.id ?? null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();

    if (!updated) return sendError(res, 404, "Alert not found.");
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    return res.json(formatAlert(updated, userMap));
  } catch (err) {
    return sendError(res, 500, "Failed to update alert.", err);
  }
});

router.delete("/alerts/:id", requireAuth, requireManager, async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) return sendError(res, 400, "Invalid alert ID.");
  try {
    await db.delete(alerts).where(eq(alerts.id, id));
    return res.json({ deleted: true });
  } catch (err) {
    return sendError(res, 500, "Failed to delete alert.", err);
  }
});

// Admin broadcast messages compatibility for AdminNotifications component
router.get("/admin/messages", requireAuth, async (_req, res) => {
  try {
    const [allConvs, allMsgs, allUsers] = await Promise.all([
      db.select().from(conversations).orderBy(desc(conversations.updatedAt)),
      db.select().from(conversationMessages).orderBy(desc(conversationMessages.createdAt)),
      db.select().from(users),
    ]);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const convMap = new Map(allConvs.map((c) => [c.id, c]));

    return res.json(
      allMsgs.slice(0, 30).map((m) => {
        const sender = m.senderId ? userMap.get(m.senderId) : undefined;
        const conv = convMap.get(m.conversationId);
        return {
          id: m.id,
          subject: conv?.subject ?? "Safety Notice",
          content: m.body,
          sender: sender ? toSafeUser(sender) : null,
          status: "read",
          is_urgent: false,
          created_at: m.createdAt.toISOString(),
        };
      })
    );
  } catch (err) {
    return sendError(res, 500, "Failed to load admin messages.", err);
  }
});

router.post("/admin/messages", requireAuth, requireManager, async (req: AuthRequest, res) => {
  const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : "Safety Broadcast";
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content) return sendError(res, 400, "Message content is required.");

  try {
    const [conv] = await db
      .insert(conversations)
      .values({
        subject: subject.slice(0, 200),
        participantIds: req.user ? [req.user.id] : [],
      })
      .returning();

    const [msg] = await db
      .insert(conversationMessages)
      .values({
        conversationId: conv.id,
        senderId: req.user?.id ?? null,
        body: content.slice(0, 2000),
        readByIds: req.user ? [req.user.id] : [],
      })
      .returning();

    return res.status(201).json({
      id: msg.id,
      subject: conv.subject,
      content: msg.body,
      sender: req.user,
      status: "unread",
      is_urgent: Boolean(req.body?.is_urgent),
      created_at: msg.createdAt.toISOString(),
    });
  } catch (err) {
    return sendError(res, 500, "Failed to send message.", err);
  }
});

export default router;
