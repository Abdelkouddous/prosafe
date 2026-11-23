import { Router, type Response } from "express";
import multer from "multer";
import { and, desc, eq } from "drizzle-orm";
import type { Namespace } from "socket.io";
import { db } from "../db/index.ts";
import {
  actionPlans,
  auditResponses,
  audits,
  checklistTemplates,
  complianceDocuments,
  conversationMessages,
  conversations,
  correctiveActions,
  drills,
  emergencyEvents,
  emergencyScenarios,
  enrollments,
  feedbackItems,
  inventoryItems,
  lmraAssessments,
  maintenances,
  notifications,
  rewards,
  risks,
  trainingSessions,
  trainings,
  users,
} from "../db/schema.ts";
import {
  computeAuditScore,
  computeRewardBadge,
  computeRiskScore,
} from "../lib/riskMath.ts";
import {
  requireAuth,
  requireManager,
  type AuthRequest,
} from "../middleware/auth.ts";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
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

function sendError(res: Response, status: number, message: string, err?: unknown) {
  if (err) {
    console.error(`[API ${status}] ${message}:`, err);
  }
  return res.status(status).json({ error: message, message });
}

function formatInventoryItem(item: typeof inventoryItems.$inferSelect) {
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    description: item.description,
    price: item.price,
    quantity: item.quantity,
    min_stock_level: item.minStockLevel,
    category: item.category,
    status: item.status,
    condition: item.condition,
    expiryDate: item.expiryDate ? item.expiryDate.toISOString() : null,
    lastInspectionAt: item.lastInspectionAt ? item.lastInspectionAt.toISOString() : null,
    nextInspectionAt: item.nextInspectionAt ? item.nextInspectionAt.toISOString() : null,
    supplier: item.supplier,
    location: item.location,
    created_at: item.createdAt.toISOString(),
    updated_at: item.updatedAt.toISOString(),
  };
}

