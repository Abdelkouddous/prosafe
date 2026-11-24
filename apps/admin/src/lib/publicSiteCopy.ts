import { useTranslation } from "react-i18next";
import type { ContactFormInput } from "./publicSiteData";

export type PublicLocale = "fr" | "en" | "ar";

export function resolvePublicLocale(language?: string): PublicLocale {
  const code = (language || "fr").toLowerCase().split("-")[0];
  if (code === "en") return "en";
  if (code === "ar") return "ar";
  return "fr";
}

export function usePublicLocale(): PublicLocale {
  const { i18n } = useTranslation();
  return resolvePublicLocale(i18n.resolvedLanguage || i18n.language);
}

export const PUBLIC_COPY = {
  en: {
    contact: {
      kicker: "Contact PROSAFE",
      title: "Talk with our workplace safety and implementation team",
      subtitle:
        "Request a guided walkthrough of PROSAFE for your plant, warehouse, or multi-site HSE operations. Every inquiry is answered within one business day.",
      formTitle: "Send us a message",
      formSubtitle: "Tell us about your sites, team size, and safety compliance goals.",
      fullName: "Full name *",
      fullNamePlaceholder: "Aymen Hamel",
      email: "Work email *",
      emailPlaceholder: "name@company.com",
      company: "Company / Facility",
      companyPlaceholder: "Industrial Manufacturing Group",
      phone: "Phone (optional)",
      phonePlaceholder: "+213 555 00 00 00",
      topic: "How can we help?",
      message: "Project details *",
      messagePlaceholder:
        "Share your number of sites, key safety priorities (ISO 45001, incident tracking, PPE, trainings), or preferred walkthrough date.",
      privacyPrefix: "Protected under our",
      privacyLink: "Privacy Policy",
      privacySuffix: ". No marketing spam.",
      submit: "Submit Inquiry",
      genericError: "Unable to send your message right now. Please try again.",
      receiptTitle: "Inquiry received",
      receiptBodyPrefix: "Thank you for contacting PROSAFE. We logged your request under reference",
      receiptBodyMid: "and will reply to",
      receiptBodySuffix: "within one business day.",
      receiptTopic: "Topic:",
      receiptSubmitted: "Submitted:",
      exploreDemo: "Explore Live Demo Now",
      sendAnother: "Send another message",
      directTitle: "Direct contact",
      salesLabel: "Sales & HSE Advisory",
      hoursLabel: "Support hours",
      hoursLine1: "Monday – Friday · 08:30 – 17:30 CET / WAT",
      hoursLine2: "Typical first response under 4 business hours",
      coverageLabel: "Regional coverage",
      coverageBody:
        "Algiers Operations Hub · Serving industrial sites across North Africa and Europe (EN / FR / AR)",
      demoCardTitle: "Want to test the dashboard right away?",
      demoCardBody:
        "Launch our pre-seeded interactive workspace with realistic incidents, 5x5 risk matrix, ISO 45001 audits, PPE inventory, and emergency drill logs.",
      tryDemo: "Try Live Demo",
      viewPricing: "View Pricing",
      topics: [
        { value: "demo", label: "Schedule a Live Site Walkthrough" },
        { value: "enterprise", label: "Enterprise & Multi-Site Pricing" },
        { value: "iso45001", label: "ISO 45001 Audit & Onboarding Advisory" },
        { value: "support", label: "Technical Support & Integrations" },
        { value: "partnership", label: "Partnership Inquiry" },
      ],
      validation: {
        fullName: "Please enter your full name.",
        email: "Please enter a valid work email address.",
        message: "Please provide at least 15 characters describing your request.",
      },
    },
    pricing: {
      kicker: "Pricing",
      title: "Predictable per-site plans for safety teams of every size",
      subtitle:
        "Start with a single plant or roll out ISO 45001 compliance across multiple industrial zones. Save 20% with annual billing.",
      banner:
        "All plans include SSL encryption, daily PostgreSQL backups, and EN / FR / AR support.",
      monthly: "Monthly",
      annual: "Annual · Save 20%",
      popular: "Most popular",
      perMonth: "/ month",
      billedMonthly: "Billed monthly · cancel anytime",
      billedAnnually: (total: number, savings: number) =>
        `$${total} billed annually (save $${savings}/yr)`,
      custom: "Custom",
      customSub: "Tailored per facility count and SLA requirements",
      faqTitle: "Frequently asked questions",
      tiers: {
        starter: {
          name: "Starter",
          tagline: "For single-site teams digitizing incident reporting and PPE logs.",
          siteLimit: "1 industrial site",
          userLimit: "Up to 50 employees · 3 HSE managers",
          ctaLabel: "Launch Live Demo",
          features: [
            "Incident & near-miss reporting with photo evidence",
            "5x5 Risk Matrix & Last Minute Risk Assessment (LMRA)",
            "PPE inventory & calibration expiry alerts",
            "Multilingual interface (EN / FR / AR with RTL)",
            "Standard CSV exports & email notifications",
          ],
        },
        operations: {
          name: "Operations",
          tagline: "Full ISO 45001 safety operations for growing multi-zone facilities.",
          siteLimit: "Up to 5 sites",
          userLimit: "Up to 300 employees · Unlimited HSE managers",
          ctaLabel: "Request Operations Trial",
          features: [
            "Everything in Starter",
            "ISO 45001 & NFPA audit checklists with corrective actions",
            "Emergency evacuation drills & WebSocket live alerts",
            "Safety training catalog, quizzes & expiry reminders",
            "Compliance document vault & preventive maintenance calendar",
            "Google Workspace OAuth & role-based access control",
          ],
        },
        enterprise: {
          name: "Enterprise",
          tagline: "Dedicated compliance governance for industrial groups and refineries.",
          siteLimit: "Unlimited sites & divisions",
          userLimit: "Unlimited employees · Custom RBAC roles",
          ctaLabel: "Contact Sales",
          features: [
            "Everything in Operations",
            "Dedicated PostgreSQL schema & custom data retention",
            "ERP / HRIS REST API & webhook integrations",
            "Custom ISO 45001 / MASE / OSHA audit templates",
            "On-site implementation workshops & 99.9% SLA",
          ],
        },
      },
      faqs: [
        {
          q: "Can we test PROSAFE with realistic safety data before subscribing?",
          a: "Yes. Click Try Live Demo on the home or login page to explore an immediately usable workspace pre-populated with incidents, 5x5 risks, ISO 45001 audits, PPE stock, and emergency drills.",
        },
        {
          q: "How are employees and HSE managers counted?",
          a: "Starter includes up to 50 active employees and 3 HSE managers on one site. Operations covers up to 300 employees across 5 sites with unlimited HSE managers and auditors.",
        },
        {
          q: "Does PROSAFE support Arabic (RTL) and French out of the box?",
          a: "Yes. Every plan includes English, French, and right-to-left Arabic interface switching with zero extra localization fees.",
        },
        {
          q: "Can we export our compliance records if we change plans?",
          a: "All customer data belongs exclusively to your organization. You can export incidents, audit scores, training compliance matrices, and equipment histories to CSV at any time.",
        },
      ],
    },
    features: {
      kicker: "Platform Capabilities",
      title: "Six integrated safety modules built for industrial operations",
      subtitle:
        "Replace disconnected spreadsheets and paper binders with one operational workspace covering incident reporting, risk matrices, ISO 45001 audits, PPE maintenance, trainings, and emergency drills.",
      launchDemo: "Launch Live Demo",
      comparePlans: "Compare Plans",
      sectionTitle: "Core OHS / SST modules",
      sectionSubtitle:
        "Filter by operational area or jump straight into any module in the live demo.",
      inspectModule: "Inspect module in live demo",
      filters: [
        { id: "all" as const, label: "All Modules" },
        { id: "field" as const, label: "Field & Incidents" },
        { id: "risk" as const, label: "Risk & Audits" },
        { id: "workforce" as const, label: "Workforce & Assets" },
      ],
      archTitle: "Built for multi-site reality",
      archSubtitle:
        "Every module shares one PostgreSQL data model, role-based access control, and live notification channel.",
      archStats: [
        {
          metric: "3 Languages",
          label: "English, French & Arabic (RTL)",
          detail: "Instant locale switching for headquarters and field teams.",
        },
        {
          metric: "< 1 sec",
          label: "WebSocket emergency alerts",
          detail: "Broadcast active site emergencies to every open manager console.",
        },
        {
          metric: "27 Tables",
          label: "Relational audit trail",
          detail: "Incidents, risks, audits, and corrective actions linked end-to-end.",
        },
        {
          metric: "ISO 45001",
          label: "Clause-mapped compliance",
          detail: "Exportable evidence ready for external certification surveillance.",
        },
      ],
    },
    services: {
      kicker: "Implementation & Advisory",
      title: "Hands-on services that get industrial sites compliant faster",
      subtitle:
        "Software alone does not change field habits. Our engineers and certified HSE specialists partner with your team from initial data migration through external audit readiness.",
      primaryCta: "Schedule Implementation Call",
      secondaryCta: "Explore Platform Modules",
      deliveryPrefix: "Typical delivery:",
      requestScope: "Request scope and timeline",
      impactStats: [
        {
          metric: "-42%",
          label: "Faster corrective action closure",
          detail:
            "Measured over 6 months across multi-workshop manufacturing sites replacing email follow-ups with assigned PROSAFE owners.",
        },
        {
          metric: "3 hrs",
          label: "ISO 45001 audit prep time",
          detail:
            "Down from 5 full days of manual spreadsheet compilation before external surveillance inspections.",
        },
        {
          metric: "100%",
          label: "Gas detector & PPE traceability",
          detail:
            "Automated overdue calibration alerts prevent unverified detection gear from entering confined or energized work zones.",
        },
      ],
    },
    about: {
      kicker: "About PROSAFE",
      title: "Modernizing occupational health and safety for industrial teams",
      subtitle:
        "PROSAFE was created to close the gap between field safety observations and executive compliance decisions — replacing fragmented spreadsheets with one unified OHS / SST command center.",
      primaryCta: "Talk to Our Team",
      secondaryCta: "View Open Roles",
      storyTitle: "Why we built PROSAFE",
      principlesTitle: "How we design safety software",
      principlesSubtitle:
        "Three engineering and operational principles that guide every module we ship.",
      stats: [
        { value: "6", label: "Core safety modules in one unified platform" },
        { value: "ISO 45001", label: "Audit clauses & document vault alignment" },
        { value: "EN · FR · AR", label: "Full multilingual & RTL support" },
        { value: "24/7", label: "Realtime WebSocket emergency alerting" },
      ],
    },
    updates: {
      kicker: "Product Updates",
      title: "Changelog and platform releases",
      subtitle:
        "A chronological record of new safety modules, ISO 45001 compliance enhancements, and infrastructure improvements shipped to PROSAFE.",
      cta: "Request a Release Walkthrough",
      categories: [
        { value: "All", label: "All" },
        { value: "Platform", label: "Platform" },
        { value: "Safety Core", label: "Safety Core" },
        { value: "Compliance", label: "Compliance" },
      ],
    },
    blog: {
      kicker: "Field Notes & Guides",
      title: "Practical writing on industrial safety, audits, and risk prevention",
      subtitle:
        "Playbooks from HSE coordinators, maintenance engineers, and safety auditors running modern ISO 45001 programs.",
      searchPlaceholder: "Search articles...",
      readArticle: "Read article",
      emptyTitle: "No articles match your current filter.",
      emptySubtitle: "Try clearing your search query or viewing all topics.",
      resetFilters: "Reset filters",
      byPrefix: "By",
      categories: [
        { value: "All", label: "All" },
        { value: "ISO 45001", label: "ISO 45001" },
        { value: "Risk Prevention", label: "Risk Prevention" },
        { value: "Emergency Readiness", label: "Emergency Readiness" },
        { value: "Field Operations", label: "Field Operations" },
      ],
    },
    careers: {
      kicker: "Careers",
      title: "Build software that sends industrial teams home safely",
      subtitle:
        "We are a focused engineering and HSE advisory team working across Algiers and Europe. Join us to modernize workplace safety across manufacturing and logistics.",
      openPositions: "Open positions",
      filterHint: "Filter by team and apply directly — no multi-hour portal forms.",
      applyCta: "Apply for role",
      applyDialogPrefix: "Apply",
      submittedPrefix: "Your application was logged under reference",
      submittedSuffix:
        ". Our hiring team reviews every candidate directly and replies within 3 business days.",
      close: "Close",
      fullName: "Full name *",
      fullNamePlaceholder: "Your full name",
      email: "Email *",
      linkLabel: "LinkedIn, GitHub, or CV link (optional)",
      noteLabel: "Why PROSAFE? *",
      notePlaceholder:
        "Share relevant experience in software engineering, design, or industrial HSE.",
      cancel: "Cancel",
      submit: "Submit Application",
      genericError: "Unable to submit application right now. Please try again.",
      departments: [
        { value: "All", label: "All" },
        { value: "Engineering", label: "Engineering" },
        { value: "HSE Advisory", label: "HSE Advisory" },
        { value: "Product & Design", label: "Product & Design" },
        { value: "Customer Success", label: "Customer Success" },
      ],
    },
    privacy: {
      kicker: "Legal · Effective November 2026",
      title: "Privacy Policy",
      subtitle:
        "How PROSAFE protects employee, manager, and organizational safety data across our web platform and cloud infrastructure.",
      onThisPage: "On this page",
      footerPrefix: "Questions about this policy?",
      footerContact: "Contact our privacy team",
      footerMid: "or review our",
      footerSecurity: "Security overview",
    },
    terms: {
      kicker: "Legal · Effective November 2026",
      title: "Terms of Service",
      subtitle:
        "Clear commercial and operational terms governing access to the PROSAFE workplace safety platform.",
      onThisPage: "On this page",
      footerPrefix: "Need an enterprise master service agreement (MSA) or DPA?",
      footerContact: "Contact our team",
    },
    security: {
      kicker: "Security & Trust",
      title: "Security controls engineered for regulated industrial environments",
      subtitle:
        "PROSAFE protects incident reports, employee certifications, and compliance archives with defense-in-depth application security and strict server-side access enforcement.",
      primaryCta: "Report a Security Concern",
      secondaryCta: "Read Privacy Policy",
      disclosureTitle: "Responsible vulnerability disclosure",
      disclosurePrefix:
        "If you discover a security vulnerability in PROSAFE, please report it responsibly via",
      disclosureMid: "or our",
      disclosureLink: "Contact page",
      disclosureSuffix:
        ". We acknowledge security reports within 24 hours and coordinate remediation promptly.",
    },
  },
  fr: {
    contact: {
      kicker: "Contacter PROSAFE",
      title: "Échangez avec notre équipe sécurité industrielle et déploiement",
      subtitle:
        "Demandez une démonstration guidée de PROSAFE pour votre usine, entrepôt ou vos opérations HSE multi-sites. Réponse garantie sous un jour ouvré.",
      formTitle: "Envoyez-nous un message",
      formSubtitle:
        "Présentez-nous vos sites, la taille de vos équipes et vos objectifs de conformité SST.",
      fullName: "Nom complet *",
      fullNamePlaceholder: "Aymen Hamel",
      email: "E-mail professionnel *",
      emailPlaceholder: "nom@entreprise.com",
      company: "Entreprise / Site industriel",
      companyPlaceholder: "Groupe Industriel & Production",
      phone: "Téléphone (optionnel)",
      phonePlaceholder: "+213 555 00 00 00",
      topic: "Comment pouvons-nous vous aider ?",
      message: "Détails de votre projet *",
      messagePlaceholder:
        "Indiquez votre nombre de sites, vos priorités sécurité (ISO 45001, incidents, EPI, formations) ou vos disponibilités.",
      privacyPrefix: "Protégé selon notre",
      privacyLink: "Politique de confidentialité",
      privacySuffix: ". Aucun démarchage abusif.",
      submit: "Envoyer la demande",
      genericError: "Impossible d'envoyer votre message pour le moment. Veuillez réessayer.",
      receiptTitle: "Demande enregistrée",
      receiptBodyPrefix:
        "Merci d'avoir contacté PROSAFE. Votre demande a été enregistrée sous la référence",
      receiptBodyMid: "et notre équipe vous répondra à",
      receiptBodySuffix: "sous un jour ouvré.",
      receiptTopic: "Objet :",
      receiptSubmitted: "Reçue le :",
      exploreDemo: "Explorer la démo interactive",
      sendAnother: "Envoyer un autre message",
      directTitle: "Contact direct",
      salesLabel: "Commercial & Conseil HSE",
      hoursLabel: "Horaires de support",
      hoursLine1: "Lundi – Vendredi · 08h30 – 17h30 CET / WAT",
      hoursLine2: "Première réponse habituelle en moins de 4 heures ouvrées",
      coverageLabel: "Couverture régionale",
      coverageBody:
        "Hub Opérationnel d'Alger · Accompagnement des sites industriels en Afrique du Nord et en Europe (FR / EN / AR)",
      demoCardTitle: "Envie de tester la plateforme immédiatement ?",
      demoCardBody:
        "Ouvrez notre espace de démonstration pré-rempli avec des incidents réalistes, une matrice de risques 5×5, des audits ISO 45001, les EPI et des exercices d'évacuation.",
      tryDemo: "Tester la démo",
      viewPricing: "Voir les tarifs",
      topics: [
        { value: "demo", label: "Planifier une démonstration guidée" },
        { value: "enterprise", label: "Tarification Entreprise & Multi-sites" },
        { value: "iso45001", label: "Accompagnement Audit ISO 45001" },
        { value: "support", label: "Support technique & Intégrations" },
        { value: "partnership", label: "Demande de partenariat" },
      ],
      validation: {
        fullName: "Veuillez renseigner votre nom complet.",
        email: "Veuillez saisir une adresse e-mail professionnelle valide.",
        message: "Veuillez décrire votre besoin en au moins 15 caractères.",
      },
    },
    pricing: {
      kicker: "Tarification",
      title: "Des forfaits clairs par site pour toutes les équipes HSE",
      subtitle:
        "Démarrez sur un site pilote ou déployez la conformité ISO 45001 sur plusieurs zones industrielles. Économisez 20 % avec la facturation annuelle.",
      banner:
        "Tous les forfaits incluent le chiffrement SSL, des sauvegardes PostgreSQL quotidiennes et l'interface FR / EN / AR.",
      monthly: "Mensuel",
      annual: "Annuel · -20 %",
      popular: "Le plus choisi",
      perMonth: "/ mois",
      billedMonthly: "Facturation mensuelle · résiliable à tout moment",
      billedAnnually: (total: number, savings: number) =>
        `${total} $ facturés par an (économie de ${savings} $/an)`,
      custom: "Sur devis",
      customSub: "Adapté au nombre de sites et à vos exigences SLA",
      faqTitle: "Questions fréquentes",
      tiers: {
        starter: {
          name: "Starter",
          tagline: "Pour les sites souhaitant digitaliser la déclaration d'incidents et les EPI.",
          siteLimit: "1 site industriel",
          userLimit: "Jusqu'à 50 employés · 3 responsables HSE",
          ctaLabel: "Lancer la démo",
          features: [
            "Déclaration d'incidents et presqu'accidents avec preuves photo",
            "Matrice de risques 5×5 et analyse LMRA avant intervention",
            "Stock EPI et alertes d'expiration d'étalonnage",
            "Interface multilingue (FR / EN / AR avec RTL)",
            "Exports CSV standards et notifications e-mail",
          ],
        },
        operations: {
          name: "Operations",
          tagline: "Pilotage complet ISO 45001 pour les sites multi-zones en croissance.",
          siteLimit: "Jusqu'à 5 sites",
          userLimit: "Jusqu'à 300 employés · Responsables HSE illimités",
          ctaLabel: "Demander un essai Operations",
          features: [
            "Tout le forfait Starter inclus",
            "Grilles d'audit ISO 45001 & NFPA avec actions correctives",
            "Exercices d'évacuation et alertes d'urgence WebSocket",
            "Catalogue de formations sécurité, quiz et relances",
            "Coffre-fort documentaire et calendrier de maintenance préventive",
            "Authentification Google Workspace et contrôle d'accès par rôle",
          ],
        },
        enterprise: {
          name: "Enterprise",
          tagline: "Gouvernance sécurité dédiée aux groupes industriels et sites critiques.",
          siteLimit: "Sites et divisions illimités",
          userLimit: "Employés illimités · Rôles RBAC personnalisés",
          ctaLabel: "Contacter l'équipe",
          features: [
            "Tout le forfait Operations inclus",
            "Schéma PostgreSQL dédié et rétention personnalisée",
            "Intégrations API REST et webhooks ERP / SIRH",
            "Modèles d'audits ISO 45001 / MASE / OSHA sur mesure",
            "Ateliers de déploiement sur site et SLA 99,9 %",
          ],
        },
      },
      faqs: [
        {
          q: "Pouvons-nous tester PROSAFE avec des données réalistes avant de souscrire ?",
          a: "Oui. Cliquez sur Tester la démo depuis l'accueil ou la page de connexion pour accéder immédiatement à un environnement complet pré-rempli d'incidents, risques 5×5, audits ISO 45001, EPI et exercices d'urgence.",
        },
        {
          q: "Comment sont comptabilisés les employés et responsables HSE ?",
          a: "Starter couvre jusqu'à 50 employés actifs et 3 responsables HSE sur un site. Operations inclut jusqu'à 300 employés sur 5 sites avec un nombre illimité de responsables HSE et d'auditeurs.",
        },
        {
          q: "L'interface en français et en arabe (RTL) est-elle incluse ?",
          a: "Oui. Tous les forfaits intègrent le changement instantané entre français, anglais et arabe (RTL) sans aucun surcoût.",
        },
        {
          q: "Pouvons-nous exporter nos registres de conformité à tout moment ?",
          a: "Toutes vos données appartiennent exclusivement à votre organisation. Vous pouvez exporter incidents, audits, formations et historiques équipements au format CSV quand vous le souhaitez.",
        },
      ],
    },
    features: {
      kicker: "Fonctionnalités Plateforme",
      title: "Six modules SST intégrés conçus pour les opérations industrielles",
      subtitle:
        "Remplacez vos tableurs dispersés et classeurs papier par un espace opérationnel unifié couvrant incidents, matrices de risques, audits ISO 45001, EPI, formations et urgences.",
      launchDemo: "Lancer la démo",
      comparePlans: "Comparer les forfaits",
      sectionTitle: "Modules cœur SST / HSE",
      sectionSubtitle:
        "Filtrez par domaine opérationnel ou ouvrez directement un module dans la démo interactive.",
      inspectModule: "Inspecter dans la démo",
      filters: [
        { id: "all" as const, label: "Tous les modules" },
        { id: "field" as const, label: "Terrain & Incidents" },
        { id: "risk" as const, label: "Risques & Audits" },
        { id: "workforce" as const, label: "Équipes & Équipements" },
      ],
      archTitle: "Conçue pour la réalité multi-sites",
      archSubtitle:
        "Chaque module partage le même modèle PostgreSQL, un contrôle d'accès par rôle strict et des alertes temps réel.",
      archStats: [
        {
          metric: "3 Langues",
          label: "Français, Anglais & Arabe (RTL)",
          detail: "Bascule instantanée pour le siège et les équipes terrain.",
        },
        {
          metric: "< 1 sec",
          label: "Alertes d'urgence WebSocket",
          detail: "Diffusion immédiate des urgences site sur chaque console ouverte.",
        },
        {
          metric: "27 Tables",
          label: "Piste d'audit relationnelle",
          detail: "Incidents, risques, audits et actions correctives reliés de bout en bout.",
        },
        {
          metric: "ISO 45001",
          label: "Conformité par chapitre",
          detail: "Preuves exportables prêtes pour vos audits de surveillance.",
        },
      ],
    },
    services: {
      kicker: "Déploiement & Conseil",
      title: "Un accompagnement terrain pour accélérer votre mise en conformité",
      subtitle:
        "Un logiciel seul ne transforme pas les habitudes terrain. Nos ingénieurs et spécialistes HSE vous accompagnent de la reprise de données jusqu'à la réussite de vos audits.",
      primaryCta: "Planifier un appel de cadrage",
      secondaryCta: "Explorer les modules",
      deliveryPrefix: "Délai indicatif :",
      requestScope: "Demander un cadrage et un planning",
      impactStats: [
        {
          metric: "-42 %",
          label: "Clôture plus rapide des actions correctives",
          detail:
            "Mesuré sur 6 mois sur des sites multi-ateliers remplaçant les relances e-mail par des responsables assignés dans PROSAFE.",
        },
        {
          metric: "3 h",
          label: "Préparation d'audit ISO 45001",
          detail:
            "Contre 5 jours complets de compilation manuelle sur tableurs avant les visites de certification.",
        },
        {
          metric: "100 %",
          label: "Traçabilité détecteurs gaz & EPI",
          detail:
            "Les alertes d'étalonnage empêchent l'utilisation d'équipements expirés en zone confinée ou sous tension.",
        },
      ],
    },
    about: {
      kicker: "À propos de PROSAFE",
      title: "Moderniser la santé et la sécurité au travail des équipes industrielles",
      subtitle:
        "PROSAFE relie les observations terrain aux décisions de conformité — en remplaçant les fichiers éclatés par un centre de pilotage SST / HSE unifié.",
      primaryCta: "Parler à notre équipe",
      secondaryCta: "Voir les postes ouverts",
      storyTitle: "Pourquoi nous avons conçu PROSAFE",
      principlesTitle: "Notre approche du logiciel de sécurité",
      principlesSubtitle:
        "Trois principes d'ingénierie et de terrain qui guident chaque module que nous livrons.",
      stats: [
        { value: "6", label: "Modules sécurité réunis dans une seule plateforme" },
        { value: "ISO 45001", label: "Alignement des audits et du coffre documentaire" },
        { value: "FR · EN · AR", label: "Interface multilingue complète et RTL" },
        { value: "24/7", label: "Alertes d'urgence temps réel via WebSocket" },
      ],
    },
    updates: {
      kicker: "Mises à jour produit",
      title: "Journal des versions et évolutions",
      subtitle:
        "Suivez chronologiquement les nouveaux modules SST, les améliorations ISO 45001 et les évolutions d'infrastructure livrées sur PROSAFE.",
      cta: "Demander une présentation",
      categories: [
        { value: "All", label: "Toutes" },
        { value: "Platform", label: "Plateforme" },
        { value: "Safety Core", label: "Cœur SST" },
        { value: "Compliance", label: "Conformité" },
      ],
    },
    blog: {
      kicker: "Retours Terrain & Guides",
      title: "Guides pratiques sur la sécurité industrielle, les audits et la prévention",
      subtitle:
        "Méthodes partagées par des coordinateurs HSE, ingénieurs maintenance et auditeurs ISO 45001.",
      searchPlaceholder: "Rechercher un article...",
      readArticle: "Lire l'article",
      emptyTitle: "Aucun article ne correspond à votre recherche.",
      emptySubtitle: "Essayez d'effacer le filtre ou d'afficher tous les thèmes.",
      resetFilters: "Réinitialiser les filtres",
      byPrefix: "Par",
      categories: [
        { value: "All", label: "Tous" },
        { value: "ISO 45001", label: "ISO 45001" },
        { value: "Risk Prevention", label: "Prévention" },
        { value: "Emergency Readiness", label: "Urgences" },
        { value: "Field Operations", label: "Terrain" },
      ],
    },
    careers: {
      kicker: "Carrières",
      title: "Construisez le logiciel qui protège les équipes sur le terrain",
      subtitle:
        "Nous sommes une équipe d'ingénieurs et de conseillers HSE entre Alger et l'Europe. Rejoignez-nous pour moderniser la sécurité industrielle.",
      openPositions: "Postes ouverts",
      filterHint: "Filtrez par équipe et postulez directement en moins de deux minutes.",
      applyCta: "Postuler",
      applyDialogPrefix: "Candidature",
      submittedPrefix: "Votre candidature a été enregistrée sous la référence",
      submittedSuffix:
        ". Notre équipe recrutement étudie chaque profil directement et répond sous 3 jours ouvrés.",
      close: "Fermer",
      fullName: "Nom complet *",
      fullNamePlaceholder: "Votre nom complet",
      email: "E-mail *",
      linkLabel: "Lien LinkedIn, GitHub ou CV (optionnel)",
      noteLabel: "Pourquoi PROSAFE ? *",
      notePlaceholder:
        "Partagez votre expérience en ingénierie logicielle, design produit ou HSE industriel.",
      cancel: "Annuler",
      submit: "Envoyer ma candidature",
      genericError: "Impossible d'envoyer votre candidature pour le moment. Veuillez réessayer.",
      departments: [
        { value: "All", label: "Tous" },
        { value: "Engineering", label: "Ingénierie" },
        { value: "HSE Advisory", label: "Conseil HSE" },
        { value: "Product & Design", label: "Produit & Design" },
        { value: "Customer Success", label: "Customer Success" },
      ],
    },
    privacy: {
      kicker: "Mentions légales · Novembre 2026",
      title: "Politique de confidentialité",
      subtitle:
        "Comment PROSAFE protège les données de sécurité des employés, responsables HSE et organisations sur notre plateforme cloud.",
      onThisPage: "Sur cette page",
      footerPrefix: "Une question sur cette politique ?",
      footerContact: "Contacter notre équipe confidentialité",
      footerMid: "ou consulter notre",
      footerSecurity: "Page Sécurité",
    },
    terms: {
      kicker: "Mentions légales · Novembre 2026",
      title: "Conditions d'utilisation",
      subtitle:
        "Cadre commercial et opérationnel clair régissant l'accès à la plateforme de sécurité PROSAFE.",
      onThisPage: "Sur cette page",
      footerPrefix: "Besoin d'un contrat cadre (MSA) ou d'un accord DPA entreprise ?",
      footerContact: "Contacter notre équipe",
    },
    security: {
      kicker: "Sécurité & Confiance",
      title: "Des contrôles de sécurité conçus pour les sites industriels réglementés",
      subtitle:
        "PROSAFE protège vos déclarations d'incidents, habilitations et archives d'audit grâce à une sécurité applicative en profondeur et un contrôle d'accès serveur strict.",
      primaryCta: "Signaler un problème de sécurité",
      secondaryCta: "Lire la confidentialité",
      disclosureTitle: "Divulgation responsable de vulnérabilité",
      disclosurePrefix:
        "Si vous identifiez une vulnérabilité sur PROSAFE, veuillez nous la signaler de manière responsable à",
      disclosureMid: "ou via notre",
      disclosureLink: "page Contact",
      disclosureSuffix:
        ". Nous accusons réception sous 24 heures et coordonnons rapidement la correction.",
    },
  },
  ar: {
    contact: {
      kicker: "تواصل مع PROSAFE",
      title: "تحدث مع فريق السلامة المهنية والتطبيق الميداني",
      subtitle:
        "اطلب عرضاً تعريفياً لمنصة PROSAFE لمصنعك أو مستودعاتك أو عمليات السلامة متعددة المواقع. نرد على جميع الطلبات خلال يوم عمل واحد.",
      formTitle: "أرسل لنا رسالة",
      formSubtitle: "شاركنا تفاصيل مواقعك وحجم الفريق وأهداف الامتثال والسلامة.",
      fullName: "الاسم الكامل *",
      fullNamePlaceholder: "أيمن حامل",
      email: "البريد الإلكتروني المهني *",
      emailPlaceholder: "name@company.com",
      company: "الشركة / المنشأة",
      companyPlaceholder: "المجموعة الصناعية للإنتاج",
      phone: "رقم الهاتف (اختياري)",
      phonePlaceholder: "+213 555 00 00 00",
      topic: "كيف يمكننا مساعدتك؟",
      message: "تفاصيل المشروع *",
      messagePlaceholder:
        "اذكر عدد المواقع وأولويات السلامة (ISO 45001، الحوادث، معدات الوقاية، التدريب) أو الموعد المناسب للعرض.",
      privacyPrefix: "محمي بموجب",
      privacyLink: "سياسة الخصوصية",
      privacySuffix: ". بدون رسائل تسويقية مزعجة.",
      submit: "إرسال الطلب",
      genericError: "تعذر إرسال رسالتك حالياً. يرجى المحاولة مرة أخرى.",
      receiptTitle: "تم استلام طلبك بنجاح",
      receiptBodyPrefix: "شكراً لتواصلك مع PROSAFE. تم تسجيل طلبك تحت الرقم المرجعي",
      receiptBodyMid: "وسنرد على البريد",
      receiptBodySuffix: "خلال يوم عمل واحد.",
      receiptTopic: "الموضوع:",
      receiptSubmitted: "تاريخ الإرسال:",
      exploreDemo: "استكشف العرض التفاعلي الآن",
      sendAnother: "إرسال رسالة أخرى",
      directTitle: "التواصل المباشر",
      salesLabel: "المبيعات واستشارات السلامة HSE",
      hoursLabel: "ساعات الدعم",
      hoursLine1: "الإثنين – الجمعة · 08:30 – 17:30 بتوقيت الجزائر / CET",
      hoursLine2: "متوسط الرد الأول أقل من 4 ساعات عمل",
      coverageLabel: "التغطية الإقليمية",
      coverageBody:
        "مركز عمليات الجزائر · خدمة المواقع الصناعية في شمال إفريقيا وأوروبا (AR / FR / EN)",
      demoCardTitle: "هل ترغب بتجربة لوحة التحكم مباشرة؟",
      demoCardBody:
        "افتح بيئة العرض التفاعلي المزودة بحوادث واقعية ومصفوفة مخاطر 5×5 وتدقيقات ISO 45001 ومخزون معدات الوقاية.",
      tryDemo: "جرّب العرض الحي",
      viewPricing: "عرض الأسعار",
      topics: [
        { value: "demo", label: "حجز عرض تفاعلي مباشر" },
        { value: "enterprise", label: "تسعير المؤسسات والمواقع المتعددة" },
        { value: "iso45001", label: "استشارات تدقيق ISO 45001" },
        { value: "support", label: "الدعم الفني والتكامل البرمجي" },
        { value: "partnership", label: "طلب شراكة" },
      ],
      validation: {
        fullName: "يرجى إدخال الاسم الكامل.",
        email: "يرجى إدخال بريد إلكتروني مهني صالح.",
        message: "يرجى كتابة 15 حرفاً على الأقل لوصف طلبك.",
      },
    },
    pricing: {
      kicker: "الأسعار والباقات",
      title: "خطط واضحة لكل موقع تناسب فرق السلامة بمختلف أحجامها",
      subtitle:
        "ابدأ بموقع واحد أو وسّع الامتثال لمعيار ISO 45001 عبر عدة مناطق صناعية. وفّر 20% مع الاشتراك السنوي.",
      banner:
        "تشمل جميع الباقات تشفير SSL ونسخاً احتياطياً يومياً لقاعدة البيانات ودعماً كاملاً للعربية والفرنسية والإنجليزية.",
      monthly: "شهري",
      annual: "سنوي · وفّر 20%",
      popular: "الأكثر اختياراً",
      perMonth: "/ شهرياً",
      billedMonthly: "فوترة شهرية · إلغاء في أي وقت",
      billedAnnually: (total: number, savings: number) =>
        `${total}$ سنوياً (توفير ${savings}$ في السنة)`,
      custom: "مخصص",
      customSub: "مصمم حسب عدد المنشآت واتفاقية مستوى الخدمة",
      faqTitle: "الأسئلة الشائعة",
      tiers: {
        starter: {
          name: "Starter",
          tagline: "للمواقع التي تبدأ برقمنة بلاغات الحوادث وسجلات معدات الوقاية.",
          siteLimit: "موقع صناعي واحد",
          userLimit: "حتى 50 موظفاً · 3 مشرفي سلامة",
          ctaLabel: "جرّب العرض الحي",
          features: [
            "الإبلاغ عن الحوادث والوشيكات مع الصور الميدانية",
            "مصفوفة المخاطر 5×5 وتقييم LMRA قبل العمل",
            "مخزون معدات الوقاية وتنبيهات انتهاء المعايرة",
            "واجهة متعددة اللغات (عربية RTL / فرنسية / إنجليزية)",
            "تصدير CSV قياسي وإشعارات البريد الإلكتروني",
          ],
        },
        operations: {
          name: "Operations",
          tagline: "عمليات امتثال ISO 45001 كاملة للمنشآت متعددة المناطق.",
          siteLimit: "حتى 5 مواقع",
          userLimit: "حتى 300 موظف · مشرفو سلامة غير محدودين",
          ctaLabel: "طلب تجربة Operations",
          features: [
            "كل مزايا باقة Starter",
            "قوائم تدقيق ISO 45001 وNFPA مع الإجراءات التصحيحية",
            "تمارين الإخلاء وتنبيهات الطوارئ الفورية عبر WebSocket",
            "برامج التدريب المهني والاختبارات وتنبيهات التجديد",
            "أرشيف وثائق الامتثال وجدول الصيانة الوقائية",
            "تسجيل الدخول عبر Google Workspace وصلاحيات الأدوار",
          ],
        },
        enterprise: {
          name: "Enterprise",
          tagline: "حوكمة سلامة مخصصة للمجموعات الصناعية الكبرى والمنشآت الحساسة.",
          siteLimit: "مواقع وفروع غير محدودة",
          userLimit: "موظفون غير محدودين · أدوار مخصصة",
          ctaLabel: "تواصل مع المبيعات",
          features: [
            "كل مزايا باقة Operations",
            "قاعدة بيانات معزولة وسياسة احتفاظ مخصصة",
            "تكامل API وWebhooks مع أنظمة ERP وHRIS",
            "قوالب تدقيق مخصصة لمعايير ISO 45001 وOSHA",
            "ورش تدريب ميدانية واتفاقية تشغيل بنسبة 99.9%",
          ],
        },
      },
      faqs: [
        {
          q: "هل يمكننا تجربة PROSAFE ببيانات واقعية قبل الاشتراك؟",
          a: "نعم. انقر على جرّب العرض الحي لاستكشاف مساحة عمل جاهزة تحتوي على حوادث ومصفوفة مخاطر وتدقيقات ISO 45001 وتمارين طوارئ.",
        },
        {
          q: "كيف يتم احتساب عدد الموظفين ومشرفي السلامة؟",
          a: "تشمل Starter حتى 50 موظفاً و3 مشرفي سلامة في موقع واحد، بينما تغطي Operations حتى 300 موظف عبر 5 مواقع مع عدد غير محدود من المشرفين.",
        },
        {
          q: "هل تدعم المنصة اللغة العربية واتجاه RTL بالكامل؟",
          a: "نعم، جميع الباقات تدعم التبديل الفوري بين العربية والفرنسية والإنجليزية دون أي رسوم إضافية.",
        },
        {
          q: "هل يمكننا تصدير سجلات الامتثال في أي وقت؟",
          a: "جميع بياناتك مملوكة حصرياً لمؤسستك ويمكنك تصدير الحوادث والتدقيقات والتدريب والمعدات بصيغة CSV في أي وقت.",
        },
      ],
    },
    features: {
      kicker: "قدرات المنصة",
      title: "ست وحدات سلامة متكاملة مصممة للعمليات الصناعية",
      subtitle:
        "استبدل الجداول المنفصلة والملفات الورقية بمساحة عمل موحدة تغطي الحوادث ومصفوفات المخاطر وتدقيق ISO 45001 ومعدات الوقاية والتدريب والطوارئ.",
      launchDemo: "فتح العرض الحي",
      comparePlans: "مقارنة الباقات",
      sectionTitle: "وحدات السلامة الأساسية",
      sectionSubtitle: "صفِّ حسب المجال التشغيلي أو انتقل مباشرة إلى أي وحدة في العرض الحي.",
      inspectModule: "معاينة الوحدة في العرض الحي",
      filters: [
        { id: "all" as const, label: "جميع الوحدات" },
        { id: "field" as const, label: "الميدان والحوادث" },
        { id: "risk" as const, label: "المخاطر والتدقيق" },
        { id: "workforce" as const, label: "الفرق والمعدات" },
      ],
      archTitle: "مصممة لواقع المواقع المتعددة",
      archSubtitle:
        "تشترك كل وحدة في نموذج بيانات PostgreSQL موحد وصلاحيات دقيقة وقناة تنبيهات فورية.",
      archStats: [
        {
          metric: "3 لغات",
          label: "العربية (RTL) والفرنسية والإنجليزية",
          detail: "تبديل فوري للغة بين الإدارة والفرق الميدانية.",
        },
        {
          metric: "< 1 ثانية",
          label: "تنبيهات طوارئ فورية",
          detail: "بث فوري لحالات الطوارئ إلى جميع لوحات المشرفين.",
        },
        {
          metric: "27 جدولاً",
          label: "سجل تدقيق مترابط",
          detail: "ربط كامل بين الحوادث والمخاطر والتدقيق والإجراءات التصحيحية.",
        },
        {
          metric: "ISO 45001",
          label: "امتثال مبني على البنود",
          detail: "أدلة جاهزة للتصدير لتدقيقات الشهادة الخارجية.",
        },
      ],
    },
    services: {
      kicker: "التنفيذ والاستشارات",
      title: "خدمات ميدانية تسرّع امتثال منشآتك الصناعية",
      subtitle:
        "البرنامج وحده لا يغيّر عادات الميدان. يرافقك مهندسونا وخبراء السلامة من ترحيل البيانات حتى الجاهزية الكاملة للتدقيق.",
      primaryCta: "احجز مكالمة تنفيذ",
      secondaryCta: "استكشف الوحدات",
      deliveryPrefix: "المدة التقديرية:",
      requestScope: "اطلب نطاق العمل والجدول الزمني",
      impactStats: [
        {
          metric: "-42%",
          label: "إغلاق أسرع للإجراءات التصحيحية",
          detail: "نتيجة مقاسة عبر مواقع صناعية استبدلت المتابعة بالبريد الإلكتروني بمسؤولين محددين.",
        },
        {
          metric: "3 ساعات",
          label: "وقت تحضير تدقيق ISO 45001",
          detail: "بدلاً من 5 أيام كاملة من تجميع الجداول يدوياً قبل الزيارات التفتيشية.",
        },
        {
          metric: "100%",
          label: "تتبع كواشف الغاز ومعدات الوقاية",
          detail: "تنبيهات المعايرة تمنع دخول أجهزة غير مفحوصة إلى المناطق الحساسة.",
        },
      ],
    },
    about: {
      kicker: "عن PROSAFE",
      title: "تحديث الصحة والسلامة المهنية للفرق الصناعية",
      subtitle:
        "تأسست PROSAFE لردم الفجوة بين الملاحظات الميدانية وقرارات الامتثال عبر مركز قيادة موحد للسلامة المهنية.",
      primaryCta: "تحدث مع فريقنا",
      secondaryCta: "الوظائف المتاحة",
      storyTitle: "لماذا بنينا PROSAFE",
      principlesTitle: "كيف نصمم برمجيات السلامة",
      principlesSubtitle: "ثلاثة مبادئ هندسية وميدانية توجه كل وحدة نطورها.",
      stats: [
        { value: "6", label: "وحدات سلامة أساسية في منصة موحدة" },
        { value: "ISO 45001", label: "توافق كامل مع بنود التدقيق والوثائق" },
        { value: "AR · FR · EN", label: "دعم كامل للعربية والفرنسية والإنجليزية" },
        { value: "24/7", label: "تنبيهات طوارئ فورية عبر WebSocket" },
      ],
    },
    updates: {
      kicker: "تحديثات المنصة",
      title: "سجل الإصدارات والتطوير",
      subtitle:
        "سجل زمني لوحدات السلامة الجديدة وتحسينات الامتثال ISO 45001 وتحديثات البنية التحتية في PROSAFE.",
      cta: "اطلب عرضاً للإصدار",
      categories: [
        { value: "All", label: "الكل" },
        { value: "Platform", label: "المنصة" },
        { value: "Safety Core", label: "جوهر السلامة" },
        { value: "Compliance", label: "الامتثال" },
      ],
    },
    blog: {
      kicker: "مقالات وأدلة ميدانية",
      title: "محتوى عملي حول السلامة الصناعية والتدقيق والوقاية من المخاطر",
      subtitle: "أدلة ميدانية من منسقي السلامة ومهندسي الصيانة ومدققي ISO 45001.",
      searchPlaceholder: "ابحث في المقالات...",
      readArticle: "قراءة المقال",
      emptyTitle: "لا توجد مقالات مطابقة لبحثك.",
      emptySubtitle: "جرّب مسح البحث أو عرض جميع المواضيع.",
      resetFilters: "إعادة تعيين",
      byPrefix: "بقلم",
      categories: [
        { value: "All", label: "الكل" },
        { value: "ISO 45001", label: "ISO 45001" },
        { value: "Risk Prevention", label: "الوقاية" },
        { value: "Emergency Readiness", label: "الطوارئ" },
        { value: "Field Operations", label: "الميدان" },
      ],
    },
    careers: {
      kicker: "الوظائف",
      title: "طوّر برمجيات تساعد الفرق الصناعية على العودة بسلام",
      subtitle:
        "نحن فريق متخصص في الهندسة واستشارات السلامة بين الجزائر وأوروبا. انضم إلينا لتحديث السلامة المهنية.",
      openPositions: "الوظائف المفتوحة",
      filterHint: "صفِّ حسب الفريق وقدّم مباشرة دون نماذج مطوّلة.",
      applyCta: "تقدّم للوظيفة",
      applyDialogPrefix: "التقديم",
      submittedPrefix: "تم تسجيل طلبك تحت الرقم المرجعي",
      submittedSuffix: ". يراجع فريق التوظيف كل طلب مباشرة ويرد خلال 3 أيام عمل.",
      close: "إغلاق",
      fullName: "الاسم الكامل *",
      fullNamePlaceholder: "اسمك الكامل",
      email: "البريد الإلكتروني *",
      linkLabel: "رابط LinkedIn أو GitHub أو السيرة الذاتية (اختياري)",
      noteLabel: "لماذا PROSAFE؟ *",
      notePlaceholder: "شاركنا خبرتك في تطوير البرمجيات أو التصميم أو السلامة الصناعية.",
      cancel: "إلغاء",
      submit: "إرسال الطلب",
      genericError: "تعذر إرسال الطلب حالياً. يرجى المحاولة لاحقاً.",
      departments: [
        { value: "All", label: "الكل" },
        { value: "Engineering", label: "الهندسة" },
        { value: "HSE Advisory", label: "استشارات HSE" },
        { value: "Product & Design", label: "المنتج والتصميم" },
        { value: "Customer Success", label: "نجاح العملاء" },
      ],
    },
    privacy: {
      kicker: "قانوني · ساري منذ نوفمبر 2026",
      title: "سياسة الخصوصية",
      subtitle:
        "كيف تحمي PROSAFE بيانات السلامة الخاصة بالموظفين والمشرفين والمنشآت عبر منصتنا السحابية.",
      onThisPage: "في هذه الصفحة",
      footerPrefix: "هل لديك أسئلة حول هذه السياسة؟",
      footerContact: "تواصل مع فريق الخصوصية",
      footerMid: "أو راجع",
      footerSecurity: "نظرة عامة على الأمان",
    },
    terms: {
      kicker: "قانوني · ساري منذ نوفمبر 2026",
      title: "شروط الاستخدام",
      subtitle: "شروط تجارية وتشغيلية واضحة تحكم استخدام منصة PROSAFE للسلامة المهنية.",
      onThisPage: "في هذه الصفحة",
      footerPrefix: "هل تحتاج إلى اتفاقية خدمة مؤسسية (MSA) أو اتفاقية معالجة بيانات؟",
      footerContact: "تواصل مع فريقنا",
    },
    security: {
      kicker: "الأمان والثقة",
      title: "ضوابط أمان مصممة للبيئات الصناعية المنظمة",
      subtitle:
        "تحمي PROSAFE بلاغات الحوادث وشهادات الموظفين وأرشيف الامتثال بأمان متعدد الطبقات والتحقق الصارم على الخادم.",
      primaryCta: "الإبلاغ عن ملاحظة أمنية",
      secondaryCta: "قراءة سياسة الخصوصية",
      disclosureTitle: "الإبلاغ المسؤول عن الثغرات الأمنية",
      disclosurePrefix: "إذا اكتشفت ثغرة أمنية في PROSAFE، يرجى الإبلاغ عنها بمسؤولية عبر",
      disclosureMid: "أو من خلال",
      disclosureLink: "صفحة التواصل",
      disclosureSuffix: ". نؤكد استلام البلاغات الأمنية خلال 24 ساعة وننسق المعالجة بسرعة.",
    },
  },
} as const;

export function localizeValidationErrors(
  errors: Partial<Record<keyof ContactFormInput, string>>,
  locale: PublicLocale
): Partial<Record<keyof ContactFormInput, string>> {
  const dict = PUBLIC_COPY[locale].contact.validation;
  const localized: Partial<Record<keyof ContactFormInput, string>> = {};
  if (errors.fullName) localized.fullName = dict.fullName;
  if (errors.email) localized.email = dict.email;
  if (errors.message) localized.message = dict.message;
  return localized;
}
