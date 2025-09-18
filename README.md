# PROSAFE - Workplace Safety & Security Management System

PROSAFE is a comprehensive enterprise-grade safety and security management platform designed for modern workplaces. The system provides real-time monitoring, incident management, training tracking, and compliance tools to ensure workplace safety and security.

## 🏗️ Project Structure

This is a monorepo built with Turborepo containing three main applications:

```
prosafe/
├── apps/
│   ├── admin/          # React admin dashboard (Vite + TypeScript)
│   ├── backend/        # NestJS API server
│   └── mobile/         # React Native mobile app (Expo)
├── packages/
│   ├── eslint-config/  # Shared ESLint configurations
│   ├── typescript-config/ # Shared TypeScript configurations
│   └── ui/             # Shared UI components
```

## 🚀 Features

### 🔐 Security Management

- **Real-time Security Monitoring** - Continuous surveillance with automated threat detection
- **Alert System** - Instant notifications with smart filtering to reduce alert fatigue
- **Incident Management** - Automated and manual intervention capabilities
- **Access Control** - Role-based permissions and security policies

### 👥 Workplace Safety (SST)

- **Training Tracking** - Manage and track employee safety training programs
- **Incident Reporting** - Easy-to-use incident declaration system
- **Inventory Management** - Track safety equipment with low-stock alerts
- **Compliance Monitoring** - Ensure adherence to safety regulations

### 📊 Analytics & Reporting

- **Security Dashboard** - Comprehensive overview of security posture
- **Incident Analytics** - Trend analysis and reporting
- **Training Reports** - Track completion rates and compliance
- **Real-time Metrics** - Live security score and threat monitoring

## 🛠️ Technology Stack

### Backend

- **NestJS** - Enterprise-grade Node.js framework
- **TypeORM** - Database ORM with PostgreSQL
- **JWT Authentication** - Secure authentication with RSA256
- **Role-Based Access Control (RBAC)**
- **Docker** - Containerized deployment

### Frontend (Admin)

- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI component library
- **React Hook Form** - Form management
- **Recharts** - Data visualization

### Mobile

- **React Native** with Expo
- **TypeScript** support
- Cross-platform iOS/Android compatibility

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm (recommended package manager)
- PostgreSQL database
- Docker (optional)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd prosafe
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Environment Setup**

```bash
# Backend environment
cp apps/backend/.env.example apps/backend/.env
# Configure your database and other settings
```

4. **Database Setup**

```bash
cd apps/backend
npm run migration:run
```

5. **Start Development Servers**

```bash
# Start all applications
pnpm dev

# Or start individually
pnpm --filter backend dev
pnpm --filter admin dev
pnpm --filter mobile dev
```

## 📱 Applications

### Admin Dashboard

- **URL**: `http://localhost:5173` (development)
- **Purpose**: Web-based administration interface
- **Features**: User management, incident tracking, analytics, system configuration

### Backend API

- **URL**: `http://localhost:3000` (development)
- **Purpose**: RESTful API server
- **Documentation**: Available at `/api/docs` (Swagger)

### Mobile App

- **Purpose**: Field incident reporting and safety management
- **Platforms**: iOS and Android
- **Features**: Incident reporting, training access, emergency contacts

## 🔧 Development Commands

```bash
# Build all applications
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm check-types
```

## 🏢 Use Cases

- **Manufacturing** - Equipment safety monitoring and incident tracking
- **Healthcare** - Compliance management and safety training
- **Construction** - Site safety management and worker training
- **Corporate** - Office security and emergency preparedness
- **Education** - Campus safety and incident response

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.

---

**PROSAFE** - Advanced Security Management for Modern Enterprises
