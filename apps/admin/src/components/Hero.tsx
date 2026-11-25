import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Grid2x2,
  Loader2,
  Lock,
  MapPin,
  PlayCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { resolvePublicLocale, type PublicLocale } from "@/lib/publicSiteCopy";
import {
  evaluateRiskCell,
  GRAVITY_LEVELS,
  PROBABILITY_LEVELS,
  type HeroRiskLevel,
} from "@/lib/heroRiskMatrix";

type ExplorerTabId = "matrix" | "incidents" | "audits" | "architecture";

interface ExplorerLocaleCopy {
  tabs: Record<ExplorerTabId, { label: string; shortLabel: string }>;
  chromeLabel: string;
  interactiveTag: string;
  matrix: {
    heading: string;
    subtitle: string;
    gravityAxis: string;
    probabilityAxis: string;
    gravityLabels: Record<number, string>;
    probabilityLabels: Record<number, string>;
    selectedCell: string;
    scoreFormula: string;
    riskBand: string;
    requiredAction: string;
    bands: Record<HeroRiskLevel, { label: string; action: string }>;
    cta: string;
  };
  incidents: {
    heading: string;
    subtitle: string;
    steps: { number: string; title: string; detail: string }[];
    cta: string;
  };
  audits: {
    heading: string;
    subtitle: string;
    clauses: { code: string; title: string; capability: string }[];
    formulaLabel: string;
    formulaValue: string;
    cta: string;
  };
  architecture: {
    heading: string;
    subtitle: string;
    pillars: { title: string; detail: string; spec: string }[];
    cta: string;
  };
}

