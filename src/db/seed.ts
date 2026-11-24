import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { db } from "./index.ts";
import {
  actionPlans,
  alerts,
  auditResponses,
  audits,
  checklistTemplates,
  complianceDocuments,
  conversationMessages,
  conversations,
  correctiveActions,
  drills,
  emergencyScenarios,
  enrollments,
  feedbackItems,
  incidentHistory,
  incidents,
  inventoryItems,
  lmraAssessments,
  maintenances,
  notificationPreferences,
  notifications,
  rewards,
  risks,
  trainingSessions,
  trainings,
  users,
} from "./schema.ts";
import { computeRiskScore } from "../lib/riskMath.ts";

export const DEMO_ADMIN_EMAIL = "admin@prosafe.demo";
export const DEMO_EMPLOYEE_EMAIL = "karim.benali@prosafe.demo";

let seedPromise: Promise<void> | null = null;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysAhead(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Lazily seeds deterministic OHS/SST demo records on first request if the marker user
 * does not exist yet. Never runs at module import time.
 */
export async function ensureDemoDataSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeedIfNeeded().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function runSeedIfNeeded(): Promise<void> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEMO_ADMIN_EMAIL))
    .limit(1);

  const existingIncident = await db.select({ id: incidents.id }).from(incidents).limit(1);
  if (existing.length > 0 && existingIncident.length > 0) return;

  const demoHash = await bcrypt.hash("Prosafe2026!", 8);
  const demoEmails = [
    DEMO_ADMIN_EMAIL,
    "salima.ouali@prosafe.demo",
    "mourad.kaci@prosafe.demo",
    "karim.benali@prosafe.demo",
    "amina.boudiaf@prosafe.demo",
    "yacine.messaoudi@prosafe.demo",
    "nadia.cherif@prosafe.demo",
  ];

  await db
    .insert(users)
    .values([
      {
        firstName: "Admin",
        lastName: "PROSAFE",
        email: DEMO_ADMIN_EMAIL,
        passwordHash: demoHash,
        roles: ["admin"],
        department: "HSE Direction",
        zone: "Headquarters",
        phone: "+213 555 00 00 01",
        isActive: true,
      },
      {
        firstName: "Salima",
        lastName: "Ouali",
        email: "salima.ouali@prosafe.demo",
        passwordHash: demoHash,
        roles: ["sst_manager"],
        department: "HSE Operations",
        zone: "Workshop A",
        phone: "+213 555 00 00 02",
        isActive: true,
      },
      {
        firstName: "Mourad",
        lastName: "Kaci",
        email: "mourad.kaci@prosafe.demo",
        passwordHash: demoHash,
        roles: ["sst_manager"],
        department: "Production",
        zone: "Workshop B",
        phone: "+213 555 00 00 03",
        isActive: true,
      },
      {
        firstName: "Karim",
        lastName: "Benali",
        email: "karim.benali@prosafe.demo",
        passwordHash: demoHash,
        roles: ["employee"],
        department: "Production",
        zone: "Workshop A",
        phone: "+213 555 10 00 01",
        isActive: true,
      },
      {
        firstName: "Amina",
        lastName: "Boudiaf",
        email: "amina.boudiaf@prosafe.demo",
        passwordHash: demoHash,
        roles: ["employee"],
        department: "Maintenance",
        zone: "Workshop B",
        phone: "+213 555 10 00 02",
        isActive: true,
      },
      {
        firstName: "Yacine",
        lastName: "Messaoudi",
        email: "yacine.messaoudi@prosafe.demo",
        passwordHash: demoHash,
        roles: ["employee"],
        department: "Logistics",
        zone: "Warehouse",
        phone: "+213 555 10 00 03",
        isActive: true,
      },
      {
        firstName: "Nadia",
        lastName: "Cherif",
        email: "nadia.cherif@prosafe.demo",
        passwordHash: demoHash,
        roles: ["employee"],
        department: "Administration",
        zone: "Headquarters",
        phone: "+213 555 10 00 04",
        isActive: true,
      },
    ])
    .onConflictDoNothing();

  const fetchedUsers = await db
    .select()
    .from(users)
    .where(inArray(users.email, demoEmails));

  const userByEmail = new Map(fetchedUsers.map((u) => [u.email, u]));
  const admin = userByEmail.get(DEMO_ADMIN_EMAIL);
  const salima = userByEmail.get("salima.ouali@prosafe.demo") ?? admin;
  const mourad = userByEmail.get("mourad.kaci@prosafe.demo") ?? admin;
  const karim = userByEmail.get("karim.benali@prosafe.demo") ?? admin;
  const amina = userByEmail.get("amina.boudiaf@prosafe.demo") ?? admin;
  const yacine = userByEmail.get("yacine.messaoudi@prosafe.demo") ?? admin;
  const nadia = userByEmail.get("nadia.cherif@prosafe.demo") ?? admin;
  if (!admin || !salima || !mourad || !karim || !amina || !yacine || !nadia) return;

  await db
    .insert(notificationPreferences)
    .values(
      fetchedUsers.map((u) => ({
        userId: u.id,
        incidents: true,
        trainings: true,
        audits: true,
        inventory: true,
        emergency: true,
        messages: true,
        push: true,
        email: true,
      }))
    )
    .onConflictDoNothing();

  if (existingIncident.length > 0) return;

  const incidentSpecs = [
    {
      incidentId: "INC-2026-001",
      type: "safety",
      severity: "critical",
      status: "investigating",
      description: "Electrical cabinet arc flash alert in Workshop B",
      notes: "Circuit isolated immediately; fire watch posted.",
      zone: "Workshop B",
      department: "Maintenance",
      timestamp: daysAgo(2),
      geoLatitude: 35.4042,
      geoLongitude: 8.1242,
      manualAddress: "Building B - Panel 4",
      reporterId: amina.id,
      gravity: 5,
      probability: 3,
      rootCause: "Worn insulation on breaker relay",
      evaluatedSeverity: "critical",
      evaluatedAt: daysAgo(1),
      evaluatedById: salima.id,
    },
    {
      incidentId: "INC-2026-002",
      type: "near_miss",
      severity: "high",
      status: "open",
      description: "Forklift crossed pedestrian lane without audible warning",
      notes: "Mirror at aisle C needs realignment.",
      zone: "Warehouse",
      department: "Logistics",
      timestamp: daysAgo(4),
      geoLatitude: 35.4051,
      geoLongitude: 8.1255,
      manualAddress: "Warehouse Aisle C",
      reporterId: yacine.id,
      gravity: 4,
      probability: 3,
      rootCause: "Faded floor lane markings",
      evaluatedSeverity: "high",
      evaluatedAt: daysAgo(3),
      evaluatedById: mourad.id,
    },
    {
      incidentId: "INC-2026-003",
      type: "safety",
      severity: "medium",
      status: "open",
      description: "Hydraulic oil spill near Press #3 causing slip hazard",
      notes: "Absorbent pads applied; hose replacement scheduled.",
      zone: "Workshop A",
      department: "Production",
      timestamp: daysAgo(7),
      geoLatitude: 35.4035,
      geoLongitude: 8.1231,
      manualAddress: "Workshop A - Bay 3",
      reporterId: karim.id,
      gravity: 3,
      probability: 3,
      rootCause: "Aged hydraulic seal",
      evaluatedSeverity: "medium",
      evaluatedAt: daysAgo(6),
      evaluatedById: salima.id,
    },
    {
      incidentId: "INC-2026-004",
      type: "equipment_failure",
      severity: "high",
      status: "investigating",
      description: "Emergency stop button delayed response on sheet cutter",
      notes: "Equipment locked out and tagged out (LOTO).",
      zone: "Workshop B",
      department: "Production",
      timestamp: daysAgo(12),
      geoLatitude: 35.4046,
      geoLongitude: 8.1248,
      manualAddress: "Workshop B - Line 2",
      reporterId: karim.id,
      gravity: 4,
      probability: 2,
      rootCause: "Dust buildup in switch contacts",
      evaluatedSeverity: "high",
      evaluatedAt: daysAgo(11),
      evaluatedById: mourad.id,
    },
    {
      incidentId: "INC-2026-005",
      type: "environment",
      severity: "medium",
      status: "resolved",
      description: "Minor solvent spill during drum transfer",
      notes: "Contained with spill kit; waste disposed properly.",
      zone: "Workshop B",
      department: "Production",
      timestamp: daysAgo(25),
      geoLatitude: 35.404,
      geoLongitude: 8.1239,
      manualAddress: "Chemical Storage Bay",
      reporterId: amina.id,
      resolverId: salima.id,
      resolvedAt: daysAgo(23),
      gravity: 3,
      probability: 2,
      rootCause: "Transfer funnel misaligned",
      evaluatedSeverity: "medium",
      evaluatedAt: daysAgo(24),
      evaluatedById: salima.id,
    },
    {
      incidentId: "INC-2026-006",
      type: "safety",
      severity: "low",
      status: "resolved",
      description: "Loose floor cable across administrative corridor",
      notes: "Cable bridge installed across walkway.",
      zone: "Headquarters",
      department: "Administration",
      timestamp: daysAgo(38),
      geoLatitude: 35.4029,
      geoLongitude: 8.1225,
      manualAddress: "Admin Floor 2",
      reporterId: nadia.id,
      resolverId: mourad.id,
      resolvedAt: daysAgo(37),
      gravity: 2,
      probability: 2,
      rootCause: "Temporary workstation relocation",
      evaluatedSeverity: "low",
      evaluatedAt: daysAgo(37),
      evaluatedById: mourad.id,
    },
    {
      incidentId: "INC-2026-007",
      type: "near_miss",
      severity: "medium",
      status: "resolved",
      description: "Unsecured pallet stacked at upper rack C4",
      notes: "Re-palletized and shrink-wrapped.",
      zone: "Warehouse",
      department: "Logistics",
      timestamp: daysAgo(62),
      geoLatitude: 35.4054,
      geoLongitude: 8.1258,
      manualAddress: "Rack C4",
      reporterId: yacine.id,
      resolverId: salima.id,
      resolvedAt: daysAgo(60),
      gravity: 3,
      probability: 2,
      rootCause: "Rushed night-shift unloading",
      evaluatedSeverity: "medium",
      evaluatedAt: daysAgo(61),
      evaluatedById: salima.id,
    },
    {
      incidentId: "INC-2026-008",
      type: "safety",
      severity: "high",
      status: "closed",
      description: "Grinding sparks without face shield protection",
      notes: "Refresher toolbox talk completed for shift.",
      zone: "Workshop A",
      department: "Production",
      timestamp: daysAgo(92),
      geoLatitude: 35.4033,
      geoLongitude: 8.1235,
      manualAddress: "Grinding Station 1",
      reporterId: karim.id,
      resolverId: salima.id,
      resolvedAt: daysAgo(88),
      gravity: 4,
      probability: 2,
      rootCause: "PPE rack depleted at station",
      evaluatedSeverity: "high",
      evaluatedAt: daysAgo(90),
      evaluatedById: salima.id,
    },
    {
      incidentId: "INC-2026-009",
      type: "security",
      severity: "low",
      status: "closed",
      description: "Loading dock shutter left unlatched after delivery",
      notes: "Closing checklist added to security patrol.",
      zone: "Warehouse",
      department: "Logistics",
      timestamp: daysAgo(124),
      geoLatitude: 35.4056,
      geoLongitude: 8.1261,
      manualAddress: "Dock Gate 2",
      reporterId: yacine.id,
      resolverId: mourad.id,
      resolvedAt: daysAgo(122),
      gravity: 2,
      probability: 2,
      rootCause: "Delivery sign-off skipped",
      evaluatedSeverity: "low",
      evaluatedAt: daysAgo(123),
      evaluatedById: mourad.id,
    },
  ];

  const insertedIncidents = await db
    .insert(incidents)
    .values(
      incidentSpecs.map((item) => ({
        ...item,
        riskScore: item.gravity && item.probability ? item.gravity * item.probability : null,
        createdAt: item.timestamp,
      }))
    )
    .returning();

  await db.insert(incidentHistory).values(
    insertedIncidents.map((inc) => ({
      incidentId: inc.id,
      fromStatus: null,
      toStatus: inc.status,
      comment: "Initial report logged in PROSAFE",
      changedById: inc.reporterId ?? admin.id,
      changedAt: inc.createdAt,
    }))
  );

  // Inventory items
  const insertedItems = await db
    .insert(inventoryItems)
    .values([
      {
        name: "Safety Helmet EN 397",
        sku: "PPE-HLM-01",
        description: "High-density industrial safety helmet with chin strap",
        price: 28,
        quantity: 42,
        minStockLevel: 15,
        category: "ppe",
        status: "active",
        condition: "functional",
        expiryDate: daysAhead(420),
        lastInspectionAt: daysAgo(20),
        nextInspectionAt: daysAhead(160),
        supplier: "SafeGuard Industrial",
        location: "Central PPE Store",
      },
      {
        name: "CO2 Fire Extinguisher 5kg",
        sku: "FIRE-CO2-05",
        description: "Class B & electrical fire extinguisher, wall mounted",
        price: 115,
        quantity: 14,
        minStockLevel: 10,
        category: "fire_extinguisher",
        status: "active",
        condition: "functional",
        expiryDate: daysAhead(180),
        lastInspectionAt: daysAgo(170),
        nextInspectionAt: daysAhead(10),
        supplier: "ProFire Protection",
        location: "Workshop A & B",
      },
      {
        name: "Cut-Resistant Gloves Level D",
        sku: "PPE-GLV-04",
        description: "Nitrile-coated anti-cut work gloves",
        price: 12,
        quantity: 6,
        minStockLevel: 20,
        category: "ppe",
        status: "low_stock",
        condition: "functional",
        expiryDate: daysAhead(300),
        lastInspectionAt: daysAgo(10),
        nextInspectionAt: daysAhead(90),
        supplier: "SafeGuard Industrial",
        location: "Workshop A",
      },
      {
        name: "Multi-Gas Detector 4-in-1",
        sku: "DET-GAS-09",
        description: "Portable O2, LEL, CO, H2S detector with alarm",
        price: 540,
        quantity: 4,
        minStockLevel: 4,
        category: "detection",
        status: "active",
        condition: "non_functional",
        expiryDate: daysAhead(90),
        lastInspectionAt: daysAgo(45),
        nextInspectionAt: daysAgo(5),
        supplier: "EnviroSense Tech",
        location: "Maintenance Lab",
      },
      {
        name: "Industrial First Aid Kit (25p)",
        sku: "AID-KIT-25",
        description: "ISO-compliant wall-mounted emergency first aid box",
        price: 68,
        quantity: 9,
        minStockLevel: 6,
        category: "first_aid",
        status: "active",
        condition: "functional",
        expiryDate: daysAhead(22),
        lastInspectionAt: daysAgo(30),
        nextInspectionAt: daysAhead(20),
        supplier: "MedSafety Corp",
        location: "All Zones",
      },
      {
        name: "Full-Body Fall Arrest Harness",
        sku: "PPE-HAR-02",
        description: "EN 361 certified harness with shock-absorbing lanyard",
        price: 145,
        quantity: 3,
        minStockLevel: 8,
        category: "ppe",
        status: "low_stock",
        condition: "functional",
        expiryDate: daysAhead(365),
        lastInspectionAt: daysAgo(15),
        nextInspectionAt: daysAhead(165),
        supplier: "Altura Safety",
        location: "Warehouse Bay 1",
      },
      {
        name: "Lockout-Tagout (LOTO) Station",
        sku: "TOOL-LOTO-1",
        description: "Complete electrical & valve isolation padlock kit",
        price: 210,
        quantity: 8,
        minStockLevel: 5,
        category: "tools",
        status: "active",
        condition: "functional",
        lastInspectionAt: daysAgo(25),
        nextInspectionAt: daysAhead(155),
        supplier: "SafeGuard Industrial",
        location: "Workshop B",
      },
    ])
    .returning();

  // Maintenances
  await db.insert(maintenances).values([
    {
      itemId: insertedItems[3].id,
      type: "corrective",
      scheduledAt: daysAgo(4),
      status: "overdue",
      notes: "Recalibrate O2 sensor cell and replace battery pack",
    },
    {
      itemId: insertedItems[1].id,
      type: "inspection",
      scheduledAt: daysAhead(5),
      status: "planned",
      notes: "Semi-annual pressure gauge and seal check",
    },
    {
      itemId: insertedItems[4].id,
      type: "inspection",
      scheduledAt: daysAhead(12),
      status: "planned",
      notes: "Verify sterile dressings before expiry window",
    },
    {
      itemId: insertedItems[0].id,
      type: "inspection",
      scheduledAt: daysAgo(20),
      doneAt: daysAgo(20),
      performedById: amina.id,
      result: "ok",
      status: "done",
      notes: "Batch shell integrity verified",
    },
  ]);

  // Trainings & sessions & enrollments
  const insertedTrainings = await db
    .insert(trainings)
    .values([
      {
        title: "Fire Safety & Extinguisher Handling",
        description: "Practical fire response, extinguisher classes, and evacuation leadership",
        category: "Fire Safety",
        durationHours: 4,
        validityMonths: 12,
        mandatoryForRoles: ["employee", "sst_manager"],
        isActive: true,
      },
      {
        title: "Electrical Lockout / Tagout (LOTO)",
        description: "Zero-energy verification and lockout procedures for industrial machinery",
        category: "Electrical",
        durationHours: 6,
        validityMonths: 24,
        mandatoryForRoles: ["employee", "sst_manager"],
        isActive: true,
      },
      {
        title: "Workplace First Aid (SST)",
        description: "Emergency life-saving response and incident triage certification",
        category: "First Aid",
        durationHours: 14,
        validityMonths: 24,
        mandatoryForRoles: ["sst_manager"],
        isActive: true,
      },
      {
        title: "Working at Height & Fall Protection",
        description: "Harness inspection, anchor points, and rescue planning",
        category: "Heights",
        durationHours: 7,
        validityMonths: 12,
        mandatoryForRoles: ["employee"],
        isActive: true,
      },
    ])
    .returning();

  const insertedSessions = await db
    .insert(trainingSessions)
    .values([
      {
        trainingId: insertedTrainings[0].id,
        startAt: daysAgo(40),
        endAt: daysAgo(40),
        location: "Training Room A",
        trainer: "Capt. H. Mansouri",
        capacity: 15,
        status: "completed",
      },
      {
        trainingId: insertedTrainings[1].id,
        startAt: daysAhead(7),
        endAt: daysAhead(7),
        location: "Workshop B Lab",
        trainer: "Ing. K. Rahmani",
        capacity: 12,
        status: "planned",
      },
      {
        trainingId: insertedTrainings[2].id,
        startAt: daysAgo(90),
        endAt: daysAgo(89),
        location: "Medical Annex",
        trainer: "Dr. F. Ziani",
        capacity: 10,
        status: "completed",
      },
    ])
    .returning();

  await db.insert(enrollments).values([
    {
      sessionId: insertedSessions[0].id,
      userId: karim.id,
      status: "passed",
      score: 92,
      progress: 100,
      completedAt: daysAgo(40),
      expiresAt: daysAhead(325),
    },
    {
      sessionId: insertedSessions[0].id,
      userId: amina.id,
      status: "passed",
      score: 96,
      progress: 100,
      completedAt: daysAgo(40),
      expiresAt: daysAhead(20),
    },
    {
      sessionId: insertedSessions[0].id,
      userId: salima.id,
      status: "passed",
      score: 98,
      progress: 100,
      completedAt: daysAgo(40),
      expiresAt: daysAhead(325),
    },
    {
      sessionId: insertedSessions[1].id,
      userId: yacine.id,
      status: "registered",
      progress: 0,
    },
    {
      sessionId: insertedSessions[2].id,
      userId: salima.id,
      status: "passed",
      score: 95,
      progress: 100,
      completedAt: daysAgo(89),
      expiresAt: daysAhead(640),
    },
    {
      sessionId: insertedSessions[2].id,
      userId: mourad.id,
      status: "passed",
      score: 90,
      progress: 100,
      completedAt: daysAgo(89),
      expiresAt: daysAhead(640),
    },
  ]);

  // Risks, action plans, LMRA
  const riskSpecs = [
    {
      title: "High-voltage arc flash during panel maintenance",
      description: "Exposure to electrical arc in aging switchgear cabinets",
      hazardCategory: "Electrical",
      zone: "Workshop B",
      department: "Maintenance",
      gravity: 5,
      probability: 4,
      recommendedMeasures: "Enforce LOTO, arc-flash PPE suit, and annual thermography",
      status: "validated",
      proposedById: amina.id,
      validatedById: salima.id,
    },
    {
      title: "Forklift-pedestrian collision in Warehouse aisles",
      description: "Shared traffic lanes with blind corners near loading docks",
      hazardCategory: "Traffic",
      zone: "Warehouse",
      department: "Logistics",
      gravity: 4,
      probability: 4,
      recommendedMeasures: "Install blue-spot lights, convex mirrors, and repainted walkways",
      status: "validated",
      proposedById: yacine.id,
      validatedById: mourad.id,
    },
    {
      title: "Hydraulic oil slip hazard around stamping presses",
      description: "Recurring drips around Press #2 and #3 fittings",
      hazardCategory: "Mechanical",
      zone: "Workshop A",
      department: "Production",
      gravity: 3,
      probability: 4,
      recommendedMeasures: "Install drip trays and upgrade braided hoses",
      status: "validated",
      proposedById: karim.id,
      validatedById: salima.id,
    },
    {
      title: "Chemical vapor exposure during solvent decanting",
      description: "Local exhaust ventilation flow drops during peak hours",
      hazardCategory: "Chemical",
      zone: "Workshop B",
      department: "Production",
      gravity: 4,
      probability: 2,
      recommendedMeasures: "Service extraction hood and mandate organic vapor respirators",
      status: "mitigated",
      proposedById: salima.id,
      validatedById: admin.id,
    },
    {
      title: "Elevated noise levels at grinding bay",
      description: "Measured 89 dB(A) over 8-hour shift",
      hazardCategory: "Physical",
      zone: "Workshop A",
      department: "Production",
      gravity: 3,
      probability: 3,
      recommendedMeasures: "Mandatory hearing protection signage and acoustic baffles",
      status: "validated",
      proposedById: mourad.id,
      validatedById: salima.id,
    },
    {
      title: "Manual handling strain during carton stacking",
      description: "Repetitive lifting above shoulder height",
      hazardCategory: "Ergonomic",
      zone: "Warehouse",
      department: "Logistics",
      gravity: 2,
      probability: 3,
      recommendedMeasures: "Deploy scissor lift tables and ergonomic training",
      status: "proposed",
      proposedById: yacine.id,
    },
  ];

  const insertedRisks = await db
    .insert(risks)
    .values(
      riskSpecs.map((r) => {
        const { score, level } = computeRiskScore(r.gravity, r.probability);
        return { ...r, score, level };
      })
    )
    .returning();

  await db.insert(actionPlans).values([
    {
      riskId: insertedRisks[0].id,
      title: "Upgrade Workshop B switchgear & infrared audit",
      description: "Replace Panel 4 breaker relays and complete thermal scan",
      ownerId: amina.id,
      dueDate: daysAhead(14),
      status: "in_progress",
      progress: 55,
    },
    {
      riskId: insertedRisks[1].id,
      title: "Repaint warehouse pedestrian lanes & install mirrors",
      description: "High-visibility epoxy floor markings and 4 convex mirrors",
      ownerId: yacine.id,
      dueDate: daysAgo(3),
      status: "in_progress",
      progress: 70,
    },
    {
      riskId: insertedRisks[2].id,
      title: "Install spill containment trays under Press #3",
      description: "Fabricate steel catch pans and schedule seal kit replacement",
      ownerId: karim.id,
      dueDate: daysAhead(21),
      status: "planned",
      progress: 20,
    },
  ]);

  await db.insert(lmraAssessments).values([
    {
      userId: amina.id,
      task: "Replacing breaker relay in Panel 4",
      location: "Workshop B",
      hazards: [
        { label: "Live electrical parts", present: true, controlled: true },
        { label: "Arc flash boundary marked", present: true, controlled: true },
        { label: "Insulated tools verified", present: true, controlled: true },
      ],
      decision: "go",
      comments: "LOTO applied and zero-voltage tested.",
      createdAt: daysAgo(1),
    },
    {
      userId: yacine.id,
      task: "Unloading pallets at Dock Gate 2",
      location: "Warehouse",
      hazards: [
        { label: "Wet loading ramp", present: true, controlled: false },
        { label: "Wheel chocks in place", present: true, controlled: true },
      ],
      decision: "stop",
      comments: "Paused unloading until ramp dried and grit applied.",
      createdAt: daysAgo(3),
    },
  ]);

  // Checklist templates, audits, responses, compliance documents
  const insertedTemplates = await db
    .insert(checklistTemplates)
    .values([
      {
        name: "ISO 45001:2018 Operational Safety Audit",
        standard: "ISO 45001",
        items: [
          { id: 1, clause: "6.1.2", question: "Hazard identification and risk register up to date?" },
          { id: 2, clause: "7.2", question: "Mandatory safety training records valid for all operators?" },
          { id: 3, clause: "8.1.2", question: "PPE available, inspected, and worn in mandatory zones?" },
          { id: 4, clause: "8.2", question: "Emergency exits unobstructed and assembly signage visible?" },
          { id: 5, clause: "9.1", question: "Fire extinguishers and gas detectors within inspection dates?" },
        ],
      },
      {
        name: "Workshop Fire & Electrical Readiness",
        standard: "NFPA / Internal",
        items: [
          { id: 1, clause: "E-01", question: "Electrical panels closed with 1m clearance?" },
          { id: 2, clause: "E-02", question: "LOTO stations stocked and accessible?" },
          { id: 3, clause: "F-01", question: "CO2 extinguishers tagged and pressurized?" },
        ],
      },
    ])
    .returning();

  const insertedAudits = await db
    .insert(audits)
    .values([
      {
        title: "Q3 ISO 45001 Internal Safety Audit",
        type: "internal",
        standard: "ISO 45001",
        scheduledAt: daysAgo(18),
        completedAt: daysAgo(17),
        auditorId: salima.id,
        zone: "Workshop A",
        status: "completed",
        score: 80,
        templateId: insertedTemplates[0].id,
      },
      {
        title: "Workshop B Electrical Readiness Inspection",
        type: "internal",
        standard: "NFPA / Internal",
        scheduledAt: daysAgo(1),
        auditorId: mourad.id,
        zone: "Workshop B",
        status: "in_progress",
        score: 67,
        templateId: insertedTemplates[1].id,
      },
      {
        title: "Annual External Certification Surveillance",
        type: "external",
        standard: "ISO 45001",
        scheduledAt: daysAhead(16),
        auditorName: "Bureau Veritas HSE",
        zone: "All Zones",
        status: "planned",
        templateId: insertedTemplates[0].id,
      },
    ])
    .returning();

  await db.insert(auditResponses).values([
    { auditId: insertedAudits[0].id, itemId: 1, result: "conform", comment: "Updated monthly" },
    { auditId: insertedAudits[0].id, itemId: 2, result: "conform", comment: "Matrix reviewed" },
    { auditId: insertedAudits[0].id, itemId: 3, result: "conform", comment: "Full compliance observed" },
    { auditId: insertedAudits[0].id, itemId: 4, result: "conform", comment: "Clear signage" },
    { auditId: insertedAudits[0].id, itemId: 5, result: "non_conform", comment: "Gas detector #9 overdue" },
    { auditId: insertedAudits[1].id, itemId: 1, result: "non_conform", comment: "Panel 4 requires relay swap" },
    { auditId: insertedAudits[1].id, itemId: 2, result: "conform", comment: "LOTO kit complete" },
    { auditId: insertedAudits[1].id, itemId: 3, result: "conform", comment: "Pressure gauges green" },
  ]);

  await db.insert(complianceDocuments).values([
    {
      title: "ISO 45001:2018 Site Certificate",
      type: "certificate",
      fileName: "iso-45001-certificate-2026.pdf",
      mimeType: "application/pdf",
      fileSize: 248320,
      validUntil: daysAhead(290),
      auditId: insertedAudits[0].id,
    },
    {
      title: "Emergency Evacuation Procedure Rev 4",
      type: "procedure",
      fileName: "evacuation-procedure-rev4.pdf",
      mimeType: "application/pdf",
      fileSize: 184120,
      validUntil: daysAhead(18),
    },
    {
      title: "HSE Corporate Safety Policy 2026",
      type: "policy",
      fileName: "hse-policy-2026.pdf",
      mimeType: "application/pdf",
      fileSize: 96400,
      validUntil: daysAhead(340),
    },
  ]);

  // Corrective actions
  await db.insert(correctiveActions).values([
    {
      sourceType: "incident",
      sourceId: insertedIncidents[0].id,
      title: "Replace Panel 4 breaker relay & perform thermography",
      description: "Verify insulation resistance before re-energizing",
      ownerId: amina.id,
      dueDate: daysAhead(5),
      status: "in_progress",
    },
    {
      sourceType: "incident",
      sourceId: insertedIncidents[1].id,
      title: "Re-align convex safety mirror at Warehouse Aisle C",
      description: "Restore full line of sight for forklift operators",
      ownerId: yacine.id,
      dueDate: daysAgo(2),
      status: "todo",
    },
    {
      sourceType: "audit",
      sourceId: insertedAudits[0].id,
      title: "Calibrate Multi-Gas Detector DET-GAS-09",
      description: "Send to certified calibration lab and log certificate",
      ownerId: mourad.id,
      dueDate: daysAhead(7),
      status: "todo",
    },
    {
      sourceType: "risk",
      sourceId: insertedRisks[2].id,
      title: "Install hydraulic drip pans under Press #3",
      description: "Prevent oil accumulation on operator mat",
      ownerId: karim.id,
      dueDate: daysAgo(10),
      status: "done",
      doneAt: daysAgo(12),
    },
  ]);

  // Alerts
  await db.insert(alerts).values([
    {
      title: "Critical electrical incident open in Workshop B",
      description: "INC-2026-001 requires electrical isolation sign-off before restart.",
      severity: "critical",
      status: "unresolved",
      type: "critical_incident",
      affectedUserId: amina.id,
      createdAt: daysAgo(2),
    },
    {
      title: "Gas detector calibration overdue",
      description: "Multi-Gas Detector DET-GAS-09 is marked non-functional and overdue.",
      severity: "high",
      status: "investigating",
      type: "maintenance",
      createdAt: daysAgo(4),
    },
    {
      title: "Low stock alert: Cut-Resistant Gloves Level D",
      description: "Remaining quantity (6) is below minimum stock level (20).",
      severity: "medium",
      status: "unresolved",
      type: "stock",
      createdAt: daysAgo(3),
    },
    {
      title: "Compliance document expiring within 30 days",
      description: "Emergency Evacuation Procedure Rev 4 requires periodic review.",
      severity: "low",
      status: "resolved",
      type: "compliance",
      resolvedById: salima.id,
      resolvedAt: daysAgo(1),
      createdAt: daysAgo(6),
    },
  ]);

  // Emergency scenarios & drills
  const insertedScenarios = await db
    .insert(emergencyScenarios)
    .values([
      {
        title: "Workshop Fire & Evacuation",
        type: "fire",
        steps: [
          "Activate the nearest fire alarm pull station",
          "Shut down machinery power if safe to do so",
          "Evacuate calmly via marked green exit routes",
          "Report to Assembly Point North for headcount",
        ],
        contacts: [
          { name: "Salima Ouali", role: "Chief Fire Warden", phone: "+213 555 00 00 02" },
          { name: "Civil Protection", role: "External Fire Dept", phone: "14" },
        ],
        assemblyPoint: "North Gate Parking Area",
        isActive: true,
      },
      {
        title: "Chemical Spill Containment",
        type: "chemical",
        steps: [
          "Evacuate personnel upwind of the spill area",
          "Don chemical-resistant gloves and splash goggles",
          "Deploy absorbent booms around floor drains",
          "Notify HSE Coordinator and log waste manifest",
        ],
        contacts: [
          { name: "Mourad Kaci", role: "Hazmat Lead", phone: "+213 555 00 00 03" },
        ],
        assemblyPoint: "East Courtyard",
        isActive: true,
      },
    ])
    .returning();

  await db.insert(drills).values([
    {
      scenarioId: insertedScenarios[0].id,
      scheduledAt: daysAgo(45),
      zone: "All Zones",
      status: "done",
      durationSeconds: 215,
      participantsCount: 64,
      evacuatedCount: 64,
      observations: "Full site evacuated in 3m 35s; north siren volume verified.",
    },
    {
      scenarioId: insertedScenarios[1].id,
      scheduledAt: daysAhead(18),
      zone: "Workshop B",
      status: "planned",
      observations: "Scheduled spill-kit deployment exercise.",
    },
  ]);

  // Notifications
  await db.insert(notifications).values([
    {
      userId: admin.id,
      type: "incident",
      title: "Critical incident reported",
      body: "INC-2026-001: Electrical cabinet arc flash alert in Workshop B",
      createdAt: daysAgo(2),
    },
    {
      userId: admin.id,
      type: "inventory",
      title: "Low PPE stock warning",
      body: "Cut-Resistant Gloves Level D dropped to 6 units (min 20).",
      createdAt: daysAgo(3),
    },
    {
      userId: salima.id,
      type: "audit",
      title: "Upcoming ISO 45001 audit",
      body: "External surveillance audit scheduled in 16 days.",
      createdAt: daysAgo(1),
    },
  ]);

  // Conversations & messages
  const [conv1] = await db
    .insert(conversations)
    .values({
      subject: "Workshop B Panel 4 isolation follow-up",
      participantIds: [admin.id, salima.id, amina.id],
      updatedAt: daysAgo(1),
    })
    .returning();

  await db.insert(conversationMessages).values([
    {
      conversationId: conv1.id,
      senderId: amina.id,
      body: "Panel 4 is locked out and tagged out. Replacement relay arrives tomorrow morning.",
      readByIds: [amina.id, salima.id],
      createdAt: daysAgo(2),
    },
    {
      conversationId: conv1.id,
      senderId: salima.id,
      body: "Thanks Amina. Keep the LOTO permit open until we complete the thermal check together.",
      readByIds: [salima.id, amina.id],
      createdAt: daysAgo(1),
    },
  ]);

  // Rewards
  await db.insert(rewards).values([
    { userId: karim.id, points: 120, reason: "Proactive hazard & near-miss reporting", incidentId: insertedIncidents[2].id },
    { userId: amina.id, points: 95, reason: "Rapid electrical hazard isolation", incidentId: insertedIncidents[0].id },
    { userId: yacine.id, points: 70, reason: "Warehouse safety & LMRA stop-work call", incidentId: insertedIncidents[1].id },
    { userId: nadia.id, points: 35, reason: "Office walkway hazard report", incidentId: insertedIncidents[5].id },
  ]);

  // Feedback
  await db.insert(feedbackItems).values([
    {
      userId: karim.id,
      rating: 5,
      category: "usability",
      comment: "Reporting near-misses with location tags is much faster now.",
      appVersion: "2.4.0",
      platform: "android",
      createdAt: daysAgo(5),
    },
    {
      userId: amina.id,
      rating: 4,
      category: "suggestion",
      comment: "Would love offline photo queueing in the basement electrical room.",
      appVersion: "2.4.0",
      platform: "ios",
      createdAt: daysAgo(9),
    },
    {
      userId: yacine.id,
      rating: 5,
      category: "usability",
      comment: "LMRA checklist before unloading trucks is super clear.",
      appVersion: "2.4.0",
      platform: "android",
      createdAt: daysAgo(14),
    },
  ]);
}
