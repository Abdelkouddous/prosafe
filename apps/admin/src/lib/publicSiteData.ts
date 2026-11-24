export type BillingCycle = "monthly" | "annual";

export interface PricingTier {
  id: "starter" | "operations" | "enterprise";
  name: string;
  tagline: string;
  monthlyPrice: number | null;
  siteLimit: string;
  userLimit: string;
  highlighted?: boolean;
  ctaLabel: string;
  ctaTo: string;
  features: string[];
}

export interface FeatureModule {
  id: string;
  category: "field" | "risk" | "workforce";
  categoryLabel: string;
  number: string;
  title: string;
  summary: string;
  outcomes: string[];
  dashboardRoute: string;
}

export interface BlogArticle {
  id: string;
  category: "ISO 45001" | "Risk Prevention" | "Emergency Readiness" | "Field Operations";
  title: string;
  excerpt: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  body: string[];
}

export interface OpenRole {
  id: string;
  department: "Engineering" | "HSE Advisory" | "Product & Design" | "Customer Success";
  title: string;
  location: string;
  type: string;
  summary: string;
  requirements: string[];
}

export interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  category: "Safety Core" | "Compliance" | "Platform";
  title: string;
  summary: string;
  highlights: string[];
}

export interface ContactFormInput {
  fullName: string;
  email: string;
  company?: string;
  phone?: string;
  topic: string;
  message: string;
}

export interface ContactValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ContactFormInput, string>>;
}

export const ANNUAL_DISCOUNT_RATE = 0.2;

export function calculatePlanPrice(
  monthlyPrice: number | null,
  cycle: BillingCycle
): { perMonth: number | null; billedAnnually: number | null; annualSavings: number } {
  if (monthlyPrice === null || monthlyPrice < 0) {
    return { perMonth: null, billedAnnually: null, annualSavings: 0 };
  }
  if (cycle === "monthly") {
    return { perMonth: monthlyPrice, billedAnnually: null, annualSavings: 0 };
  }
  const discountedMonthly = Math.round(monthlyPrice * (1 - ANNUAL_DISCOUNT_RATE));
  const billedAnnually = discountedMonthly * 12;
  const annualSavings = monthlyPrice * 12 - billedAnnually;
  return { perMonth: discountedMonthly, billedAnnually, annualSavings };
}