const EXPLORER_COPY: Record<PublicLocale, ExplorerLocaleCopy> = {
  fr: {
    tabs: {
      matrix: { label: "Matrice 5×5", shortLabel: "Matrice 5×5" },
      incidents: { label: "Flux Incidents", shortLabel: "Incidents" },
      audits: { label: "Audits ISO 45001", shortLabel: "ISO 45001" },
      architecture: { label: "RBAC & Temps réel", shortLabel: "Architecture" },
    },
    chromeLabel: "Explorateur interactif PROSAFE",
    interactiveTag: "Interactif",
    matrix: {
      heading: "Calculateur de risque 5×5 en direct",
      subtitle:
        "Cliquez sur une cellule Gravité × Probabilité pour tester la règle de cotation intégrée dans PROSAFE.",
      gravityAxis: "Gravité (G)",
      probabilityAxis: "Probabilité (P)",
      gravityLabels: {
        1: "1 · Négligeable",
        2: "2 · Mineure",
        3: "3 · Modérée",
        4: "4 · Grave",
        5: "5 · Majeure",
      },
      probabilityLabels: {
        1: "1 · Rare",
        2: "2 · Peu probable",
        3: "3 · Possible",
        4: "4 · Probable",
        5: "5 · Fréquente",
      },
      selectedCell: "Cellule sélectionnée",
      scoreFormula: "Score calculé (G × P)",
      riskBand: "Niveau de risque",
      requiredAction: "Action requise dans le workflow",
      bands: {
        low: {
          label: "Faible (1 – 4)",
          action: "Surveillance standard lors des rondes de zone et maintien des EPI de base.",
        },
        medium: {
          label: "Modéré (5 – 9)",
          action: "Contrôle préventif planifié et vérification LMRA avant l'intervention.",
        },
        high: {
          label: "Élevé (10 – 15)",
          action: "Création d'une action corrective assignée avec échéance et vérification HSE.",
        },
        critical: {
          label: "Critique (16 – 25)",
          action: "Arrêt immédiat (Stop-Work), consignation LOTO et validation obligatoire du responsable.",
        },
      },
      cta: "Ouvrir la matrice complète dans la démo",
    },
    incidents: {
      heading: "Cycle de vie complet d'un incident SST",
      subtitle:
        "Chaque signalement suit quatre étapes tracées en base de données, de la capture terrain jusqu'à la clôture vérifiée.",
      steps: [
        {
          number: "01",
          title: "Déclaration terrain géolocalisée",
          detail: "Capture du type d'incident, zone, coordonnées carte Leaflet et niveau de gravité initial.",
        },
        {
          number: "02",
          title: "Triage & évaluation du risque",
          detail: "Qualification par l'équipe HSE avec liaison directe au registre des risques 5×5.",
        },
        {
          number: "03",
          title: "Action corrective assignée",
          detail: "Responsable nommé, date d'échéance et suivi d'avancement liés à l'incident.",
        },
        {
          number: "04",
          title: "Clôture & rapport exportable",
          detail: "Historique complet consultable dans les rapports PDF et exports CSV de conformité.",
        },
      ],
      cta: "Tester la gestion d'incidents en démo",
    },
    audits: {
      heading: "Contrôle ISO 45001 par chapitre & export PDF",
      subtitle:
        "Les grilles d'audit calculent automatiquement le taux de conformité à partir des critères applicables et génèrent des non-conformités exploitables.",
      clauses: [
        {
          code: "Clause 6.1",
          title: "Identification des dangers & risques",
          capability: "Matrice 5×5, plans d'action et analyses LMRA avant tâche.",
        },
        {
          code: "Clause 7.2",
          title: "Compétences & habilitations",
          capability: "Catalogue de formations, quiz et alertes d'expiration des certificats.",
        },
        {
          code: "Clause 8.2",
          title: "Préparation aux situations d'urgence",
          capability: "Scénarios d'évacuation, exercices chronométrés et diffusion d'alertes.",
        },
        {
          code: "Clause 9.1",
          title: "Audit interne & évaluation",
          capability: "Grilles personnalisables, score calculé et export de rapports PDF.",
        },
      ],
      formulaLabel: "Formule de conformité intégrée",
      formulaValue: "Score = Conforme / (Conforme + Non conforme) × 100",
      cta: "Inspecter les audits dans la démo",
    },
    architecture: {
      heading: "Séparation stricte des rôles & temps réel",
      subtitle:
        "Conçu comme une application web full-stack avec contrôle d'accès par rôle, mode sombre/clair et internationalisation complète.",
      pillars: [
        {
          title: "Espaces Admin & Employé isolés",
          detail: "Les comptes authentifiés accèdent directement à leur espace dédié avec routes protégées par rôle.",
          spec: "RBAC · /dashboard & /employee",
        },
        {
          title: "Alertes d'urgence temps réel",
          detail: "Diffusion instantanée des scénarios d'urgence sur les sessions actives via Socket.IO.",
          spec: "WebSockets · Socket.IO",
        },
        {
          title: "Multilingue natif & RTL",
          detail: "Changement instantané entre Français, Anglais et Arabe avec adaptation complète de la mise en page RTL.",
          spec: "i18n · FR / EN / AR",
        },
      ],
      cta: "Lancer l'espace de démonstration",
    },
  },
  en: {
    tabs: {
      matrix: { label: "5×5 Risk Matrix", shortLabel: "5×5 Matrix" },
      incidents: { label: "Incident Workflow", shortLabel: "Incidents" },
      audits: { label: "ISO 45001 Audits", shortLabel: "ISO 45001" },
      architecture: { label: "RBAC & Realtime", shortLabel: "Architecture" },
    },
    chromeLabel: "PROSAFE Interactive Platform Explorer",
    interactiveTag: "Interactive",
    matrix: {
      heading: "Live 5×5 Risk Score Calculator",
      subtitle:
        "Click any Gravity × Probability cell to test the exact risk scoring model built into PROSAFE.",
      gravityAxis: "Gravity (G)",
      probabilityAxis: "Probability (P)",
      gravityLabels: {
        1: "1 · Negligible",
        2: "2 · Minor",
        3: "3 · Moderate",
        4: "4 · Severe",
        5: "5 · Major",
      },
      probabilityLabels: {
        1: "1 · Rare",
        2: "2 · Unlikely",
        3: "3 · Possible",
        4: "4 · Likely",
        5: "5 · Frequent",
      },
      selectedCell: "Selected cell",
      scoreFormula: "Computed score (G × P)",
      riskBand: "Risk severity band",
      requiredAction: "Workflow response",
      bands: {
        low: {
          label: "Low (1 – 4)",
          action: "Monitor during routine zone walkthroughs and maintain baseline PPE controls.",
        },
        medium: {
          label: "Medium (5 – 9)",
          action: "Schedule preventive controls and require a pre-task LMRA check.",
        },
        high: {
          label: "High (10 – 15)",
          action: "Create an assigned corrective action with due date and HSE verification.",
        },
        critical: {
          label: "Critical (16 – 25)",
          action: "Immediate Stop-Work authority, LOTO isolation, and supervisor sign-off required.",
        },
      },
      cta: "Open full matrix in Live Demo",
    },
    incidents: {
      heading: "End-to-End Incident Lifecycle",
      subtitle:
        "Every report follows four auditable database stages from frontline capture through verified closure.",
      steps: [
        {
          number: "01",
          title: "Geolocated field capture",
          detail: "Log incident type, site zone, Leaflet map coordinates, and initial severity.",
        },
        {
          number: "02",
          title: "HSE triage & risk scoring",
          detail: "Review by safety managers with direct linkage to the 5×5 risk register.",
        },
        {
          number: "03",
          title: "Assigned corrective action",
          detail: "Accountable owner, due date, and progress tracking tied to the source incident.",
        },
        {
          number: "04",
          title: "Verified closure & exports",
          detail: "Complete audit history available in PDF compliance reports and CSV exports.",
        },
      ],
      cta: "Try Incident Management in Demo",
    },
    audits: {
      heading: "Clause-Mapped ISO 45001 Audits & PDF Reports",
      subtitle:
        "Audit checklists compute conformity automatically from applicable items and link non-conformities to corrective actions.",
      clauses: [
        {
          code: "Clause 6.1",
          title: "Hazard & risk assessment",
          capability: "5×5 matrix, prioritized action plans, and pre-job LMRA checks.",
        },
        {
          code: "Clause 7.2",
          title: "Competence & certifications",
          capability: "Mandatory training catalog, quizzes, and certificate expiry alerts.",
        },
        {
          code: "Clause 8.2",
          title: "Emergency preparedness",
          capability: "Evacuation scenarios, timed drills, and live site-wide alerts.",
        },
        {
          code: "Clause 9.1",
          title: "Internal audit & evaluation",
          capability: "Reusable checklists, live conformity math, and printable PDF reports.",
        },
      ],
      formulaLabel: "Built-in conformity formula",
      formulaValue: "Score = Conform / (Conform + Non-Conform) × 100",
      cta: "Inspect Audits in Live Demo",
    },
    architecture: {
      heading: "Strict Role Isolation & Real-Time Architecture",
      subtitle:
        "Engineered as a full-stack web platform with role-based workspaces, Light/Dark themes, and native trilingual support.",
      pillars: [
        {
          title: "Isolated Admin & Employee Workspaces",
          detail: "Authenticated users route directly into role-scoped views with strict route guards.",
          spec: "RBAC · /dashboard & /employee",
        },
        {
          title: "Real-Time Emergency Broadcasts",
          detail: "Instant propagation of active emergency alerts across connected sessions via Socket.IO.",
          spec: "WebSockets · Socket.IO",
        },
        {
          title: "Native Multilingual & RTL",
          detail: "Instant switching between French, English, and Arabic with full right-to-left layout support.",
          spec: "i18n · FR / EN / AR",
        },
      ],
      cta: "Launch Interactive Workspace",
    },
  },
  ar: {
    tabs: {
      matrix: { label: "مصفوفة 5×5", shortLabel: "مصفوفة 5×5" },
      incidents: { label: "مسار الحوادث", shortLabel: "الحوادث" },
      audits: { label: "تدقيق ISO 45001", shortLabel: "ISO 45001" },
      architecture: { label: "الصلاحيات والوقت الفعلي", shortLabel: "البنية" },
    },
    chromeLabel: "مستكشف منصة PROSAFE التفاعلي",
    interactiveTag: "تفاعلي",
    matrix: {
      heading: "حاسبة مصفوفة المخاطر 5×5 المباشرة",
      subtitle:
        "انقر على أي خلية (الخطورة × الاحتمالية) لتجربة معادلة تقييم المخاطر الفعلية داخل PROSAFE.",
      gravityAxis: "الخطورة (G)",
      probabilityAxis: "الاحتمالية (P)",
      gravityLabels: {
        1: "1 · طفيفة",
        2: "2 · بسيطة",
        3: "3 · متوسطة",
        4: "4 · جسيمة",
        5: "5 · كارثية",
      },
      probabilityLabels: {
        1: "1 · نادرة",
        2: "2 · غير مرجحة",
        3: "3 · ممكنة",
        4: "4 · مرجحة",
        5: "5 · متكررة",
      },
      selectedCell: "الخلية المختارة",
      scoreFormula: "الدرجة المحسوبة (G × P)",
      riskBand: "مستوى الخطر",
      requiredAction: "الإجراء المطلوب في النظام",
      bands: {
        low: {
          label: "منخفض (1 – 4)",
          action: "متابعة روتينية خلال الجولات الميدانية مع الالتزام بمعدات الوقاية الأساسية.",
        },
        medium: {
          label: "متوسط (5 – 9)",
          action: "جدولة ضوابط وقائية وإلزامية فحص LMRA قبل بدء المهمة.",
        },
        high: {
          label: "مرتفع (10 – 15)",
          action: "إنشاء إجراء تصحيحي لمسؤول محدد بتاريخ استحقاق وتحقق من فريق السلامة.",
        },
        critical: {
          label: "حرج (16 – 25)",
          action: "إيقاف فوري للعمل (Stop-Work) وتطبيق العزل LOTO وموافقة المشرف قبل الاستئناف.",
        },
      },
      cta: "افتح المصفوفة الكاملة في العرض المباشر",
    },
    incidents: {
      heading: "دورة حياة الحادث المهني خطوة بخطوة",
      subtitle:
        "يمر كل بلاغ بأربع مراحل موثقة في قاعدة البيانات من التسجيل الميداني حتى الإغلاق المتحقق منه.",
      steps: [
        {
          number: "01",
          title: "تسجيل ميداني محدد جغرافياً",
          detail: "توثيق نوع الحادث والمنطقة وإحداثيات خريطة Leaflet والخطورة الأولية.",
        },
        {
          number: "02",
          title: "فرز وتقييم الخطر",
          detail: "مراجعة منسقي السلامة وربط البلاغ مباشرة بسجل المخاطر 5×5.",
        },
        {
          number: "03",
          title: "إجراء تصحيحي مسند",
          detail: "تعيين مسؤول وتاريخ استحقاق ومتابعة التنفيذ المرتبط بالحادث.",
        },
        {
          number: "04",
          title: "إغلاق وتقارير قابلة للتصدير",
          detail: "سجل كامل متاح في تقارير PDF وملفات CSV الخاصة بالامتثال.",
        },
      ],
      cta: "جرّب إدارة الحوادث في العرض المباشر",
    },
    audits: {
      heading: "تدقيق ISO 45001 حسب البنود وتقارير PDF",
      subtitle:
        "تحسب قوائم التدقيق نسبة المطابقة تلقائياً من البنود المطبقة وتربط عدم المطابقة بالإجراءات التصحيحية.",
      clauses: [
        {
          code: "البند 6.1",
          title: "تحديد الأخطار وتقييم المخاطر",
          capability: "مصفوفة 5×5 وخطط العمل وتقييمات LMRA قبل التنفيذ.",
        },
        {
          code: "البند 7.2",
          title: "الكفاءة والشهادات الإلزامية",
          capability: "برامج التكوين والاختبارات وتنبيهات انتهاء الصلاحية.",
        },
        {
          code: "البند 8.2",
          title: "الجاهزية والاستجابة للطوارئ",
          capability: "سيناريوهات الإخلاء والتمارين الموقّتة والتنبيهات الفورية.",
        },
        {
          code: "البند 9.1",
          title: "التدقيق الداخلي وتقييم الأداء",
          capability: "قوائم فحص مرنة وحساب آلي للمطابقة وتصدير تقارير PDF.",
        },
      ],
      formulaLabel: "معادلة المطابقة المدمجة",
      formulaValue: "النسبة = مطابق / (مطابق + غير مطابق) × 100",
      cta: "استعرض التدقيق في العرض المباشر",
    },
    architecture: {
      heading: "عزل صارم للصلاحيات وتحديث فوري",
      subtitle:
        "مبنية كمنصة ويب متكاملة بعزل مساحات العمل حسب الدور ودعم الوضع الداكن والفاتح وثلاث لغات.",
      pillars: [
        {
          title: "مساحات عمل معزولة للمسؤول والموظف",
          detail: "يُوجَّه كل مستخدم مسجل مباشرة إلى مساحته الخاصة مع حماية صارمة للمسارات.",
          spec: "RBAC · /dashboard & /employee",
        },
        {
          title: "بث فوري لتنبيهات الطوارئ",
          detail: "نشر فوري لتنبيهات الطوارئ عبر جميع الجلسات المفتوحة باستخدام Socket.IO.",
          spec: "WebSockets · Socket.IO",
        },
        {
          title: "دعم أصلي لثلاث لغات واتجاه RTL",
          detail: "تبديل فوري بين العربية والفرنسية والإنجليزية مع توافق كامل للاتجاه من اليمين لليسار.",
          spec: "i18n · AR / FR / EN",
        },
      ],
      cta: "افتح مساحة العرض التفاعلي",
    },
  },
};

