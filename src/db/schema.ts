import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  roles: jsonb("roles").$type<string[]>().notNull().default(["employee"]),
  department: text("department"),
  zone: text("zone"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  incidentId: text("incident_id").notNull().unique(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("open"),
  description: text("description").notNull(),
  notes: text("notes"),
  zone: text("zone"),
  department: text("department"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  geoLatitude: doublePrecision("geo_latitude"),
  geoLongitude: doublePrecision("geo_longitude"),
  manualAddress: text("manual_address"),
  reporterId: integer("reporter_id").references(() => users.id, { onDelete: "set null" }),
  resolverId: integer("resolver_id").references(() => users.id, { onDelete: "set null" }),
  gravity: integer("gravity"),
  probability: integer("probability"),
  riskScore: integer("risk_score"),
  rootCause: text("root_cause"),
  evaluatedSeverity: text("evaluated_severity"),
  evaluatedAt: timestamp("evaluated_at"),
  evaluatedById: integer("evaluated_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const incidentHistory = pgTable("incident_history", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id")
    .references(() => incidents.id, { onDelete: "cascade" })
    .notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  comment: text("comment"),
  changedById: integer("changed_by_id").references(() => users.id, { onDelete: "set null" }),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull().default(0),
  quantity: integer("quantity").notNull().default(0),
  minStockLevel: integer("min_stock_level").notNull().default(5),
  category: text("category").notNull().default("ppe"),
  status: text("status").notNull().default("active"),
  condition: text("condition").notNull().default("functional"),
  expiryDate: timestamp("expiry_date"),
  lastInspectionAt: timestamp("last_inspection_at"),
  nextInspectionAt: timestamp("next_inspection_at"),
  supplier: text("supplier"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const maintenances = pgTable("maintenances", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .references(() => inventoryItems.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  doneAt: timestamp("done_at"),
  performedById: integer("performed_by_id").references(() => users.id, { onDelete: "set null" }),
  result: text("result"),
  notes: text("notes"),
  status: text("status").notNull().default("planned"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trainings = pgTable("trainings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  durationHours: doublePrecision("duration_hours"),
  validityMonths: integer("validity_months"),
  mandatoryForRoles: jsonb("mandatory_for_roles").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id")
    .references(() => trainings.id, { onDelete: "cascade" })
    .notNull(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),
  location: text("location"),
  trainer: text("trainer"),
  capacity: integer("capacity"),
  status: text("status").notNull().default("planned"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => trainingSessions.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status").notNull().default("registered"),
  score: doublePrecision("score"),
  progress: integer("progress").notNull().default(0),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  hazardCategory: text("hazard_category").notNull(),
  zone: text("zone"),
  department: text("department"),
  gravity: integer("gravity").notNull().default(3),
  probability: integer("probability").notNull().default(3),
  score: integer("score").notNull().default(9),
  level: text("level").notNull().default("medium"),
  recommendedMeasures: text("recommended_measures"),
  status: text("status").notNull().default("validated"),
  proposedById: integer("proposed_by_id").references(() => users.id, { onDelete: "set null" }),
  validatedById: integer("validated_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const actionPlans = pgTable("action_plans", {
  id: serial("id").primaryKey(),
  riskId: integer("risk_id")
    .references(() => risks.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("planned"),
  progress: integer("progress").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface LmraHazardRow {
  label: string;
  present: boolean;
  controlled: boolean;
}

export const lmraAssessments = pgTable("lmra_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  task: text("task").notNull(),
  location: text("location"),
  hazards: jsonb("hazards").$type<LmraHazardRow[]>().notNull().default([]),
  decision: text("decision").notNull().default("go"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface ChecklistItemRow {
  id: number;
  clause: string;
  question: string;
}

export const checklistTemplates = pgTable("checklist_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  standard: text("standard").notNull(),
  items: jsonb("items").$type<ChecklistItemRow[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull().default("internal"),
  standard: text("standard"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  completedAt: timestamp("completed_at"),
  auditorName: text("auditor_name"),
  auditorId: integer("auditor_id").references(() => users.id, { onDelete: "set null" }),
  zone: text("zone"),
  status: text("status").notNull().default("planned"),
  score: doublePrecision("score"),
  templateId: integer("template_id").references(() => checklistTemplates.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditResponses = pgTable("audit_responses", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id")
    .references(() => audits.id, { onDelete: "cascade" })
    .notNull(),
  itemId: integer("item_id").notNull(),
  result: text("result").notNull(),
  comment: text("comment"),
  correctiveActionId: integer("corrective_action_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complianceDocuments = pgTable("compliance_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull().default("other"),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull().default("application/pdf"),
  fileSize: integer("file_size").notNull().default(0),
  validUntil: timestamp("valid_until"),
  auditId: integer("audit_id").references(() => audits.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const correctiveActions = pgTable("corrective_actions", {
  id: serial("id").primaryKey(),
  sourceType: text("source_type").notNull(),
  sourceId: integer("source_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("todo"),
  doneAt: timestamp("done_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("unresolved"),
  type: text("type").notNull().default("system"),
  affectedUserId: integer("affected_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  resolvedById: integer("resolved_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export interface EmergencyContactRow {
  name: string;
  role: string;
  phone: string;
}

export const emergencyScenarios = pgTable("emergency_scenarios", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull().default("fire"),
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  contacts: jsonb("contacts").$type<EmergencyContactRow[]>().notNull().default([]),
  assemblyPoint: text("assembly_point"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emergencyEvents = pgTable("emergency_events", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => emergencyScenarios.id, {
    onDelete: "set null",
  }),
  message: text("message").notNull(),
  zone: text("zone"),
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  active: boolean("active").notNull().default(true),
});

export const drills = pgTable("drills", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => emergencyScenarios.id, {
    onDelete: "set null",
  }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  zone: text("zone"),
  status: text("status").notNull().default("planned"),
  durationSeconds: integer("duration_seconds"),
  participantsCount: integer("participants_count"),
  evacuatedCount: integer("evacuated_count"),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull().default("system"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  incidents: boolean("incidents").notNull().default(true),
  trainings: boolean("trainings").notNull().default(true),
  audits: boolean("audits").notNull().default(true),
  inventory: boolean("inventory").notNull().default(true),
  emergency: boolean("emergency").notNull().default(true),
  messages: boolean("messages").notNull().default(true),
  push: boolean("push").notNull().default(true),
  email: boolean("email").notNull().default(true),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  participantIds: jsonb("participant_ids").$type<number[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversationMessages = pgTable("conversation_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .references(() => conversations.id, { onDelete: "cascade" })
    .notNull(),
  senderId: integer("sender_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  readByIds: jsonb("read_by_ids").$type<number[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  incidentId: integer("incident_id").references(() => incidents.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedbackItems = pgTable("feedback_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  category: text("category").notNull().default("suggestion"),
  comment: text("comment"),
  appVersion: text("app_version"),
  platform: text("platform"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetRequests = pgTable("password_reset_requests", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  status: text("status").notNull().default("requested"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
});

export const contactInquiries = pgTable("contact_inquiries", {
  id: serial("id").primaryKey(),
  referenceId: text("reference_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  topic: text("topic").notNull().default("demo"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