export function validateContactInquiry(input: ContactFormInput): ContactValidationResult {
  const errors: Partial<Record<keyof ContactFormInput, string>> = {};
  const fullName = input.fullName.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (fullName.length < 2) {
    errors.fullName = "Please enter your full name (at least 2 characters).";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    errors.email = "Please enter a valid work email address.";
  }

  if (message.length < 10) {
    errors.message = "Please describe your request in at least 10 characters.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function filterBlogArticles(
  articles: BlogArticle[],
  category: string,
  query: string
): BlogArticle[] {
  const normalizedQuery = query.trim().toLowerCase();
  return articles.filter((article) => {
    const matchesCategory = category === "All" || article.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    return (
      article.title.toLowerCase().includes(normalizedQuery) ||
      article.excerpt.toLowerCase().includes(normalizedQuery) ||
      article.category.toLowerCase().includes(normalizedQuery) ||
      article.author.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function filterOpenRoles(roles: OpenRole[], department: string): OpenRole[] {
  if (department === "All") return roles;
  return roles.filter((role) => role.department === department);
}

export function filterChangelogEntries(
  entries: ChangelogEntry[],
  category: string
): ChangelogEntry[] {
  if (category === "All") return entries;
  return entries.filter((entry) => entry.category === category);
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For single industrial sites digitizing incident logs and PPE tracking.",
    monthlyPrice: 79,
    siteLimit: "1 site · up to 50 employees",
    userLimit: "3 HSE managers included",
    ctaLabel: "Launch Live Demo",
    ctaTo: "/login",
    features: [
      "Geolocated incident & near-miss reporting",
      "5x5 Risk Matrix & hazard register",
      "PPE & fire extinguisher stock tracking",
      "Email & in-app safety alerts",
      "Monthly CSV compliance exports",
    ],
  },
  {
    id: "operations",
    name: "Operations",
    tagline: "Full ISO 45001 workflows for multi-workshop plants and logistics hubs.",
    monthlyPrice: 199,
    siteLimit: "Up to 5 sites · 300 employees",
    userLimit: "Unlimited HSE managers & auditors",
    highlighted: true,
    ctaLabel: "Request Site Walkthrough",
    ctaTo: "/contact?topic=demo",
    features: [
      "Everything in Starter, plus corrective action tracking",
      "ISO 45001 internal & external audit checklists",
      "LMRA pre-task checklists & action plan progress",
      "Training catalogue, sessions & certification expiry alerts",
      "Emergency drill planning & real-time WebSocket broadcasts",
      "EN / FR / AR multilingual interface with RTL support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Dedicated deployment for industrial groups with custom ERP & SSO needs.",
    monthlyPrice: null,
    siteLimit: "Unlimited sites & employees",
    userLimit: "Dedicated HSE implementation lead",
    ctaLabel: "Contact Enterprise Sales",
    ctaTo: "/contact?topic=enterprise",
    features: [
      "Everything in Operations, with dedicated PostgreSQL isolation",
      "Custom SAML / Google Workspace SSO & granular RBAC",
      "ERP, HRIS & IoT gas-sensor webhook integrations",
      "On-site ISO 45001 readiness audit & team training",
      "99.9% uptime SLA and priority 24/7 incident support",
    ],
  },
];

export const FEATURE_MODULES: FeatureModule[] = [
  {
    id: "incidents",
    category: "field",
    categoryLabel: "Field & Incidents",
    number: "01",
    title: "Geolocated Incident & Near-Miss Reporting",
    summary:
      "Capture workplace incidents in under 60 seconds with GPS coordinates, zone tags, root-cause evaluation, and full status audit trails.",
    outcomes: [
      "Interactive facility incident map with severity markers",
      "Automatic severity scoring from gravity and probability",
      "Linked corrective actions with accountable owners and due dates",
    ],
    dashboardRoute: "/incidents/manage",
  },
  {
    id: "emergency",
    category: "field",
    categoryLabel: "Field & Incidents",
    number: "02",
    title: "Emergency Scenarios & Evacuation Drills",
    summary:
      "Trigger real-time site-wide emergency banners over WebSockets, coordinate fire wardens, and benchmark evacuation drill times.",
    outcomes: [
      "Pre-configured fire, chemical spill, and medical response playbooks",
      "Instant Socket.IO broadcast alerts across active manager consoles",
      "Drill headcount and evacuation duration logs for regulatory inspections",
    ],
    dashboardRoute: "/emergency",
  },
  {
    id: "risk-matrix",
    category: "risk",
    categoryLabel: "Risk & Audits",
    number: "03",
    title: "5x5 Risk Matrix, Action Plans & LMRA",
    summary:
      "Prioritize electrical, chemical, traffic, and mechanical hazards visually while empowering technicians to run Last Minute Risk Assessments before high-risk jobs.",
    outcomes: [
      "Interactive 5x5 gravity-by-probability heatmap",
      "Action plan progress tracking tied directly to residual risk reduction",
      "Go / Stop LMRA decision logs recorded before panel or dock work",
    ],
    dashboardRoute: "/risks/matrix",
  },
  {
    id: "audits",
    category: "risk",
    categoryLabel: "Risk & Audits",
    number: "04",
    title: "ISO 45001 Audits & Compliance Documents",
    summary:
      "Schedule internal and external surveillance audits, score clause-by-clause checklists, and monitor expiring certificates and procedures.",
    outcomes: [
      "Reusable ISO 45001 and NFPA electrical inspection templates",
      "Automatic conformity scoring and non-conformity action generation",
      "30-day renewal alerts for certificates, policies, and SOPs",
    ],
    dashboardRoute: "/audits",
  },
  {
    id: "equipment",
    category: "workforce",
    categoryLabel: "Workforce & Assets",
    number: "05",
    title: "Safety Equipment & Preventive Maintenance",
    summary:
      "Track PPE stock thresholds, CO2 extinguisher pressure checks, LOTO stations, and multi-gas detector calibration schedules in one ledger.",
    outcomes: [
      "Low-stock alerts before critical PPE stations run dry",
      "Overdue maintenance flags for non-functional detection devices",
      "Complete inspection history per SKU and facility zone",
    ],
    dashboardRoute: "/equipment",
  },
  {
    id: "trainings",
    category: "workforce",
    categoryLabel: "Workforce & Assets",
    number: "06",
    title: "Safety Training & Certification Compliance",
    summary:
      "Manage mandatory Fire Safety, Electrical LOTO, First Aid (SST), and Working at Height courses with automated expiry tracking per employee.",
    outcomes: [
      "Role-based compliance matrix showing valid, expiring, and missing certs",
      "Session capacity planning with trainer assignments and pass scores",
      "Proactive safety rewards & employee feedback loops to build safety culture",
    ],
    dashboardRoute: "/trainings/compliance",
  },
];

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: "iso-45001-clause-8-readiness",
    category: "ISO 45001",
    title: "Preparing an Industrial Site for ISO 45001 Surveillance Audits Without Spreadsheet Chaos",
    excerpt:
      "How HSE coordinators link daily near-miss reports, calibration logs, and training matrices into a single verifiable audit trail.",
    author: "Salima Ouali",
    authorRole: "Lead HSE Operations Advisor",
    publishedAt: "October 14, 2026",
    readTime: "6 min read",
    body: [
      "Most manufacturing and logistics facilities already collect plenty of safety data — paper inspection sheets clipped to fire extinguishers, Excel training trackers on a supervisor's laptop, and incident emails buried in shared inboxes. The breakdown happens two weeks before an external ISO 45001 surveillance audit when teams scramble to prove that a non-conformity actually resulted in a verified corrective action.",
      "Under ISO 45001 clauses 6.1.2, 7.2, and 9.1, auditors look for closed loops rather than static binders. When a technician reports an oil leak near a stamping press, the record should flow directly from initial report to risk scoring, assigned owner, completion date, and effectiveness review.",
      "Sites running PROSAFE cut pre-audit evidence preparation from 5 days to under 3 hours by tying checklist non-conformities directly to corrective actions and maintaining live expiry dates on every safety certificate and calibration log.",
    ],
  },
  {
    id: "lmra-stop-work-authority",
    category: "Risk Prevention",
    title: "Designing a 90-Second LMRA Checklist Technicians Actually Use Before Energized Work",
    excerpt:
      "Why overly long job safety analyses get rubber-stamped — and how three focused Stop-Work checks prevent severe electrical and dock injuries.",
    author: "Mourad Kaci",
    authorRole: "Production Safety Lead",
    publishedAt: "September 28, 2026",
    readTime: "5 min read",
    body: [
      "A Last Minute Risk Assessment (LMRA) only works if a maintenance technician can complete it at the panel or loading bay in under 90 seconds. When forms ask 35 generic questions, crews fill them out in the breakroom after the job is finished.",
      "High-reliability teams focus on three high-energy controls: isolation verified (LOTO applied and zero-voltage tested), physical barriers or PPE in place for the exact hazard, and changing environmental conditions such as wet ramps or nearby forklift traffic.",
      "Just as important is rewarding Stop-Work decisions. When an operator logs a 'Stop' assessment because a loading ramp is slick or a safety mirror is misaligned, recognizing that call publicly turns compliance into genuine frontline ownership.",
    ],
  },
  {
    id: "evacuation-drill-metrics",
    category: "Emergency Readiness",
    title: "Benchmarking Evacuation Drills: Turning Assembly Headcounts Into Actionable Site Improvements",
    excerpt:
      "Tracking siren audibility, bottleneck exits, and full-site evacuation duration across multi-shift warehouses.",
    author: "Dr. Farid Ziani",
    authorRole: "Industrial Emergency Consultant",
    publishedAt: "September 10, 2026",
    readTime: "4 min read",
    body: [
      "Running a yearly fire drill to satisfy a regulatory checkbox misses the real value of emergency exercises. High-hazard plants treat every drill as a timed engineering test of routes, alarm coverage, and warden coordination.",
      "Recording four simple metrics — total evacuation time in seconds, participants present vs. accounted for at the assembly point, zone-specific bottlenecks, and siren dead zones — gives facility leaders concrete fixes for the next quarter.",
      "With PROSAFE's Emergency module, wardens trigger live alerts, verify scenario steps on mobile or desktop, and compare drill durations over time to confirm that new layout changes never slow egress.",
    ],
  },
  {
    id: "ppe-calibration-blind-spots",
    category: "Field Operations",
    title: "Eliminating Silent Failures in Multi-Gas Detectors and PPE Stockrooms",
    excerpt:
      "Preventing overdue sensor calibrations and empty cut-resistant glove dispensers before they trigger shift stoppages.",
    author: "Amina Boudiaf",
    authorRole: "Maintenance Reliability Engineer",
    publishedAt: "August 22, 2026",
    readTime: "5 min read",
    body: [
      "Portable 4-in-1 gas detectors and lockout-tagout kits rarely fail loudly — they drift out of calibration or go missing right when a confined-space or panel intervention is scheduled.",
      "Separating physical stock quantity from functional condition ensures teams immediately see when four detectors exist on paper but one is overdue for O2 cell recalibration.",
      "Automated low-stock alerts paired with scheduled maintenance reminders keep Workshop A and B stocked with certified EN 397 helmets, Level D cut-resistant gloves, and pressurized CO2 extinguishers year-round.",
    ],
  },
];

export const OPEN_ROLES: OpenRole[] = [
  {
    id: "senior-fullstack-ts",
    department: "Engineering",
    title: "Senior Full-Stack TypeScript Engineer",
    location: "Algiers or Remote (EMEA)",
    type: "Full-time",
    summary:
      "Own end-to-end features across our React/Vite admin platform, Node/Express API, PostgreSQL/Drizzle schema, and Socket.IO realtime alerts.",
    requirements: [
      "4+ years shipping production TypeScript, React, and PostgreSQL web applications",
      "Strong grasp of relational data modeling, API security, and automated testing",
      "Bonus: experience with offline-first mobile or industrial B2B SaaS",
    ],
  },
  {
    id: "mobile-react-native",
    department: "Engineering",
    title: "Mobile Engineer (React Native / Expo)",
    location: "Remote (EMEA)",
    type: "Full-time",
    summary:
      "Build field-ready incident reporting, offline photo queueing, and QR equipment scanning for technicians working in low-connectivity plants.",
    requirements: [
      "3+ years with React Native, Expo, and offline synchronization patterns",
      "Experience with geolocation, camera capture, and push notifications",
      "High attention to large touch targets and gloved-hand field usability",
    ],
  },
  {
    id: "hse-implementation-lead",
    department: "HSE Advisory",
    title: "ISO 45001 Implementation Specialist",
    location: "Algiers / Hybrid",
    type: "Full-time",
    summary:
      "Guide manufacturing, energy, and logistics customers through risk matrix setup, audit template localization, and frontline safety onboarding.",
    requirements: [
      "Certified ISO 45001 Lead Auditor or 5+ years in industrial HSE / SST management",
      "Fluent in French, Arabic, and English for multi-site field workshops",
      "Proven track record reducing LTIR and closing corrective actions on time",
    ],
  },
  {
    id: "product-designer-b2b",
    department: "Product & Design",
    title: "Senior Product Designer (Industrial SaaS)",
    location: "Remote (EMEA)",
    type: "Full-time",
    summary:
      "Craft clear, high-contrast operational interfaces for safety managers, warehouse leads, and plant directors across LTR and RTL Arabic layouts.",
    requirements: [
      "Portfolio demonstrating complex data tables, maps, and B2B operational workflows",
      "Deep understanding of WCAG AA/high-contrast accessibility and RTL typography",
      "Comfortable prototyping directly alongside frontend engineers",
    ],
  },
  {
    id: "customer-success-hse",
    department: "Customer Success",
    title: "Enterprise Customer Success Manager",
    location: "Paris or Algiers (Hybrid)",
    type: "Full-time",
    summary:
      "Partner with multi-site HSE directors post-launch to drive field adoption, quarterly safety KPI reviews, and expansion across new facilities.",
    requirements: [
      "3+ years in B2B SaaS customer success or industrial operations consulting",
      "Fluent in French and English; Arabic is a strong advantage",
      "Analytical mindset with clear executive communication skills",
    ],
  },
];

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    id: "v2-4-0",
    version: "v2.4.0",
    date: "November 2026",
    category: "Platform",
    title: "Unified Cloud-Ready Deployment, One-Click Live Demo & Public Marketing Portal",
    summary:
      "Consolidated the admin SPA, Express API, and Socket.IO realtime gateway into a single production service with instant interactive demo access.",
    highlights: [
      "One-click Live Demo session with pre-seeded ISO 45001 audits, incidents, risks, and equipment",
      "Full English, French, and Arabic (RTL) coverage across landing and public pages",
      "Firebase Google Sign-In alongside signed HMAC session tokens and RBAC enforcement",
    ],
  },
  {
    id: "v2-3-0",
    version: "v2.3.0",
    date: "October 2026",
    category: "Safety Core",
    title: "Interactive 5x5 Risk Matrix, LMRA Stop-Work Logs & Geofenced Incident Map",
    summary:
      "Expanded risk management with dynamic gravity-by-probability scoring and pre-task LMRA hazard verification.",
    highlights: [
      "Automatic risk score computation and severity bands across all facility zones",
      "Leaflet incident map showing active Workshop A, Workshop B, and Warehouse reports",
      "Direct corrective action creation linked to incidents, audits, and high-priority risks",
    ],
  },
  {
    id: "v2-2-0",
    version: "v2.2.0",
    date: "September 2026",
    category: "Compliance",
    title: "ISO 45001 Audit Execution Engine & Compliance Document Vault",
    summary:
      "Introduced clause-level audit templates, live conformity scoring, and automated certificate expiration monitoring.",
    highlights: [
      "Reusable ISO 45001:2018 and NFPA electrical inspection checklists",
      "30-day advance warnings on expiring site certificates and evacuation procedures",
      "One-click CSV and printable executive safety compliance reports",
    ],
  },
  {
    id: "v2-1-0",
    version: "v2.1.0",
    date: "August 2026",
    category: "Safety Core",
    title: "Real-Time Emergency Broadcasts & Preventive Maintenance Planning",
    summary:
      "Added site-wide emergency alert banners over Socket.IO and scheduled equipment inspection calendars.",
    highlights: [
      "Instant emergency banner propagation for fire and chemical spill scenarios",
      "Drill timing and headcount recording for regulatory compliance logs",
      "Overdue maintenance detection for gas detectors and fire suppression gear",
    ],
  },
];