function getMatrixCellClasses(level: HeroRiskLevel, selected: boolean): string {
  const baseByLevel: Record<HeroRiskLevel, string> = {
    low: "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25",
    medium:
      "bg-amber-400/20 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200 border-amber-500/35 hover:bg-amber-400/30",
    high: "bg-orange-500/20 text-orange-900 dark:bg-orange-500/25 dark:text-orange-200 border-orange-500/40 hover:bg-orange-500/30",
    critical:
      "bg-rose-500/20 text-rose-900 dark:bg-rose-500/25 dark:text-rose-200 border-rose-500/40 hover:bg-rose-500/30",
  };
  const ring = selected
    ? "ring-2 ring-prosafe-600 dark:ring-prosafe-400 ring-offset-1 ring-offset-white dark:ring-offset-slate-950 font-bold scale-[1.03]"
    : "font-semibold";
  return `${baseByLevel[level]} ${ring}`;
}

function getBandAccentClasses(level: HeroRiskLevel): string {
  switch (level) {
    case "critical":
      return "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30";
    case "high":
      return "text-orange-700 dark:text-orange-300 bg-orange-500/10 border-orange-500/30";
    case "medium":
      return "text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/30";
    default:
      return "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
  }
}

const Hero = () => {
  const { t, i18n } = useTranslation();
  const { loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [launchingDemo, setLaunchingDemo] = useState(false);
  const [activeTab, setActiveTab] = useState<ExplorerTabId>("matrix");
  const [selectedGravity, setSelectedGravity] = useState<number>(4);
  const [selectedProbability, setSelectedProbability] = useState<number>(3);

  const locale = resolvePublicLocale(i18n.resolvedLanguage || i18n.language);
  const explorer = EXPLORER_COPY[locale];
  const evaluation = evaluateRiskCell(selectedGravity, selectedProbability);

  const handleLaunchDemo = async () => {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }
    setLaunchingDemo(true);
    try {
      await loginDemo();
      navigate("/dashboard");
    } catch {
      navigate("/login");
    } finally {
      setLaunchingDemo(false);
    }
  };

  const tabItems: { id: ExplorerTabId; icon: typeof Grid2x2 }[] = [
    { id: "matrix", icon: Grid2x2 },
    { id: "incidents", icon: MapPin },
    { id: "audits", icon: ClipboardCheck },
    { id: "architecture", icon: Lock },
  ];

  return (
    <section className="py-14 md:py-20 px-4">
      <div className="container max-w-6xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-prosafe-600 dark:text-prosafe-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>{t("hero.introducing")}</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 gradient-text">
          {t("hero.title")}
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-9 max-w-3xl mx-auto">
          {t("hero.description")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            size="lg"
            className="bg-prosafe-600 hover:bg-prosafe-700 text-white h-12 px-8"
            onClick={handleLaunchDemo}
            disabled={launchingDemo}
            data-testid="hero-live-demo-btn"
          >
            {launchingDemo ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            {t("hero.tryLiveDemo")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-8" asChild>
            <Link to="/contact">{t("hero.requestDemo")}</Link>
          </Button>
        </div>

        {/* Interactive PROSAFE Platform Explorer (No fabricated metrics or fake alerts) */}
        <div
          className="relative text-start"
          data-testid="hero-interactive-explorer"
        >
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 prosafe-shadow bg-white dark:bg-slate-950">
            {/* Explorer Header & Module Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-prosafe-600 text-white shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {explorer.chromeLabel}
                </span>
                <span className="hidden sm:inline text-xs font-medium text-prosafe-600 dark:text-prosafe-400">
                  · {explorer.interactiveTag}
                </span>
              </div>

              <div
                role="tablist"
                aria-label={explorer.chromeLabel}
                className="flex items-center gap-1 overflow-x-auto pb-0.5 md:pb-0"
              >
                {tabItems.map(({ id, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      data-testid={`hero-tab-${id}`}
                      onClick={() => setActiveTab(id)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                        isActive
                          ? "bg-prosafe-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{explorer.tabs[id].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explorer Body */}
            <div className="p-5 sm:p-6">
              {activeTab === "matrix" && (
                <div
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                  data-testid="hero-panel-matrix"
                >
                  {/* Left: Interactive 5x5 Matrix */}
                  <div className="lg:col-span-7">
                    <div className="mb-4">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        {explorer.matrix.heading}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {explorer.matrix.subtitle}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-3 sm:p-4">
                      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2.5">
                        <span>{explorer.matrix.gravityAxis}</span>
                        <span>{explorer.matrix.probabilityAxis} →</span>
                      </div>

                      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                        {GRAVITY_LEVELS.map((g) => (
                          <div key={g} className="contents">
                            <div className="flex items-center justify-center text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
                              G{g}
                            </div>
                            {PROBABILITY_LEVELS.map((p) => {
                              const cell = evaluateRiskCell(g, p);
                              const isSelected =
                                g === selectedGravity && p === selectedProbability;
                              return (
                                <button
                                  key={`${g}-${p}`}
                                  type="button"
                                  data-testid={`hero-matrix-cell-${g}-${p}`}
                                  aria-label={`G${g} x P${p} = ${cell.score}`}
                                  aria-pressed={isSelected}
                                  onClick={() => {
                                    setSelectedGravity(g);
                                    setSelectedProbability(p);
                                  }}
                                  className={`h-10 sm:h-11 rounded-md border text-xs sm:text-sm tabular-nums transition-all cursor-pointer ${getMatrixCellClasses(
                                    cell.level,
                                    isSelected
                                  )}`}
                                >
                                  {cell.score}
                                </button>
                              );
                            })}
                          </div>
                        ))}

                        {/* Bottom axis labels */}
                        <div />
                        {PROBABILITY_LEVELS.map((p) => (
                          <div
                            key={`p-${p}`}
                            className="text-center text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 pt-1"
                          >
                            P{p}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Evaluation Inspector */}
                  <div className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 flex flex-col justify-between gap-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {explorer.matrix.scoreFormula}
                          </p>
                          <p
                            className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5"
                            data-testid="hero-matrix-score"
                          >
                            {evaluation.gravity} × {evaluation.probability} = {evaluation.score}
                          </p>
                        </div>
                        <span
                          data-testid="hero-matrix-level"
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${getBandAccentClasses(
                            evaluation.level
                          )}`}
                        >
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          {explorer.matrix.bands[evaluation.level].label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5">
                          <span className="block text-slate-500 dark:text-slate-400">
                            {explorer.matrix.gravityAxis}
                          </span>
                          <span className="mt-0.5 block font-semibold text-slate-900 dark:text-slate-100">
                            {explorer.matrix.gravityLabels[evaluation.gravity]}
                          </span>
                        </div>
                        <div className="rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5">
                          <span className="block text-slate-500 dark:text-slate-400">
                            {explorer.matrix.probabilityAxis}
                          </span>
                          <span className="mt-0.5 block font-semibold text-slate-900 dark:text-slate-100">
                            {explorer.matrix.probabilityLabels[evaluation.probability]}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                          {explorer.matrix.requiredAction}
                        </p>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                          {explorer.matrix.bands[evaluation.level].action}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={handleLaunchDemo}
                      disabled={launchingDemo}
                    >
                      <span>{explorer.matrix.cta}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "incidents" && (
                <div className="space-y-5" data-testid="hero-panel-incidents">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        {explorer.incidents.heading}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {explorer.incidents.subtitle}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLaunchDemo}
                      disabled={launchingDemo}
                      className="shrink-0"
                    >
                      {explorer.incidents.cta}
                      <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {explorer.incidents.steps.map((step) => (
                      <div
                        key={step.number}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 flex flex-col gap-2"
                      >
                        <span className="font-mono text-xs font-semibold text-prosafe-600 dark:text-prosafe-400 tabular-nums">
                          {step.number}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "audits" && (
                <div className="space-y-5" data-testid="hero-panel-audits">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        {explorer.audits.heading}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {explorer.audits.subtitle}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLaunchDemo}
                      disabled={launchingDemo}
                      className="shrink-0"
                    >
                      {explorer.audits.cta}
                      <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {explorer.audits.clauses.map((clause) => (
                      <div
                        key={clause.code}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 flex items-start gap-3"
                      >
                        <CheckCircle2 className="h-4 w-4 text-prosafe-600 dark:text-prosafe-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-prosafe-600 dark:text-prosafe-400">
                              {clause.code}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {clause.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {clause.capability}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                      <FileText className="h-3.5 w-3.5 text-prosafe-600 dark:text-prosafe-400" />
                      {explorer.audits.formulaLabel}
                    </span>
                    <code className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {explorer.audits.formulaValue}
                    </code>
                  </div>
                </div>
              )}

              {activeTab === "architecture" && (
                <div className="space-y-5" data-testid="hero-panel-architecture">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        {explorer.architecture.heading}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {explorer.architecture.subtitle}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLaunchDemo}
                      disabled={launchingDemo}
                      className="shrink-0"
                    >
                      {explorer.architecture.cta}
                      <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {explorer.architecture.pillars.map((pillar, idx) => {
                      const Icon = idx === 0 ? Users : idx === 1 ? BellRing : ShieldCheck;
                      return (
                        <div
                          key={pillar.title}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 flex flex-col justify-between gap-3"
                        >
                          <div className="space-y-2">
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-prosafe-100 dark:bg-prosafe-500/20 text-prosafe-600 dark:text-prosafe-400">
                              <Icon className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                              {pillar.title}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {pillar.detail}
                            </p>
                          </div>
                          <p className="font-mono text-[11px] font-semibold text-prosafe-600 dark:text-prosafe-400 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                            {pillar.spec}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
