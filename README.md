<div align="center">

<img src="assets/prosafe-banner.svg" alt="PROSAFE Banner" width="100%" />

# PROSAFE
### Plateforme Intégrée de Sécurité et Santé au Travail (SST) / Occupational Health & Safety (OHS)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_52-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![ISO 45001](https://img.shields.io/badge/Conformité-ISO_45001%3A2018-059669)](https://www.iso.org/standard/63787.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<p align="center">
  <b>Une solution complète et multi-plateforme pour digitaliser la prévention des risques, accélérer le signalement d'incidents sur le terrain, automatiser la conformité réglementaire et protéger le capital humain en entreprise.</b>
</p>

[Fonctionnalités](#-fonctionnalités-clés) •
[Stack Technique](#-stack-technique) •
[Architecture](#-architecture) •
[Démarrage Rapide](#-démarrage-rapide) •
[Rôles & Accès](#-rôles-et-permissions) •
[Documentation](#-documentation)

---

</div>

## 📌 À Propos de PROSAFE

Dans tout environnement industriel, logistique, BTP ou tertiaire, la gestion de la **Sécurité et Santé au Travail (SST)** représente un défi critique : lenteur de remontée des incidents, sous-déclaration des presqu'accidents, suivi fastidieux des EPI et des formations obligatoires, et complexité des audits réglementaires.

**PROSAFE** résout cette problématique en interconnectant le personnel de terrain et les responsables SST à travers un écosystème en temps réel composé :
1. **D'une application mobile tout-terrain (Expo / React Native)** pour les opérateurs : déclarations instantanées avec médias, analyse de risque de dernière minute (LMRA), alertes d'urgence et inventaire EPI.
2. **D'un portail web de pilotage (React / Vite)** pour les managers SST et administrateurs : cartographie interactive, matrice des risques 5×5, audits ISO 45001, indicateurs de performance (KPI) et plans d'action correctifs.
3. **D'un serveur central sécurisé (NestJS / PostgreSQL)** : architecture modulaire, WebSockets bidirectionnels, notifications push, authentification RS256 JWT et tâches planifiées automatisées.

---

## 🛠️ Stack Technique

PROSAFE est structuré sous forme de monorepo moderne géré avec **pnpm workspaces** et **Turborepo** :

| Domaine | Technologies | Rôle dans le projet |
|---|---|---|
| **Backend API** | **NestJS 10**, **TypeORM 0.3**, **PostgreSQL 16** | API REST sécurisée, modèle relationnel, migrations, ORM |
| **Sécurité & Auth** | **JWT RS256**, **Bcrypt**, **Helmet**, **Passport** | Chiffrement asymétrique des tokens, hashing robuste, protection XSS/CORS |
| **Temps Réel** | **Socket.IO 4.8** | Passerelle WebSocket pour notifications instantanées et messagerie instantanée |
| **Web Back-Office** | **React 18**, **Vite**, **Tailwind CSS**, **shadcn/ui** | Console d'administration SST, tableaux de bord interactifs, accessibilité WCAG |
| **Visualisation** | **Recharts**, **React Leaflet**, **Lucide Icons** | Graphiques d'analyse de tendances et cartographie GPS des incidents |
| **Application Mobile**| **React Native 0.76**, **Expo SDK 52**, **Expo Router 4**| Application mobile cross-platform (iOS, Android, PWA Web) |
| **Périphériques Mobile**| **Expo Location**, **Image Picker**, **Secure Store**, **Notifications** | Géolocalisation GPS des incidents, capture média photo/vidéo, push notifications |
| **Rapports & Documents**| **pdfkit**, **exceljs** | Génération automatisée d'exports PDF réglementaires et classeurs Excel |
| **Internationalisation**| **i18next** | Support complet trilingue : Français (défaut), Anglais et Arabe (RTL) |

---

## 🚀 Fonctionnalités Clés

### 🚨 1. Signalement & Gestion des Incidents
- **Déclaration assistée** : Prise de vue photo/vidéo (jusqu'à 5 fichiers avec contrôle magic-byte), horodatage et coordonnées GPS automatiques.
- **Workflow de traitement** : Cycle de vie complet (*Déclaré → En analyse → En cours d'action → Clôturé* ou *Rejeté*).
- **Évaluation de criticité** : Calcul automatique du niveau de gravité (Gravité × Probabilité) avec rattachement immédiat d'actions correctives.
- **Historique & Traçabilité** : Journalisation inaltérable de chaque changement d'état et commentaire de suivi.

### 🛡️ 2. Gestion des Équipements de Protection (EPI)
- **Catalogue & Inventaire** : Suivi des équipements individuels et collectifs avec statut de conformité.
- **Maintenance & Alertes d'expiration** : Planification des inspections obligatoires, détection des stocks bas et alertes automatiques pour renouvellement des EPI périmés.

### 🎓 3. Formations & Habilitations Sécurité
- **Passeport Sécurité** : Suivi des certifications des opérateurs (CACES, SST, Travail en hauteur, Habilitation électrique...).
- **Rappels automatiques** : Alertes anticipées avant expiration des validités (J-30, J-7, J-1).
- **Matrice des compétences** : Identification instantanée des besoins en recyclage et auto-planification des sessions.

### 📊 4. Évaluation des Risques & LMRA
- **Matrice 5×5** : Cartographie visuelle des risques par poste de travail avec niveaux d'acceptabilité.
- **Plans d'actions préventifs** : Affectation des actions à un responsable avec échéancier et alertes de retard.
- **LMRA (Last Minute Risk Analysis)** : Questionnaire rapide sur mobile avant intervention à haut risque.

### 📋 5. Audits & Conformité ISO 45001:2018
- **Grille de contrôle réglementaire** : Checklist pré-intégrée conforme aux exigences ISO 45001.
- **Calcul de conformité** : Évaluation du taux de conformité par service ou site.
- **Gestion documentaire** : Coffre-fort numérique pour les procédures de sécurité, fiches de données de sécurité (FDS) et rapports réglementaires.

### 📢 6. Gestion des Urgences & Évacuation
- **Diffusion d'urgence (Broadcast)** : Alerte instantanée push et sonnerie prioritaire vers tous les terminaux mobiles du site.
- **Fiches réflexes** : Procédures d'intervention par scénario (incendie, fuite chimique, malaise, etc.).
- **Exercices d'évacuation (Drills)** : Planification, chronométrage et enregistrement des exercices de sécurité.

### 📈 7. Tableaux de Bord & Analytics
- **Indicateurs clés de performance** : Taux de fréquence, taux de gravité, répartition par zone et type d'incident.
- **Prévisions & Détection de pics** : Alertes automatiques en cas d'augmentation anormale de sinistralité.
- **Exports professionnels** : Génération en un clic de rapports PDF pour les comités SST et de classeurs Excel pour les audits.

### 💬 8. Communication & Inclusion
- **Messagerie sécurisée** : Échanges directs entre collaborateurs et référents sécurité.
- **Multi-langues** : Interface disponible en Français, Anglais et Arabe avec support natif du mode RTL (Right-to-Left).
- **Accessibilité** : Thème à contraste élevé et ajustement dynamique de la taille des textes.

---

## 🏛️ Architecture

```
                 ┌─────────────────────────┐        ┌────────────────────────┐
  Collaborateurs │   Mobile App (Expo)     │──┐     │ Web Admin (Vite/React) │ ◄── Responsables SST
  (Terrain)      │   iOS · Android · Web   │  │     │ Tableaux de bord & SIG │     & Administrateurs
                 └─────────────────────────┘  │     └───────────┬────────────┘
                                              │ HTTPS + JWT     │
                                              ▼                 ▼
                                   ┌──────────────────────────────────┐
                                   │     API Backend (NestJS 10)      │── Swagger Docs (/api/docs)
                                   │     Socket.IO (/ws) Temps Réel   │
                                   │     Moteur de tâches cron        │
                                   └───────┬────────────┬─────────────┘
                                           │            │
                                PostgreSQL 16 ◄┘        ▼ Stockage local / Disque
                                           Expo Push · Serveur SMTP (Emails)
```

---

## 👥 Rôles et Permissions

| Rôle | Niveau d'accès |
|---|---|
| 👑 `admin` | Accès complet : gouvernance, gestion des comptes utilisateurs (approbation, blocage, rôles), configuration générale. |
| 🛡️ `sst_manager` | Supervision SST opérationnelle : incidents, matrice des risques, audits, équipements, formations, alertes et rapports. |
| 👷 `employee` | Usage terrain : déclaration d'incidents, LMRA, consultation des équipements/formations, messagerie SST, alertes d'urgence. |
| ⏳ `pending` | Compte fraîchement créé en attente de validation par un administrateur avant toute activation. |

> Le tout premier compte créé lors de l'initialisation de l'application reçoit automatiquement le rôle `admin`.

---

## ⏰ Tâches Automatisées (Cron Jobs)

Le serveur NestJS exécute quotidiennement des vérifications d'intégrité et de conformité (*fuseau horaire Africa/Algiers*) :

- **06:30** : Détection des pics anormaux d'incidents et émission d'alertes aux managers.
- **07:00** : Vérification des stocks bas d'EPI, échéances d'inspections, rappels de formation (J-7, J-1) et certifications arrivant à expiration.
- **07:15** : Rappels programmés des audits de sécurité à venir.
- **07:20** : Suivi des documents de conformité expirant sous 30 jours.
- **07:30** : Surveillance et relance des actions correctives en retard.
- **07:45** : Surveillance et relance des plans d'action SST en retard.

---

## ⚡ Démarrage Rapide

### Prérequis
- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0
- **Docker** et **Docker Compose** (pour PostgreSQL)

### 1. Installation des dépendances
```bash
git clone https://github.com/Abdelkouddous/prosafe.git
cd prosafe
pnpm install
```

### 2. Démarrage de la base de données
```bash
cd apps/backend
docker compose up -d postgres
cp .env.example .env
# Renseignez les clés RS256 et paramètres de base dans .env
cd ../..
```

### 3. Lancement des applications en développement
```bash
# Terminal 1 : Backend API (port 3000)
pnpm --filter backend start:dev

# Terminal 2 : Web Admin (port 5173)
pnpm --filter admin dev

# Terminal 3 : Application Mobile Expo
pnpm --filter mobile start
```

- **Documentation Swagger de l'API** : [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Portail Web d'administration** : [http://localhost:5173](http://localhost:5173)

---

## 📂 Structure du Monorepo

```
prosafe/
├── apps/
│   ├── backend/        # API REST NestJS, TypeORM, Socket.IO, Cron & Auth
│   ├── admin/          # Console Web React/Vite, Tailwind, Recharts, Leaflet
│   └── mobile/         # Application mobile Expo / React Native
├── assets/             # Visuels, bannières et ressources graphiques du projet
├── docs/               # Spécifications détaillées, API contract & guides
│   ├── SPEC.md         # Statut d'implémentation et matrice d'exigences
│   ├── API_CONTRACT.md # Spécification formelle de tous les endpoints partagés
│   ├── TECHNICAL.md    # Documentation d'architecture, sécurité & déploiement
│   ├── USER_GUIDE.md   # Guide d'utilisation complet (FR)
│   └── DEPLOY_CHECKLIST.md # Procédure de mise en production
├── pnpm-workspace.yaml # Configuration de l'espace de travail pnpm
└── README.md           # Documentation principale du projet
```

---

## 📚 Documentation Détaillée

Consultez les guides spécialisés situés dans le dossier [`docs/`](docs/) :

- 📖 [Guide Utilisateur Détaillé](docs/USER_GUIDE.md) : Mode d'emploi pas à pas pour les managers et employés.
- 📐 [Contrat d'API](docs/API_CONTRACT.md) : Catalogue des routes REST et événements WebSocket.
- 🏗️ [Architecture Technique](docs/TECHNICAL.md) : Détail des modèles de données, sécurité et tests.
- 🚀 [Checklist de Déploiement](docs/DEPLOY_CHECKLIST.md) : Étapes de release en environnement de production.

---

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).