export function createSafetyModulesRouter(wsNamespace?: Namespace) {
  const router = Router();

  // ==========================================================================
  // INVENTORY & EQUIPMENT
  // ==========================================================================

  router.get("/inventory/stats", requireAuth, async (_req, res) => {
    try {
      const items = await db.select().from(inventoryItems);
      return res.json({
        totalItems: items.length,
        lowStockItems: items.filter((i) => i.quantity > 0 && i.quantity <= i.minStockLevel).length,
        outOfStockItems: items.filter((i) => i.quantity <= 0).length,
        activeItems: items.filter((i) => i.status === "active").length,
        nonFunctionalItems: items.filter((i) => i.condition === "non_functional").length,
        totalValue: items.reduce((s, i) => s + i.price * i.quantity, 0),
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load inventory stats.", err);
    }
  });

  router.get("/inventory", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 20);
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const condition = typeof req.query.condition === "string" ? req.query.condition : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";

    try {
      const all = await db.select().from(inventoryItems).orderBy(desc(inventoryItems.createdAt));
      const filtered = all.filter((item) => {
        if (category && item.category !== category) return false;
        if (status && item.status !== status) return false;
        if (condition && item.condition !== condition) return false;
        if (search) {
          const hay = `${item.name} ${item.sku} ${item.location ?? ""} ${item.supplier ?? ""}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      });
      const start = (page - 1) * limit;
      const formatted = filtered.slice(start, start + limit).map(formatInventoryItem);
      return res.json({
        data: formatted,
        items: formatted,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load inventory.", err);
    }
  });

  router.get("/inventory/:id", requireAuth, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid inventory ID.");
    try {
      const [item] = await db
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, id))
        .limit(1);
      if (!item) return sendError(res, 404, "Equipment item not found.");
      return res.json(formatInventoryItem(item));
    } catch (err) {
      return sendError(res, 500, "Failed to load equipment item.", err);
    }
  });

  router.post("/inventory", requireAuth, requireManager, async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const sku = typeof req.body?.sku === "string" ? req.body.sku.trim() : "";
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
    if (!name || !sku) return sendError(res, 400, "Equipment name and SKU are required.");

    const quantity = Math.max(0, Number(req.body?.quantity ?? 0));
    const minStock = Math.max(0, Number(req.body?.min_stock_level ?? 5));
    const computedStatus =
      req.body?.status ||
      (quantity === 0 ? "out_of_stock" : quantity <= minStock ? "low_stock" : "active");

    try {
      const [created] = await db
        .insert(inventoryItems)
        .values({
          name: name.slice(0, 160),
          sku: sku.slice(0, 80),
          description: (description || name).slice(0, 1000),
          price: Math.max(0, Number(req.body?.price ?? 0)),
          quantity,
          minStockLevel: minStock,
          category: typeof req.body?.category === "string" ? req.body.category : "ppe",
          status: computedStatus,
          condition: typeof req.body?.condition === "string" ? req.body.condition : "functional",
          expiryDate: req.body?.expiryDate ? new Date(req.body.expiryDate) : null,
          lastInspectionAt: req.body?.lastInspectionAt ? new Date(req.body.lastInspectionAt) : null,
          nextInspectionAt: req.body?.nextInspectionAt ? new Date(req.body.nextInspectionAt) : null,
          supplier: typeof req.body?.supplier === "string" ? req.body.supplier.slice(0, 120) : null,
          location: typeof req.body?.location === "string" ? req.body.location.slice(0, 120) : null,
        })
        .returning();
      return res.status(201).json(formatInventoryItem(created));
    } catch (err) {
      return sendError(res, 500, "Failed to create equipment item.", err);
    }
  });

  router.patch("/inventory/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid equipment ID.");

    const updates: Partial<typeof inventoryItems.$inferInsert> = { updatedAt: new Date() };
    if (typeof req.body?.name === "string") updates.name = req.body.name.trim().slice(0, 160);
    if (typeof req.body?.sku === "string") updates.sku = req.body.sku.trim().slice(0, 80);
    if (typeof req.body?.description === "string")
      updates.description = req.body.description.slice(0, 1000);
    if (req.body?.price !== undefined) updates.price = Math.max(0, Number(req.body.price));
    if (req.body?.quantity !== undefined) updates.quantity = Math.max(0, Number(req.body.quantity));
    if (req.body?.min_stock_level !== undefined)
      updates.minStockLevel = Math.max(0, Number(req.body.min_stock_level));
    if (typeof req.body?.category === "string") updates.category = req.body.category;
    if (typeof req.body?.status === "string") updates.status = req.body.status;
    if (typeof req.body?.condition === "string") updates.condition = req.body.condition;
    if (req.body?.expiryDate !== undefined)
      updates.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;
    if (req.body?.nextInspectionAt !== undefined)
      updates.nextInspectionAt = req.body.nextInspectionAt
        ? new Date(req.body.nextInspectionAt)
        : null;
    if (typeof req.body?.supplier === "string") updates.supplier = req.body.supplier.slice(0, 120);
    if (typeof req.body?.location === "string") updates.location = req.body.location.slice(0, 120);

    try {
      const [updated] = await db
        .update(inventoryItems)
        .set(updates)
        .where(eq(inventoryItems.id, id))
        .returning();
      if (!updated) return sendError(res, 404, "Equipment item not found.");
      return res.json(formatInventoryItem(updated));
    } catch (err) {
      return sendError(res, 500, "Failed to update equipment item.", err);
    }
  });

  router.delete("/inventory/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid equipment ID.");
    try {
      await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
      return res.json({ deleted: true });
    } catch (err) {
      return sendError(res, 500, "Failed to delete equipment item.", err);
    }
  });

  // ==========================================================================
  // MAINTENANCE
  // ==========================================================================

  router.get("/maintenance", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 50);
    const itemId = parsePositiveInt(req.query.itemId);
    const status = typeof req.query.status === "string" ? req.query.status : "";

    try {
      const [allMaint, allItems, allUsers] = await Promise.all([
        db.select().from(maintenances).orderBy(desc(maintenances.scheduledAt)),
        db.select().from(inventoryItems),
        db.select().from(users),
      ]);
      const itemMap = new Map(allItems.map((i) => [i.id, i]));
      const userMap = new Map(allUsers.map((u) => [u.id, u]));

      const filtered = allMaint.filter((m) => {
        if (itemId && m.itemId !== itemId) return false;
        if (status && m.status !== status) return false;
        return true;
      });

      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit).map((m) => {
          const item = itemMap.get(m.itemId);
          return {
            id: m.id,
            itemId: m.itemId,
            type: m.type,
            scheduledAt: m.scheduledAt.toISOString(),
            doneAt: m.doneAt ? m.doneAt.toISOString() : null,
            performedById: m.performedById,
            result: m.result,
            notes: m.notes,
            status: m.status,
            item: item
              ? {
                  id: item.id,
                  name: item.name,
                  category: item.category,
                  condition: item.condition,
                  location: item.location,
                }
              : undefined,
            performedBy: toPersonRef(m.performedById ? userMap.get(m.performedById) : null),
          };
        }),
        total: filtered.length,
        page,
        limit,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load maintenance records.", err);
    }
  });

  router.post("/maintenance", requireAuth, requireManager, async (req, res) => {
    const itemId = parsePositiveInt(req.body?.itemId);
    if (!itemId || !req.body?.scheduledAt) {
      return sendError(res, 400, "Equipment item and scheduled date are required.");
    }
    try {
      const [created] = await db
        .insert(maintenances)
        .values({
          itemId,
          type: typeof req.body?.type === "string" ? req.body.type : "inspection",
          scheduledAt: new Date(req.body.scheduledAt),
          notes: typeof req.body?.notes === "string" ? req.body.notes.slice(0, 1000) : null,
          status: "planned",
        })
        .returning();
      return res.status(201).json(created);
    } catch (err) {
      return sendError(res, 500, "Failed to schedule maintenance.", err);
    }
  });

  router.patch("/maintenance/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid maintenance ID.");
    const updates: Partial<typeof maintenances.$inferInsert> = {};
    if (typeof req.body?.type === "string") updates.type = req.body.type;
    if (req.body?.scheduledAt) updates.scheduledAt = new Date(req.body.scheduledAt);
    if (typeof req.body?.notes === "string") updates.notes = req.body.notes.slice(0, 1000);
    if (typeof req.body?.status === "string") updates.status = req.body.status;

    try {
      const [updated] = await db
        .update(maintenances)
        .set(updates)
        .where(eq(maintenances.id, id))
        .returning();
      if (!updated) return sendError(res, 404, "Maintenance entry not found.");
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to update maintenance.", err);
    }
  });

  router.patch("/maintenance/:id/complete", requireAuth, requireManager, async (req: AuthRequest, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid maintenance ID.");
    const result = typeof req.body?.result === "string" ? req.body.result : "ok";
    const doneAt = req.body?.doneAt ? new Date(req.body.doneAt) : new Date();

    try {
      const [updated] = await db
        .update(maintenances)
        .set({
          status: "done",
          result,
          doneAt,
          performedById: req.user?.id ?? null,
          notes: typeof req.body?.notes === "string" ? req.body.notes.slice(0, 1000) : undefined,
        })
        .where(eq(maintenances.id, id))
        .returning();

      if (!updated) return sendError(res, 404, "Maintenance entry not found.");

      await db
        .update(inventoryItems)
        .set({
          condition: result === "failed" ? "non_functional" : "functional",
          lastInspectionAt: doneAt,
          nextInspectionAt: req.body?.nextScheduledAt ? new Date(req.body.nextScheduledAt) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, updated.itemId));

      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to complete maintenance.", err);
    }
  });

  // ==========================================================================
  // TRAININGS, SESSIONS, ENROLLMENTS & COMPLIANCE
  // ==========================================================================

  router.get("/trainings/sessions", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 50);
    const trainingId = parsePositiveInt(req.query.trainingId);
    const status = typeof req.query.status === "string" ? req.query.status : "";

    try {
      const [allSessions, allTrainings, allEnrollments] = await Promise.all([
        db.select().from(trainingSessions).orderBy(desc(trainingSessions.startAt)),
        db.select().from(trainings),
        db.select().from(enrollments),
      ]);
      const trainingMap = new Map(allTrainings.map((t) => [t.id, t]));
      const filtered = allSessions.filter((s) => {
        if (trainingId && s.trainingId !== trainingId) return false;
        if (status && s.status !== status) return false;
        return true;
      });
      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit).map((s) => ({
          id: s.id,
          trainingId: s.trainingId,
          startAt: s.startAt.toISOString(),
          endAt: s.endAt ? s.endAt.toISOString() : null,
          location: s.location,
          trainer: s.trainer,
          capacity: s.capacity,
          status: s.status,
          enrolledCount: allEnrollments.filter((e) => e.sessionId === s.id).length,
          training: trainingMap.get(s.trainingId),
        })),
        total: filtered.length,
        page,
        limit,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load training sessions.", err);
    }
  });

  router.post("/trainings/sessions", requireAuth, requireManager, async (req, res) => {
    const trainingId = parsePositiveInt(req.body?.trainingId);
    if (!trainingId || !req.body?.startAt) {
      return sendError(res, 400, "Training and start date are required.");
    }
    try {
      const [created] = await db
        .insert(trainingSessions)
        .values({
          trainingId,
          startAt: new Date(req.body.startAt),
          endAt: req.body?.endAt ? new Date(req.body.endAt) : null,
          location: typeof req.body?.location === "string" ? req.body.location.slice(0, 160) : null,
          trainer: typeof req.body?.trainer === "string" ? req.body.trainer.slice(0, 120) : null,
          capacity: req.body?.capacity ? Number(req.body.capacity) : 15,
          status: typeof req.body?.status === "string" ? req.body.status : "planned",
        })
        .returning();
      return res.status(201).json({ ...created, enrolledCount: 0 });
    } catch (err) {
      return sendError(res, 500, "Failed to create training session.", err);
    }
  });

  router.patch("/trainings/sessions/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid session ID.");
    const updates: Partial<typeof trainingSessions.$inferInsert> = {};
    if (req.body?.startAt) updates.startAt = new Date(req.body.startAt);
    if (req.body?.endAt !== undefined) updates.endAt = req.body.endAt ? new Date(req.body.endAt) : null;
    if (typeof req.body?.location === "string") updates.location = req.body.location.slice(0, 160);
    if (typeof req.body?.trainer === "string") updates.trainer = req.body.trainer.slice(0, 120);
    if (req.body?.capacity !== undefined) updates.capacity = Number(req.body.capacity);
    if (typeof req.body?.status === "string") updates.status = req.body.status;

    try {
      const [updated] = await db
        .update(trainingSessions)
        .set(updates)
        .where(eq(trainingSessions.id, id))
        .returning();
      if (!updated) return sendError(res, 404, "Session not found.");
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to update training session.", err);
    }
  });

  router.delete("/trainings/sessions/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid session ID.");
    try {
      await db.delete(trainingSessions).where(eq(trainingSessions.id, id));
      return res.json({ deleted: true });
    } catch (err) {
      return sendError(res, 500, "Failed to delete session.", err);
    }
  });

  router.get("/trainings/sessions/:id/enrollments", requireAuth, async (req, res) => {
    const sessionId = parsePositiveInt(req.params.id);
    if (!sessionId) return sendError(res, 400, "Invalid session ID.");
    try {
      const [rows, allUsers] = await Promise.all([
        db.select().from(enrollments).where(eq(enrollments.sessionId, sessionId)),
        db.select().from(users),
      ]);
      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      return res.json({
        data: rows.map((e) => {
          const u = userMap.get(e.userId);
          return {
            ...e,
            completedAt: e.completedAt ? e.completedAt.toISOString() : null,
            expiresAt: e.expiresAt ? e.expiresAt.toISOString() : null,
            user: u
              ? { id: u.id, firstName: u.firstName, lastName: u.lastName, department: u.department }
              : undefined,
          };
        }),
        total: rows.length,
        page: 1,
        limit: 100,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load enrollments.", err);
    }
  });

  router.post("/trainings/sessions/:id/enroll", requireAuth, requireManager, async (req, res) => {
    const sessionId = parsePositiveInt(req.params.id);
    const userId = parsePositiveInt(req.body?.userId);
    if (!sessionId || !userId) return sendError(res, 400, "Session and user IDs are required.");
    try {
      const [created] = await db
        .insert(enrollments)
        .values({ sessionId, userId, status: "registered", progress: 0 })
        .returning();
      return res.status(201).json(created);
    } catch (err) {
      return sendError(res, 500, "Failed to enroll user.", err);
    }
  });

  router.delete("/trainings/sessions/:id/enroll", requireAuth, requireManager, async (req, res) => {
    const sessionId = parsePositiveInt(req.params.id);
    const userId = parsePositiveInt(req.query.userId);
    if (!sessionId || !userId) return sendError(res, 400, "Session and user IDs are required.");
    try {
      await db
        .delete(enrollments)
        .where(and(eq(enrollments.sessionId, sessionId), eq(enrollments.userId, userId)));
      return res.json({ deleted: true });
    } catch (err) {
      return sendError(res, 500, "Failed to remove enrollment.", err);
    }
  });

  router.patch("/trainings/enrollments/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid enrollment ID.");
    const updates: Partial<typeof enrollments.$inferInsert> = {};
    if (typeof req.body?.status === "string") {
      updates.status = req.body.status;
      if (req.body.status === "passed") {
        updates.completedAt = new Date();
        updates.progress = 100;
        updates.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }
    }
    if (req.body?.score !== undefined) updates.score = Number(req.body.score);
    if (req.body?.progress !== undefined) updates.progress = Number(req.body.progress);

    try {
      const [updated] = await db
        .update(enrollments)
        .set(updates)
        .where(eq(enrollments.id, id))
        .returning();
      if (!updated) return sendError(res, 404, "Enrollment not found.");
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to update enrollment.", err);
    }
  });

  async function buildSkillsReport(departmentFilter?: string) {
    const [allUsers, allTrainings, allSessions, allEnrollments] = await Promise.all([
      db.select().from(users),
      db.select().from(trainings),
      db.select().from(trainingSessions),
      db.select().from(enrollments),
    ]);

    const sessionToTraining = new Map(allSessions.map((s) => [s.id, s.trainingId]));
    const activeUsers = allUsers.filter(
      (u) =>
        u.isActive &&
        (!departmentFilter ||
          (u.department || "").toLowerCase() === departmentFilter.toLowerCase())
    );

    const now = Date.now();
    const soon = now + 30 * 24 * 60 * 60 * 1000;
    let totalAcquired = 0;
    let totalExpiring = 0;
    let totalMissing = 0;
    let compliantUsers = 0;

    const userRows = activeUsers.map((u) => {
      const mandatory = allTrainings.filter(
        (t) => t.isActive && (t.mandatoryForRoles || []).some((r) => (u.roles || []).includes(r))
      );
      const userPassed = allEnrollments.filter(
        (e) => e.userId === u.id && e.status === "passed"
      );

      const acquired = [];
      const expiring = [];
      const missing = [];

      for (const t of mandatory) {
        const match = userPassed.find((e) => sessionToTraining.get(e.sessionId) === t.id);
        if (!match) {
          missing.push({ trainingId: t.id, title: t.title });
          totalMissing++;
        } else if (match.expiresAt && match.expiresAt.getTime() < now) {
          missing.push({
            trainingId: t.id,
            title: t.title,
            expired: true,
            expiresAt: match.expiresAt.toISOString(),
          });
          totalMissing++;
        } else if (match.expiresAt && match.expiresAt.getTime() <= soon) {
          expiring.push({
            trainingId: t.id,
            title: t.title,
            expiresAt: match.expiresAt.toISOString(),
          });
          totalExpiring++;
          acquired.push({
            trainingId: t.id,
            title: t.title,
            expiresAt: match.expiresAt.toISOString(),
          });
          totalAcquired++;
        } else {
          acquired.push({
            trainingId: t.id,
            title: t.title,
            expiresAt: match.expiresAt ? match.expiresAt.toISOString() : null,
          });
          totalAcquired++;
        }
      }

      if (missing.length === 0) compliantUsers++;

      return {
        userId: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        department: u.department,
        acquired,
        expiring,
        missing,
      };
    });

    return {
      department: departmentFilter || null,
      generatedAt: new Date().toISOString(),
      summary: {
        users: userRows.length,
        compliantUsers,
        complianceRate:
          userRows.length > 0 ? Math.round((compliantUsers / userRows.length) * 100) : 100,
        acquired: totalAcquired,
        expiring: totalExpiring,
        missing: totalMissing,
      },
      users: userRows,
      allSessions,
    };
  }

  router.get("/trainings/skills-report", requireAuth, async (req, res) => {
    const department = typeof req.query.department === "string" ? req.query.department : undefined;
    try {
      const report = await buildSkillsReport(department);
      return res.json({
        department: report.department,
        generatedAt: report.generatedAt,
        summary: report.summary,
        users: report.users,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to compute skills report.", err);
    }
  });

  router.post("/trainings/auto-plan", requireAuth, requireManager, async (req, res) => {
    const department = typeof req.body?.department === "string" ? req.body.department : undefined;
    const dryRun = Boolean(req.body?.dryRun);
    try {
      const report = await buildSkillsReport(department);
      const needing = report.users.filter((u) => u.missing.length > 0);
      const now = Date.now();
      let notified = 0;

      const enriched = needing.map((u) => ({
        userId: u.userId,
        firstName: u.firstName,
        lastName: u.lastName,
        department: u.department,
        missing: u.missing.map((m) => {
          const next = report.allSessions.find(
            (s) => s.trainingId === m.trainingId && s.status === "planned" && s.startAt.getTime() > now
          );
          return {
            ...m,
            nextSession: next ? { id: next.id, startAt: next.startAt.toISOString() } : null,
          };
        }),
      }));

      if (!dryRun && enriched.length > 0) {
        await db.insert(notifications).values(
          enriched.map((u) => ({
            userId: u.userId,
            type: "training",
            title: "Mandatory safety training reminder",
            body: `You have ${u.missing.length} required training(s) to schedule.`,
          }))
        );
        notified = enriched.length;
      }

      return res.json({
        total: enriched.length,
        notified,
        dryRun,
        users: enriched,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to run auto-plan.", err);
    }
  });

  router.get("/trainings", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 50);
    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
    const category = typeof req.query.category === "string" ? req.query.category : "";

    try {
      const all = await db.select().from(trainings).orderBy(desc(trainings.createdAt));
      const filtered = all.filter((t) => {
        if (category && t.category !== category) return false;
        if (search && !`${t.title} ${t.description ?? ""}`.toLowerCase().includes(search)) return false;
        return true;
      });
      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit),
        total: filtered.length,
        page,
        limit,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load trainings.", err);
    }
  });

  router.post("/trainings", requireAuth, requireManager, async (req, res) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) return sendError(res, 400, "Training title is required.");
    try {
      const [created] = await db
        .insert(trainings)
        .values({
          title: title.slice(0, 180),
          description: typeof req.body?.description === "string" ? req.body.description.slice(0, 1000) : null,
          category: typeof req.body?.category === "string" ? req.body.category.slice(0, 80) : null,
          durationHours: req.body?.durationHours ? Number(req.body.durationHours) : null,
          validityMonths: req.body?.validityMonths ? Number(req.body.validityMonths) : 12,
          mandatoryForRoles: Array.isArray(req.body?.mandatoryForRoles) ? req.body.mandatoryForRoles : [],
          isActive: req.body?.isActive !== false,
        })
        .returning();
      return res.status(201).json(created);
    } catch (err) {
      return sendError(res, 500, "Failed to create training.", err);
    }
  });

  router.patch("/trainings/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid training ID.");
    const updates: Partial<typeof trainings.$inferInsert> = {};
    if (typeof req.body?.title === "string") updates.title = req.body.title.trim().slice(0, 180);
    if (typeof req.body?.description === "string") updates.description = req.body.description.slice(0, 1000);
    if (typeof req.body?.category === "string") updates.category = req.body.category.slice(0, 80);
    if (req.body?.durationHours !== undefined) updates.durationHours = Number(req.body.durationHours);
    if (req.body?.validityMonths !== undefined) updates.validityMonths = Number(req.body.validityMonths);
    if (Array.isArray(req.body?.mandatoryForRoles)) updates.mandatoryForRoles = req.body.mandatoryForRoles;
    if (typeof req.body?.isActive === "boolean") updates.isActive = req.body.isActive;

    try {
      const [updated] = await db
        .update(trainings)
        .set(updates)
        .where(eq(trainings.id, id))
        .returning();
      if (!updated) return sendError(res, 404, "Training not found.");
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to update training.", err);
    }
  });

  router.delete("/trainings/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid training ID.");
    try {
      await db.delete(trainings).where(eq(trainings.id, id));
      return res.json({ deleted: true });
    } catch (err) {
      return sendError(res, 500, "Failed to delete training.", err);
    }
  });

  // ==========================================================================
  // RISKS, MATRIX, ACTION PLANS & LMRA
  // ==========================================================================

  router.get("/risks/matrix", requireAuth, async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const zone = typeof req.query.zone === "string" ? req.query.zone : "";
    const hazardCategory = typeof req.query.hazardCategory === "string" ? req.query.hazardCategory : "";

    try {
      const all = await db.select().from(risks);
      const filtered = all.filter((r) => {
        if (status && r.status !== status) return false;
        if (zone && r.zone !== zone) return false;
        if (hazardCategory && r.hazardCategory !== hazardCategory) return false;
        return true;
      });

      const cells = [];
      for (let g = 1; g <= 5; g++) {
        for (let p = 1; p <= 5; p++) {
          const matching = filtered.filter((r) => r.gravity === g && r.probability === p);
          const { score, level } = computeRiskScore(g, p);
          cells.push({
            gravity: g,
            probability: p,
            score,
            level,
            count: matching.length,
            riskIds: matching.map((m) => m.id),
          });
        }
      }
      return res.json({ total: filtered.length, cells });
    } catch (err) {
      return sendError(res, 500, "Failed to build risk matrix.", err);
    }
  });

  router.get("/risks/lmra", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 20);
    const decision = typeof req.query.decision === "string" ? req.query.decision : "";

    try {
      const [all, allUsers] = await Promise.all([
        db.select().from(lmraAssessments).orderBy(desc(lmraAssessments.createdAt)),
        db.select().from(users),
      ]);
      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      const filtered = decision ? all.filter((l) => l.decision === decision) : all;
      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit).map((l) => ({
          ...l,
          user: toPersonRef(userMap.get(l.userId)),
          createdAt: l.createdAt.toISOString(),
        })),
        total: filtered.length,
        page,
        limit,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load LMRA assessments.", err);
    }
  });

  router.get("/risks", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 20);
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const level = typeof req.query.level === "string" ? req.query.level : "";
    const zone = typeof req.query.zone === "string" ? req.query.zone : "";
    const hazardCategory = typeof req.query.hazardCategory === "string" ? req.query.hazardCategory : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";

    try {
      const all = await db.select().from(risks).orderBy(desc(risks.score));
      const filtered = all.filter((r) => {
        if (status && r.status !== status) return false;
        if (level && r.level !== level) return false;
        if (zone && r.zone !== zone) return false;
        if (hazardCategory && r.hazardCategory !== hazardCategory) return false;
        if (search && !`${r.title} ${r.description ?? ""} ${r.zone ?? ""}`.toLowerCase().includes(search)) {
          return false;
        }
        return true;
      });
      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit),
        total: filtered.length,
        page,
        limit,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load risks.", err);
    }
  });

  router.get("/risks/:id", requireAuth, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid risk ID.");
    try {
      const [risk] = await db.select().from(risks).where(eq(risks.id, id)).limit(1);
      if (!risk) return sendError(res, 404, "Risk not found.");

      const [plans, actions, allUsers] = await Promise.all([
        db.select().from(actionPlans).where(eq(actionPlans.riskId, id)),
        db
          .select()
          .from(correctiveActions)
          .where(and(eq(correctiveActions.sourceType, "risk"), eq(correctiveActions.sourceId, id))),
        db.select().from(users),
      ]);
      const userMap = new Map(allUsers.map((u) => [u.id, u]));

      return res.json({
        ...risk,
        actionPlans: plans.map((p) => ({
          ...p,
          owner: toPersonRef(p.ownerId ? userMap.get(p.ownerId) : null),
          dueDate: p.dueDate ? p.dueDate.toISOString() : null,
        })),
        correctiveActions: actions.map((a) => ({
          ...a,
          owner: toPersonRef(a.ownerId ? userMap.get(a.ownerId) : null),
          dueDate: a.dueDate ? a.dueDate.toISOString() : null,
          doneAt: a.doneAt ? a.doneAt.toISOString() : null,
          createdAt: a.createdAt.toISOString(),
        })),
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load risk details.", err);
    }
  });

  router.post("/risks", requireAuth, requireManager, async (req: AuthRequest, res) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const hazardCategory =
      typeof req.body?.hazardCategory === "string" ? req.body.hazardCategory.trim() : "General";
    if (!title) return sendError(res, 400, "Risk title is required.");

    const gravity = Number(req.body?.gravity ?? 3);
    const probability = Number(req.body?.probability ?? 3);
    const { score, level } = computeRiskScore(gravity, probability);

    try {
      const [created] = await db
        .insert(risks)
        .values({
          title: title.slice(0, 200),
          description: typeof req.body?.description === "string" ? req.body.description.slice(0, 1000) : null,
          hazardCategory: hazardCategory.slice(0, 80),
          zone: typeof req.body?.zone === "string" ? req.body.zone.slice(0, 120) : null,
          department: typeof req.body?.department === "string" ? req.body.department.slice(0, 120) : null,
          gravity: Math.max(1, Math.min(5, Math.round(gravity))),
          probability: Math.max(1, Math.min(5, Math.round(probability))),
          score,
          level,
          recommendedMeasures:
            typeof req.body?.recommendedMeasures === "string"
              ? req.body.recommendedMeasures.slice(0, 1000)
              : null,
          status: "validated",
          proposedById: req.user?.id ?? null,
          validatedById: req.user?.id ?? null,
        })
        .returning();
      return res.status(201).json(created);
    } catch (err) {
      return sendError(res, 500, "Failed to create risk.", err);
    }
  });

  router.patch("/risks/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid risk ID.");
    const updates: Partial<typeof risks.$inferInsert> = { updatedAt: new Date() };
    if (typeof req.body?.title === "string") updates.title = req.body.title.trim().slice(0, 200);
    if (typeof req.body?.description === "string") updates.description = req.body.description.slice(0, 1000);
    if (typeof req.body?.hazardCategory === "string") updates.hazardCategory = req.body.hazardCategory.slice(0, 80);
    if (typeof req.body?.zone === "string") updates.zone = req.body.zone.slice(0, 120);
    if (typeof req.body?.department === "string") updates.department = req.body.department.slice(0, 120);
    if (typeof req.body?.recommendedMeasures === "string")
      updates.recommendedMeasures = req.body.recommendedMeasures.slice(0, 1000);
    if (typeof req.body?.status === "string") updates.status = req.body.status;

    try {
      const [updated] = await db.update(risks).set(updates).where(eq(risks.id, id)).returning();
      if (!updated) return sendError(res, 404, "Risk not found.");
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to update risk.", err);
    }
  });

  router.patch("/risks/:id/evaluate", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    const gravity = Number(req.body?.gravity);
    const probability = Number(req.body?.probability);
    if (!id || !Number.isFinite(gravity) || !Number.isFinite(probability)) {
      return sendError(res, 400, "Valid gravity and probability are required.");
    }
    const { score, level } = computeRiskScore(gravity, probability);
    try {
      const [updated] = await db
        .update(risks)
        .set({
          gravity: Math.max(1, Math.min(5, Math.round(gravity))),
          probability: Math.max(1, Math.min(5, Math.round(probability))),
          score,
          level,
          updatedAt: new Date(),
        })
        .where(eq(risks.id, id))
        .returning();
      if (!updated) return sendError(res, 404, "Risk not found.");
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to evaluate risk.", err);
    }
  });

  router.delete("/risks/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid risk ID.");
    try {
      await db.delete(risks).where(eq(risks.id, id));
      return res.json({ deleted: true });
    } catch (err) {
      return sendError(res, 500, "Failed to delete risk.", err);
    }
  });

  // Action Plans
  router.get("/action-plans", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 100);
    const riskId = parsePositiveInt(req.query.riskId);
    const status = typeof req.query.status === "string" ? req.query.status : "";

    try {
      const [all, allUsers] = await Promise.all([
        db.select().from(actionPlans).orderBy(desc(actionPlans.createdAt)),
        db.select().from(users),
      ]);
      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      const filtered = all.filter((p) => {
        if (riskId && p.riskId !== riskId) return false;
        if (status && p.status !== status) return false;
        return true;
      });
      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit).map((p) => ({
          ...p,
          owner: toPersonRef(p.ownerId ? userMap.get(p.ownerId) : null),
          dueDate: p.dueDate ? p.dueDate.toISOString() : null,
        })),
        total: filtered.length,
        page,
        limit,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load action plans.", err);
    }
  });

  router.post("/action-plans", requireAuth, requireManager, async (req, res) => {
    const riskId = parsePositiveInt(req.body?.riskId);
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!riskId || !title) return sendError(res, 400, "Risk ID and title are required.");
    try {
      const [created] = await db
        .insert(actionPlans)
        .values({
          riskId,
          title: title.slice(0, 200),
          description: typeof req.body?.description === "string" ? req.body.description.slice(0, 1000) : null,
          ownerId: parsePositiveInt(req.body?.ownerId),
          dueDate: req.body?.dueDate ? new Date(req.body.dueDate) : null,
          status: typeof req.body?.status === "string" ? req.body.status : "planned",
          progress: Math.max(0, Math.min(100, Number(req.body?.progress ?? 0))),
        })
        .returning();
      return res.status(201).json(created);
    } catch (err) {
      return sendError(res, 500, "Failed to create action plan.", err);
    }
  });

  router.patch("/action-plans/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid action plan ID.");
    const updates: Partial<typeof actionPlans.$inferInsert> = {};
    if (typeof req.body?.title === "string") updates.title = req.body.title.trim().slice(0, 200);
    if (typeof req.body?.description === "string") updates.description = req.body.description.slice(0, 1000);
    if (req.body?.ownerId !== undefined) updates.ownerId = parsePositiveInt(req.body.ownerId);
    if (req.body?.dueDate !== undefined) updates.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    if (typeof req.body?.status === "string") updates.status = req.body.status;
    if (req.body?.progress !== undefined)
      updates.progress = Math.max(0, Math.min(100, Number(req.body.progress)));

    try {
      const [updated] = await db
        .update(actionPlans)
        .set(updates)
        .where(eq(actionPlans.id, id))
        .returning();
      if (!updated) return sendError(res, 404, "Action plan not found.");
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to update action plan.", err);
    }
  });

  router.delete("/action-plans/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid action plan ID.");
    try {
      await db.delete(actionPlans).where(eq(actionPlans.id, id));
      return res.json({ deleted: true });
    } catch (err) {
      return sendError(res, 500, "Failed to delete action plan.", err);
    }
  });

  // ==========================================================================
  // AUDITS & COMPLIANCE DOCUMENTS
  // ==========================================================================

  router.get("/audits/templates", requireAuth, async (_req, res) => {
    try {
      const rows = await db.select().from(checklistTemplates);
      return res.json(rows);
    } catch (err) {
      return sendError(res, 500, "Failed to load checklist templates.", err);
    }
  });

  router.get("/audits", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 100);
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const type = typeof req.query.type === "string" ? req.query.type : "";

    try {
      const [all, allUsers] = await Promise.all([
        db.select().from(audits).orderBy(desc(audits.scheduledAt)),
        db.select().from(users),
      ]);
      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      const filtered = all.filter((a) => {
        if (status && a.status !== status) return false;
        if (type && a.type !== type) return false;
        return true;
      });
      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit).map((a) => ({
          ...a,
          scheduledAt: a.scheduledAt.toISOString(),
          completedAt: a.completedAt ? a.completedAt.toISOString() : null,
          auditor: toPersonRef(a.auditorId ? userMap.get(a.auditorId) : null),
        })),
        total: filtered.length,
        page,
        limit,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load audits.", err);
    }
  });

  async function loadAuditDetail(auditId: number) {
    const [audit] = await db.select().from(audits).where(eq(audits.id, auditId)).limit(1);
    if (!audit) return null;
    const [templates, responses, actions, allUsers] = await Promise.all([
      audit.templateId
        ? db.select().from(checklistTemplates).where(eq(checklistTemplates.id, audit.templateId))
        : Promise.resolve([]),
      db.select().from(auditResponses).where(eq(auditResponses.auditId, auditId)),
      db
        .select()
        .from(correctiveActions)
        .where(and(eq(correctiveActions.sourceType, "audit"), eq(correctiveActions.sourceId, auditId))),
      db.select().from(users),
    ]);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const template = templates[0] ?? null;
    const totalItems = template ? template.items.length : responses.length;
    const summary = computeAuditScore(responses, totalItems);

    return {
      ...audit,
      scheduledAt: audit.scheduledAt.toISOString(),
      completedAt: audit.completedAt ? audit.completedAt.toISOString() : null,
      auditor: toPersonRef(audit.auditorId ? userMap.get(audit.auditorId) : null),
      template,
      responses: responses.map((r) => ({
        itemId: r.itemId,
        result: r.result,
        comment: r.comment,
        correctiveActionId: r.correctiveActionId,
      })),
      summary,
      correctiveActions: actions.map((a) => ({
        ...a,
        owner: toPersonRef(a.ownerId ? userMap.get(a.ownerId) : null),
        dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        doneAt: a.doneAt ? a.doneAt.toISOString() : null,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  router.get("/audits/:id", requireAuth, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid audit ID.");
    try {
      const detail = await loadAuditDetail(id);
      if (!detail) return sendError(res, 404, "Audit not found.");
      return res.json(detail);
    } catch (err) {
      return sendError(res, 500, "Failed to load audit.", err);
    }
  });

  router.post("/audits", requireAuth, requireManager, async (req, res) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title || !req.body?.scheduledAt) {
      return sendError(res, 400, "Audit title and scheduled date are required.");
    }
    try {
      const [created] = await db
        .insert(audits)
        .values({
          title: title.slice(0, 200),
          type: typeof req.body?.type === "string" ? req.body.type : "internal",
          standard: typeof req.body?.standard === "string" ? req.body.standard.slice(0, 80) : "ISO 45001",
          scheduledAt: new Date(req.body.scheduledAt),
          auditorName: typeof req.body?.auditorName === "string" ? req.body.auditorName.slice(0, 120) : null,
          auditorId: parsePositiveInt(req.body?.auditorId),
          zone: typeof req.body?.zone === "string" ? req.body.zone.slice(0, 120) : null,
          templateId: parsePositiveInt(req.body?.templateId),
          status: typeof req.body?.status === "string" ? req.body.status : "planned",
        })
        .returning();
      return res.status(201).json(created);
    } catch (err) {
      return sendError(res, 500, "Failed to create audit.", err);
    }
  });

  router.patch("/audits/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid audit ID.");
    const updates: Partial<typeof audits.$inferInsert> = {};
    if (typeof req.body?.title === "string") updates.title = req.body.title.trim().slice(0, 200);
    if (typeof req.body?.type === "string") updates.type = req.body.type;
    if (typeof req.body?.standard === "string") updates.standard = req.body.standard.slice(0, 80);
    if (req.body?.scheduledAt) updates.scheduledAt = new Date(req.body.scheduledAt);
    if (typeof req.body?.zone === "string") updates.zone = req.body.zone.slice(0, 120);
    if (typeof req.body?.status === "string") {
      updates.status = req.body.status;
      if (req.body.status === "completed") updates.completedAt = new Date();
    }

    try {
      const [updated] = await db.update(audits).set(updates).where(eq(audits.id, id)).returning();
      if (!updated) return sendError(res, 404, "Audit not found.");
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to update audit.", err);
    }
  });

  router.delete("/audits/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid audit ID.");
    try {
      await db.delete(audits).where(eq(audits.id, id));
      return res.json({ deleted: true });
    } catch (err) {
      return sendError(res, 500, "Failed to delete audit.", err);
    }
  });

  router.put("/audits/:id/responses", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id || !Array.isArray(req.body?.responses)) {
      return sendError(res, 400, "Invalid audit responses payload.");
    }

    try {
      await db.delete(auditResponses).where(eq(auditResponses.auditId, id));
      const rows = req.body.responses.map(
        (r: { itemId: number; result: string; comment?: string }) => ({
          auditId: id,
          itemId: Number(r.itemId),
          result: String(r.result),
          comment: typeof r.comment === "string" ? r.comment.slice(0, 1000) : null,
        })
      );
      if (rows.length > 0) {
        await db.insert(auditResponses).values(rows);
      }

      const summary = computeAuditScore(rows, rows.length);
      await db
        .update(audits)
        .set({
          score: summary.score,
          status: summary.unanswered === 0 ? "completed" : "in_progress",
          completedAt: summary.unanswered === 0 ? new Date() : null,
        })
        .where(eq(audits.id, id));

      const detail = await loadAuditDetail(id);
      return res.json(detail);
    } catch (err) {
      return sendError(res, 500, "Failed to save audit responses.", err);
    }
  });

  router.get("/compliance-documents", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 20);
    const type = typeof req.query.type === "string" ? req.query.type : "";
    const expiring = req.query.expiring === "true";
    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";

    try {
      const all = await db
        .select()
        .from(complianceDocuments)
        .orderBy(desc(complianceDocuments.createdAt));
      const soon = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const filtered = all.filter((d) => {
        if (type && d.type !== type) return false;
        if (expiring && (!d.validUntil || d.validUntil.getTime() > soon)) return false;
        if (search && !`${d.title} ${d.fileName}`.toLowerCase().includes(search)) return false;
        return true;
      });
      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit).map((d) => ({
          id: d.id,
          title: d.title,
          type: d.type,
          fileId: d.id,
          file: {
            id: d.id,
            originalName: d.fileName,
            mimeType: d.mimeType,
            size: d.fileSize,
          },
          validUntil: d.validUntil ? d.validUntil.toISOString() : null,
          auditId: d.auditId,
          createdAt: d.createdAt.toISOString(),
        })),
        total: filtered.length,
        page,
        limit,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load compliance documents.", err);
    }
  });

  router.post(
    "/compliance-documents",
    requireAuth,
    requireManager,
    upload.single("file"),
    async (req, res) => {
      const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
      if (!title) return sendError(res, 400, "Document title is required.");
      const safeName = (req.file?.originalname || "document.pdf")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 120);

      try {
        const [created] = await db
          .insert(complianceDocuments)
          .values({
            title: title.slice(0, 200),
            type: typeof req.body?.type === "string" ? req.body.type : "other",
            fileName: safeName,
            mimeType: req.file?.mimetype || "application/pdf",
            fileSize: req.file?.size || 0,
            validUntil: req.body?.validUntil ? new Date(req.body.validUntil) : null,
          })
          .returning();

        return res.status(201).json({
          id: created.id,
          title: created.title,
          type: created.type,
          fileId: created.id,
          file: {
            id: created.id,
            originalName: created.fileName,
            mimeType: created.mimeType,
            size: created.fileSize,
          },
          validUntil: created.validUntil ? created.validUntil.toISOString() : null,
          createdAt: created.createdAt.toISOString(),
        });
      } catch (err) {
        return sendError(res, 500, "Failed to upload compliance document.", err);
      }
    }
  );

  router.delete("/compliance-documents/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid document ID.");
    try {
      await db.delete(complianceDocuments).where(eq(complianceDocuments.id, id));
      return res.json({ deleted: true });
    } catch (err) {
      return sendError(res, 500, "Failed to delete document.", err);
    }
  });

  router.get("/files/:id", requireAuth, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid file ID.");
    try {
      const [doc] = await db
        .select()
        .from(complianceDocuments)
        .where(eq(complianceDocuments.id, id))
        .limit(1);
      if (!doc) return sendError(res, 404, "File not found.");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `inline; filename="${doc.fileName}"`);
      return res.send(`PROSAFE Compliance Document: ${doc.title}\nFile: ${doc.fileName}\nType: ${doc.type}\n`);
    } catch (err) {
      return sendError(res, 500, "Failed to retrieve file.", err);
    }
  });

  // ==========================================================================
  // CORRECTIVE ACTIONS
  // ==========================================================================

  router.get("/corrective-actions", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 50);
    const sourceType = typeof req.query.sourceType === "string" ? req.query.sourceType : "";
    const sourceId = parsePositiveInt(req.query.sourceId);
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const ownerId = parsePositiveInt(req.query.ownerId);

    try {
      const [all, allUsers] = await Promise.all([
        db.select().from(correctiveActions).orderBy(desc(correctiveActions.createdAt)),
        db.select().from(users),
      ]);
      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      const filtered = all.filter((a) => {
        if (sourceType && a.sourceType !== sourceType) return false;
        if (sourceId && a.sourceId !== sourceId) return false;
        if (status && a.status !== status) return false;
        if (ownerId && a.ownerId !== ownerId) return false;
        return true;
      });
      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit).map((a) => ({
          ...a,
          owner: toPersonRef(a.ownerId ? userMap.get(a.ownerId) : null),
          dueDate: a.dueDate ? a.dueDate.toISOString() : null,
          doneAt: a.doneAt ? a.doneAt.toISOString() : null,
          createdAt: a.createdAt.toISOString(),
        })),
        total: filtered.length,
        page,
        limit,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load corrective actions.", err);
    }
  });

  router.post("/corrective-actions", requireAuth, requireManager, async (req, res) => {
    const sourceType = typeof req.body?.sourceType === "string" ? req.body.sourceType : "incident";
    const sourceId = parsePositiveInt(req.body?.sourceId) ?? 1;
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) return sendError(res, 400, "Action title is required.");

    try {
      const [created] = await db
        .insert(correctiveActions)
        .values({
          sourceType,
          sourceId,
          title: title.slice(0, 200),
          description: typeof req.body?.description === "string" ? req.body.description.slice(0, 1000) : null,
          ownerId: parsePositiveInt(req.body?.ownerId),
          dueDate: req.body?.dueDate ? new Date(req.body.dueDate) : null,
          status: "todo",
        })
        .returning();
      return res.status(201).json(created);
    } catch (err) {
      return sendError(res, 500, "Failed to create corrective action.", err);
    }
  });

  router.patch("/corrective-actions/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid action ID.");
    const updates: Partial<typeof correctiveActions.$inferInsert> = {};
    if (typeof req.body?.title === "string") updates.title = req.body.title.trim().slice(0, 200);
    if (typeof req.body?.description === "string") updates.description = req.body.description.slice(0, 1000);
    if (req.body?.ownerId !== undefined) updates.ownerId = parsePositiveInt(req.body.ownerId);
    if (req.body?.dueDate !== undefined) updates.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    if (typeof req.body?.status === "string") {
      updates.status = req.body.status;
      updates.doneAt = req.body.status === "done" ? new Date() : null;
    }

    try {
      const [updated] = await db
        .update(correctiveActions)
        .set(updates)
        .where(eq(correctiveActions.id, id))
        .returning();
      if (!updated) return sendError(res, 404, "Corrective action not found.");
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to update corrective action.", err);
    }
  });

  router.delete("/corrective-actions/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid action ID.");
    try {
      await db.delete(correctiveActions).where(eq(correctiveActions.id, id));
      return res.json({ deleted: true });
    } catch (err) {
      return sendError(res, 500, "Failed to delete corrective action.", err);
    }
  });

  // ==========================================================================
  // EMERGENCY SCENARIOS, LIVE EVENTS & DRILLS
  // ==========================================================================

  router.get("/emergency/scenarios", requireAuth, async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(emergencyScenarios)
        .orderBy(desc(emergencyScenarios.createdAt));
      return res.json({ data: rows, total: rows.length, page: 1, limit: 100 });
    } catch (err) {
      return sendError(res, 500, "Failed to load emergency scenarios.", err);
    }
  });

  router.post("/emergency/scenarios", requireAuth, requireManager, async (req, res) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) return sendError(res, 400, "Scenario title is required.");
    try {
      const [created] = await db
        .insert(emergencyScenarios)
        .values({
          title: title.slice(0, 180),
          type: typeof req.body?.type === "string" ? req.body.type : "fire",
          steps: Array.isArray(req.body?.steps) ? req.body.steps : [],
          contacts: Array.isArray(req.body?.contacts) ? req.body.contacts : [],
          assemblyPoint:
            typeof req.body?.assemblyPoint === "string" ? req.body.assemblyPoint.slice(0, 160) : null,
          isActive: req.body?.isActive !== false,
        })
        .returning();
      return res.status(201).json(created);
    } catch (err) {
      return sendError(res, 500, "Failed to create scenario.", err);
    }
  });

  router.patch("/emergency/scenarios/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid scenario ID.");
    const updates: Partial<typeof emergencyScenarios.$inferInsert> = {};
    if (typeof req.body?.title === "string") updates.title = req.body.title.trim().slice(0, 180);
    if (typeof req.body?.type === "string") updates.type = req.body.type;
    if (Array.isArray(req.body?.steps)) updates.steps = req.body.steps;
    if (Array.isArray(req.body?.contacts)) updates.contacts = req.body.contacts;
    if (typeof req.body?.assemblyPoint === "string") updates.assemblyPoint = req.body.assemblyPoint.slice(0, 160);
    if (typeof req.body?.isActive === "boolean") updates.isActive = req.body.isActive;

    try {
      const [updated] = await db
        .update(emergencyScenarios)
        .set(updates)
        .where(eq(emergencyScenarios.id, id))
        .returning();
      if (!updated) return sendError(res, 404, "Scenario not found.");
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to update scenario.", err);
    }
  });

  router.delete("/emergency/scenarios/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid scenario ID.");
    try {
      await db.delete(emergencyScenarios).where(eq(emergencyScenarios.id, id));
      return res.json({ deleted: true });
    } catch (err) {
      return sendError(res, 500, "Failed to delete scenario.", err);
    }
  });

  router.post("/emergency/trigger", requireAuth, requireManager, async (req, res) => {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) return sendError(res, 400, "Emergency alert message is required.");
    try {
      const [created] = await db
        .insert(emergencyEvents)
        .values({
          scenarioId: parsePositiveInt(req.body?.scenarioId),
          message: message.slice(0, 500),
          zone: typeof req.body?.zone === "string" ? req.body.zone.slice(0, 120) : null,
          active: true,
        })
        .returning();
      wsNamespace?.emit("emergency:triggered", created);
      return res.status(201).json(created);
    } catch (err) {
      return sendError(res, 500, "Failed to trigger emergency alert.", err);
    }
  });

  router.get("/emergency/events", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 20);
    const activeOnly = req.query.active === "true";

    try {
      const [all, allScenarios] = await Promise.all([
        db.select().from(emergencyEvents).orderBy(desc(emergencyEvents.triggeredAt)),
        db.select().from(emergencyScenarios),
      ]);
      const scenMap = new Map(allScenarios.map((s) => [s.id, s]));
      const filtered = activeOnly ? all.filter((e) => e.active) : all;
      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit).map((e) => ({
          ...e,
          scenario: e.scenarioId ? scenMap.get(e.scenarioId) ?? null : null,
          triggeredAt: e.triggeredAt.toISOString(),
          closedAt: e.closedAt ? e.closedAt.toISOString() : null,
        })),
        total: filtered.length,
        page,
        limit,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load emergency events.", err);
    }
  });

  router.patch("/emergency/events/:id/close", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid emergency event ID.");
    try {
      const [updated] = await db
        .update(emergencyEvents)
        .set({ active: false, closedAt: new Date() })
        .where(eq(emergencyEvents.id, id))
        .returning();
      if (!updated) return sendError(res, 404, "Emergency event not found.");
      wsNamespace?.emit("emergency:closed", updated);
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to close emergency event.", err);
    }
  });

  router.get("/emergency/drills", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 50);
    const status = typeof req.query.status === "string" ? req.query.status : "";

    try {
      const [all, allScenarios] = await Promise.all([
        db.select().from(drills).orderBy(desc(drills.scheduledAt)),
        db.select().from(emergencyScenarios),
      ]);
      const scenMap = new Map(allScenarios.map((s) => [s.id, s]));
      const filtered = status ? all.filter((d) => d.status === status) : all;
      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit).map((d) => ({
          ...d,
          scenario: d.scenarioId ? scenMap.get(d.scenarioId) ?? null : null,
          scheduledAt: d.scheduledAt.toISOString(),
        })),
        total: filtered.length,
        page,
        limit,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load drills.", err);
    }
  });

  router.post("/emergency/drills", requireAuth, requireManager, async (req, res) => {
    if (!req.body?.scheduledAt) return sendError(res, 400, "Drill date is required.");
    try {
      const [created] = await db
        .insert(drills)
        .values({
          scenarioId: parsePositiveInt(req.body?.scenarioId),
          scheduledAt: new Date(req.body.scheduledAt),
          zone: typeof req.body?.zone === "string" ? req.body.zone.slice(0, 120) : null,
          status: typeof req.body?.status === "string" ? req.body.status : "planned",
          durationSeconds: req.body?.durationSeconds ? Number(req.body.durationSeconds) : null,
          participantsCount: req.body?.participantsCount ? Number(req.body.participantsCount) : null,
          evacuatedCount: req.body?.evacuatedCount ? Number(req.body.evacuatedCount) : null,
          observations: typeof req.body?.observations === "string" ? req.body.observations.slice(0, 1000) : null,
        })
        .returning();
      return res.status(201).json(created);
    } catch (err) {
      return sendError(res, 500, "Failed to schedule drill.", err);
    }
  });

  router.patch("/emergency/drills/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid drill ID.");
    const updates: Partial<typeof drills.$inferInsert> = {};
    if (req.body?.scenarioId !== undefined) updates.scenarioId = parsePositiveInt(req.body.scenarioId);
    if (req.body?.scheduledAt) updates.scheduledAt = new Date(req.body.scheduledAt);
    if (typeof req.body?.zone === "string") updates.zone = req.body.zone.slice(0, 120);
    if (typeof req.body?.status === "string") updates.status = req.body.status;
    if (req.body?.durationSeconds !== undefined) updates.durationSeconds = Number(req.body.durationSeconds);
    if (req.body?.participantsCount !== undefined) updates.participantsCount = Number(req.body.participantsCount);
    if (req.body?.evacuatedCount !== undefined) updates.evacuatedCount = Number(req.body.evacuatedCount);
    if (typeof req.body?.observations === "string") updates.observations = req.body.observations.slice(0, 1000);

    try {
      const [updated] = await db.update(drills).set(updates).where(eq(drills.id, id)).returning();
      if (!updated) return sendError(res, 404, "Drill not found.");
      return res.json(updated);
    } catch (err) {
      return sendError(res, 500, "Failed to update drill.", err);
    }
  });

  router.delete("/emergency/drills/:id", requireAuth, requireManager, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid drill ID.");
    try {
      await db.delete(drills).where(eq(drills.id, id));
      return res.json({ deleted: true });
    } catch (err) {
      return sendError(res, 500, "Failed to delete drill.", err);
    }
  });

  // ==========================================================================
  // MESSAGING, REWARDS & FEEDBACK
  // ==========================================================================

  router.get("/conversations", requireAuth, async (req: AuthRequest, res) => {
    if (!req.user) return sendError(res, 401, "Unauthorized.");
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 50);

    try {
      const [allConvs, allMsgs, allUsers] = await Promise.all([
        db.select().from(conversations).orderBy(desc(conversations.updatedAt)),
        db.select().from(conversationMessages).orderBy(desc(conversationMessages.createdAt)),
        db.select().from(users),
      ]);
      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      const start = (page - 1) * limit;

      const data = allConvs.slice(start, start + limit).map((c) => {
        const msgs = allMsgs.filter((m) => m.conversationId === c.id);
        const last = msgs[0] ?? null;
        const unreadCount = msgs.filter(
          (m) => m.senderId !== req.user?.id && !(m.readByIds || []).includes(req.user!.id)
        ).length;
        const participants = (c.participantIds || [])
          .map((pid) => userMap.get(pid))
          .filter(Boolean)
          .map((u) => ({
            id: u!.id,
            firstName: u!.firstName,
            lastName: u!.lastName,
            roles: u!.roles,
          }));

        return {
          id: c.id,
          subject: c.subject,
          participants,
          lastMessage: last
            ? {
                id: last.id,
                body: last.body,
                senderId: last.senderId,
                createdAt: last.createdAt.toISOString(),
              }
            : null,
          unreadCount,
          updatedAt: c.updatedAt.toISOString(),
        };
      });

      return res.json({ data, total: allConvs.length, page, limit });
    } catch (err) {
      return sendError(res, 500, "Failed to load conversations.", err);
    }
  });

  router.post("/conversations", requireAuth, async (req: AuthRequest, res) => {
    if (!req.user) return sendError(res, 401, "Unauthorized.");
    const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : "";
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!subject || !body) return sendError(res, 400, "Subject and message body are required.");

    const recipientId = parsePositiveInt(req.body?.recipientId);
    const participantIds = Array.from(
      new Set([req.user.id, ...(recipientId ? [recipientId] : [])])
    );

    try {
      const [conv] = await db
        .insert(conversations)
        .values({ subject: subject.slice(0, 200), participantIds })
        .returning();
      const [msg] = await db
        .insert(conversationMessages)
        .values({
          conversationId: conv.id,
          senderId: req.user.id,
          body: body.slice(0, 2000),
          readByIds: [req.user.id],
        })
        .returning();

      wsNamespace?.emit("message:new", { conversationId: conv.id, message: msg });
      return res.status(201).json({
        id: conv.id,
        subject: conv.subject,
        participants: [],
        lastMessage: {
          id: msg.id,
          body: msg.body,
          senderId: msg.senderId,
          createdAt: msg.createdAt.toISOString(),
        },
        unreadCount: 0,
        updatedAt: conv.updatedAt.toISOString(),
      });
    } catch (err) {
      return sendError(res, 500, "Failed to create conversation.", err);
    }
  });

  router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) return sendError(res, 400, "Invalid conversation ID.");
    try {
      const [msgs, allUsers] = await Promise.all([
        db
          .select()
          .from(conversationMessages)
          .where(eq(conversationMessages.conversationId, id))
          .orderBy(conversationMessages.createdAt),
        db.select().from(users),
      ]);
      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      return res.json({
        data: msgs.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          sender: toPersonRef(m.senderId ? userMap.get(m.senderId) : null),
          body: m.body,
          createdAt: m.createdAt.toISOString(),
        })),
        total: msgs.length,
        page: 1,
        limit: 200,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load messages.", err);
    }
  });

  router.post("/conversations/:id/messages", requireAuth, async (req: AuthRequest, res) => {
    const id = parsePositiveInt(req.params.id);
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!id || !body || !req.user) return sendError(res, 400, "Message body is required.");

    try {
      const [msg] = await db
        .insert(conversationMessages)
        .values({
          conversationId: id,
          senderId: req.user.id,
          body: body.slice(0, 2000),
          readByIds: [req.user.id],
        })
        .returning();

      await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, id));

      const formatted = {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        sender: {
          id: req.user.id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
        },
        body: msg.body,
        createdAt: msg.createdAt.toISOString(),
      };
      wsNamespace?.emit("message:new", formatted);
      return res.status(201).json(formatted);
    } catch (err) {
      return sendError(res, 500, "Failed to send message.", err);
    }
  });

  router.patch("/conversations/:id/read", requireAuth, async (req: AuthRequest, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id || !req.user) return sendError(res, 400, "Invalid conversation ID.");
    try {
      const msgs = await db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.conversationId, id));
      for (const m of msgs) {
        const readBy = m.readByIds || [];
        if (!readBy.includes(req.user.id)) {
          await db
            .update(conversationMessages)
            .set({ readByIds: [...readBy, req.user.id] })
            .where(eq(conversationMessages.id, m.id));
        }
      }
      return res.json({ read: true });
    } catch (err) {
      return sendError(res, 500, "Failed to mark conversation read.", err);
    }
  });

  router.get("/rewards/leaderboard", requireAuth, async (req, res) => {
    const period = typeof req.query.period === "string" ? req.query.period : "all";
    const limit = parseLimit(req.query.limit, 20);
    const now = Date.now();
    const cutoff =
      period === "month"
        ? now - 30 * 24 * 60 * 60 * 1000
        : period === "year"
          ? now - 365 * 24 * 60 * 60 * 1000
          : 0;

    try {
      const [allRewards, allUsers] = await Promise.all([
        db.select().from(rewards),
        db.select().from(users),
      ]);
      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      const totals = new Map<number, number>();
      for (const r of allRewards) {
        if (cutoff && r.createdAt.getTime() < cutoff) continue;
        totals.set(r.userId, (totals.get(r.userId) ?? 0) + r.points);
      }

      const ranked = Array.from(totals.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([userId, points], idx) => {
          const u = userMap.get(userId);
          return {
            rank: idx + 1,
            userId,
            firstName: u?.firstName ?? "Employee",
            lastName: u?.lastName ?? "",
            points,
            badge: computeRewardBadge(points),
          };
        });
      return res.json(ranked);
    } catch (err) {
      return sendError(res, 500, "Failed to load leaderboard.", err);
    }
  });

  router.get("/feedback", requireAuth, async (req, res) => {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 20);
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const rating = parsePositiveInt(req.query.rating);

    try {
      const [all, allUsers] = await Promise.all([
        db.select().from(feedbackItems).orderBy(desc(feedbackItems.createdAt)),
        db.select().from(users),
      ]);
      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      const filtered = all.filter((f) => {
        if (category && f.category !== category) return false;
        if (rating && f.rating !== rating) return false;
        return true;
      });
      const avg =
        filtered.length > 0
          ? Math.round((filtered.reduce((s, f) => s + f.rating, 0) / filtered.length) * 10) / 10
          : null;
      const start = (page - 1) * limit;
      return res.json({
        data: filtered.slice(start, start + limit).map((f) => ({
          ...f,
          user: toPersonRef(f.userId ? userMap.get(f.userId) : null),
          createdAt: f.createdAt.toISOString(),
        })),
        total: filtered.length,
        page,
        limit,
        averageRating: avg,
      });
    } catch (err) {
      return sendError(res, 500, "Failed to load feedback.", err);
    }
  });

  return router;
}
