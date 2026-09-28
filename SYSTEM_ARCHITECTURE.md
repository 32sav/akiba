# Akiba System Architecture

A full-stack digital savings tracker for Kenyan chamas, built with a modern, polyglot technology stack designed for scalability, maintainability, and performance.

---

## 📐 Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AKIBA ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │   DESKTOP APP    │      │   WEB FRONTEND   │                │
│  │   (C#/.NET)      │      │   (HTML/CSS/JS)  │                │
│  │   WPF/WinForms   │      │   React/TypeScript│               │
│  └────────┬─────────┘      └────────┬─────────┘                │
│           │                         │                          │
│           └────────────┬────────────┘                          │
│                        │                                       │
│                ┌───────▼────────┐                             │
│                │  API GATEWAY   │                             │
│                │  (C#/.NET Core)│                             │
│                └───────┬────────┘                             │
│                        │                                       │
│        ┌───────────────┼───────────────┐                      │
│        │               │               │                      │
│   ┌────▼────┐  ┌──────▼──────┐  ┌────▼────┐                 │
│   │  JAVA   │  │  PYTHON     │  │   C#    │                 │
│   │ BACKEND │  │ SERVICES    │  │ BACKEND │                 │
│   │ (Spring)│  │(FastAPI/etc)│  │(.NET)   │                 │
│   └────┬────┘  └──────┬──────┘  └────┬────┘                 │
│        │               │              │                      │
│        └───────────────┼──────────────┘                      │
│                        │                                       │
│              ┌─────────▼──────────┐                          │
│              │   POSTGRESQL DB    │                          │
│              │  (Relational Data) │                          │
│              └────────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Layered Architecture

### Layer 1: Presentation & UI

#### **HTML/CSS** 🎨
- **Purpose**: Markup and styling for web interfaces
- **Location**: `/artifacts/akiba/src`
- **Components**:
  - Semantic HTML5 structure
  - Responsive CSS Grid & Flexbox layouts
  - Tailwind CSS for utility-first styling
  - Material Design principles
- **Responsibilities**:
  - Member dashboards
  - Transaction history views
  - Chama management pages
  - Report generation UI
  - M-Pesa payment forms

#### **Desktop Application (C#/.NET)** 🖥️
- **Purpose**: Rich native desktop client for chama treasurers
- **Location**: `/artifacts/desktop-app`
- **Framework**: 
  - WPF (Windows Presentation Foundation) or WinForms
  - .NET Framework 4.8+ or .NET 6+
- **Features**:
  - Offline-capable member records
  - Local caching and sync
  - Advanced reporting and analytics
  - Barcode/QR scanning for transactions
  - Bulk import/export tools
  - Advanced security with Windows authentication
- **Tech Stack**:
  - C# 10+
  - Entity Framework Core for ORM
  - MVVM pattern for UI architecture
  - SQLite for local database
  - Prism for dependency injection

---

### Layer 2: API Gateway & Orchestration

#### **C#/.NET Core** 🔌
- **Purpose**: Central API gateway and orchestration layer
- **Location**: `/artifacts/api-gateway`
- **Responsibilities**:
  - Request routing and load balancing
  - Authentication & authorization
  - Rate limiting and throttling
  - API versioning management
  - Cross-cutting concerns (logging, monitoring)
  - Response transformation and caching
- **Endpoints**:
  - `/api/v1/auth/*` → Authentication service
  - `/api/v1/chamas/*` → Chama management
  - `/api/v1/members/*` → Member services
  - `/api/v1/transactions/*` → Transaction processing
  - `/api/v1/loans/*` → Loan management
  - `/api/v1/reports/*` → Reporting engine

---

### Layer 3: Business Logic & Services

#### **Java (Spring Boot)** ☕
- **Purpose**: Core business logic and domain services
- **Location**: `/artifacts/java-services`
- **Responsibilities**:
  - Member management service
  - Chama operations and governance
  - Contribution tracking logic
  - Loan origination and management
  - Interest calculation engine
  - Repayment scheduling
- **Tech Stack**:
  - Spring Boot 3.x
  - Spring Data JPA for persistence
  - Spring Security for authorization
  - Hibernate ORM
  - Lombok for boilerplate reduction
  - JUnit 5 & Mockito for testing
- **Key Services**:
  ```
  MemberService
  ├── registerMember()
  ├── updateProfile()
  ├── getMemberHistory()
  └── deactivateMember()
  
  ChamaService
  ├── createChama()
  ├── inviteMember()
  ├── manageMeetings()
  └── generateStatements()
  
  LoanService
  ├── originateLoan()
  ├── calculateInterest()
  ├── scheduleRepayments()
  └── trackRepaymentStatus()
  
  ContributionService
  ├── recordContribution()
  ├── validateAmount()
  ├── processM-PesaCallback()
  └── reconcileTransactions()
  ```

#### **Python (FastAPI/Flask)** 🐍
- **Purpose**: Data processing, ML services, and async tasks
- **Location**: `/artifacts/python-services`
- **Responsibilities**:
  - Data analytics and insights generation
  - Report generation and PDF export
  - Machine learning for fraud detection
  - Batch processing and reconciliation
  - Background job scheduling
  - SMS/Email notifications
- **Tech Stack**:
  - FastAPI for async HTTP services
  - Celery for task queue
  - Pandas for data manipulation
  - Scikit-learn for ML models
  - ReportLab or WeasyPrint for PDF generation
  - Pytest for testing
  - APScheduler for job scheduling
- **Key Services**:
  ```
  Analytics Service
  ├── generateChamaReport()
  ├── calculateSavingsMetrics()
  ├── predictMemberRisk()
  └── exportToExcel()
  
  Notification Service
  ├── sendSMS()
  ├── sendEmail()
  ├── sendPushNotification()
  └── logNotificationStatus()
  
  Background Jobs
  ├── reconcileMPesaTransactions()
  ├── generateMonthlyStatements()
  ├── updateInterestAccrual()
  └── auditLogs()
  ```

---

### Layer 4: Data Persistence

#### **PostgreSQL** 🐘
- **Purpose**: Primary relational database for all core data
- **Location**: Managed database service (AWS RDS, DigitalOcean, or self-hosted)
- **Schema Components**:

##### Core Tables:
```sql
-- Chama Management
CREATE TABLE chamas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  meetingFrequency VARCHAR(50),
  contributionAmount DECIMAL(10,2),
  status VARCHAR(20),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Member Management
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  chamaId INTEGER REFERENCES chamas(id),
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  phoneNumber VARCHAR(20) UNIQUE NOT NULL,
  idNumber VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  status VARCHAR(20),
  joinDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions & Contributions
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  chamaId INTEGER REFERENCES chamas(id),
  memberId INTEGER REFERENCES members(id),
  type VARCHAR(50), -- 'contribution', 'withdrawal', 'loan_disbursement'
  amount DECIMAL(10,2) NOT NULL,
  mpesaRef VARCHAR(100) UNIQUE,
  status VARCHAR(20),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  chamaId INTEGER REFERENCES chamas(id),
  memberId INTEGER REFERENCES members(id),
  principal DECIMAL(10,2) NOT NULL,
  interestRate DECIMAL(5,2),
  status VARCHAR(20),
  disbursedAt TIMESTAMP,
  dueDate DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repayments
CREATE TABLE repayments (
  id SERIAL PRIMARY KEY,
  loanId INTEGER REFERENCES loans(id),
  amount DECIMAL(10,2) NOT NULL,
  mpesaRef VARCHAR(100),
  paidAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Trail
CREATE TABLE auditLogs (
  id SERIAL PRIMARY KEY,
  userId INTEGER,
  action VARCHAR(255),
  entityType VARCHAR(50),
  entityId INTEGER,
  changes JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📁 Project Directory Structure

```
akiba/
├── README.md
├── SYSTEM_ARCHITECTURE.md
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
│
├── artifacts/
│   ├── akiba/                          # WEB FRONTEND (React/TypeScript/HTML/CSS)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   ├── forms/
│   │   │   │   ├── dashboard/
│   │   │   │   └── reports/
│   │   │   ├── pages/
│   │   │   ├── styles/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   ├── api-gateway/                   # C#/.NET CORE API GATEWAY
│   │   ├── Controllers/
│   │   ├── Services/
│   │   ├── Middleware/
│   │   ├── Models/
│   │   ├── appsettings.json
│   │   ├── Startup.cs
│   │   ├── Program.cs
│   │   └── *.csproj
│   │
│   ├── api-server/                    # LEGACY (Being refactored)
│   │   └── ...
│   │
│   ├── java-services/                 # JAVA SPRING BOOT SERVICES
│   │   ├── src/main/java/com/akiba/
│   │   │   ├── members/
│   │   │   ├── chamas/
│   │   │   ├── loans/
│   │   │   ├── contributions/
│   │   │   ├── config/
│   │   │   └── AkibaApplication.java
│   │   ├── src/main/resources/
│   │   │   ├── application.yml
│   │   │   └── db/migration/
│   │   ├── src/test/java/
│   │   └── pom.xml
│   │
│   ├── python-services/               # PYTHON FASTAPI SERVICES
│   │   ├── app/
│   │   │   ├── analytics/
│   │   │   ├── notifications/
│   │   │   ├── jobs/
│   │   │   ├── models/
│   │   │   ├── api/
│   │   │   └── main.py
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   ├── pyproject.toml
│   │   └── docker/
│   │
│   └── desktop-app/                   # C# WINDOWS DESKTOP APPLICATION
│       ├── MainWindow.xaml
│       ├── MainWindow.xaml.cs
│       ├── ViewModels/
│       ├── Views/
│       ├── Models/
│       ├── Services/
│       ├── Resources/
│       ├── App.xaml
│       ├── App.xaml.cs
│       └── DesktopApp.csproj
│
├── lib/
│   ├── api-client-react/              # React Query client (TypeScript)
│   ├── api-zod/                       # Zod schemas (TypeScript)
│   └── api-spec/
│       ├── openapi.yaml               # API Specification (YAML)
│       └── orval.config.ts            # Code generation config
│
├── scripts/
│   ├── src/
│   │   ├── generate-clients.ts        # Generate API clients
│   │   ├── seed-db.ts                 # Database seeding
│   │   └── deploy.ts                  # Deployment scripts
│   ├── tsconfig.json
│   └── package.json
│
├── db/                                # PostgreSQL Setup
│   ├── init/
│   │   ├── 001-schema.sql
│   │   ├── 002-indexes.sql
│   │   └── 003-seed-data.sql
│   ├── migrations/
│   └── docker-compose.yml
│
└── docs/
    ├── API.md
    ├── DATABASE.md
    ├── DEPLOYMENT.md
    └── CONTRIBUTING.md
```

---

## 🔄 Data Flow

### Contribution Payment Flow (with M-Pesa Integration)

```
┌─────────────────────────────────────────────────────────────────┐
│ Member (HTML/CSS Web or C# Desktop App)                         │
│ → Initiates contribution via UI                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ C#/.NET API Gateway                                             │
│ → Validates request                                             │
│ → Routes to appropriate service                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Java Spring Boot Contribution Service                           │
│ → Validates member status & amount                              │
│ → Generates payment reference                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Python FastAPI M-Pesa Adapter                                   │
│ → Encrypts credentials                                          │
│ → Calls Safaricom DaraJa API (STK Push)                         │
│ → Stores pending transaction                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────────────┐    ┌──────────────────┐
   │ Member Phone    │    │ PostgreSQL DB    │
   │ (STK Popup)     │    │ (Transaction Log)│
   └────────┬────────┘    └──────────────────┘
            │
            │ Member enters PIN
            │
            ▼
   ┌─────────────────────────────────────────┐
   │ Safaricom M-Pesa Network               │
   │ → Processes payment                    │
   │ → Sends callback webhook               │
   └──────────────┬──────────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────────┐
   │ Python FastAPI Webhook Handler          │
   │ → Verifies callback signature           │
   │ → Checks idempotency (Redis)            │
   │ → Updates transaction status            │
   └──────────────┬──────────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────────┐
   │ Java Spring Boot Update Service         │
   │ → Confirms contribution                 │
   │ → Updates member balance                │
   │ → Triggers notifications                │
   └──────────────┬──────────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────────┐
   │ PostgreSQL Database                     │
   │ → Updates members.balance               │
   │ → Inserts transaction record            │
   │ → Logs audit trail                      │
   └─────────────────────────────────────────┘
```

---

## 🔐 Security Architecture

### Authentication & Authorization
- **Frontend**: JWT tokens + HttpOnly cookies (C# Desktop: Windows Auth)
- **API Gateway**: Token validation + CORS enforcement
- **Backend Services**: Role-based access control (RBAC)
- **Database**: Row-level security (RLS) policies
- **M-Pesa Integration**: Encrypted credentials + signature verification

### Data Protection
- **In Transit**: TLS/SSL encryption
- **At Rest**: PostgreSQL encryption + sensitive field encryption
- **Secrets**: Environment variables (never in code)
- **Audit**: PostgreSQL audit trail + application logging

---

## 🚀 Deployment Architecture

### Production Topology

```
┌──────────────────────────────────────────────────────────────┐
│                    CDN (CloudFlare)                          │
│                  Static Assets Caching                       │
└────────────────────────┬─────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐     ┌──────────┐
   │ React   │      │ Desktop │     │ Mobile   │
   │ Web App │      │ Client  │     │ Web      │
   └────┬────┘      └────┬────┘     └────┬─────┘
        │                │              │
        └────────────────┼──────────────┘
                         │
              ┌──────────▼──────────┐
              │  API Gateway        │
              │  (C#/.NET - K8s)    │
              └──────────┬──────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌──────────┐  ┌──────────┐  ┌──────────────┐
   │ Java     │  │ Python   │  │ C# Services  │
   │ Services │  │ Services │  │              │
   │(Spring)  │  │(FastAPI) │  │              │
   └────┬─────┘  └────┬─────┘  └────┬─────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
            ┌─────────▼────────┐
            │ PostgreSQL       │
            │ (RDS/Primary)    │
            │                  │
            │ + Replicas       │
            └──────────────────┘
```

### Environment: Kubernetes (K8s) + Docker

- **Container Registry**: Docker Hub / GitHub Container Registry
- **Orchestration**: Kubernetes (EKS, GKE, or Minikube)
- **Database**: Managed PostgreSQL (AWS RDS / Azure Database)
- **Cache**: Redis for sessions & rate limiting
- **Message Queue**: RabbitMQ / Apache Kafka for async jobs
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Monitoring**: Prometheus + Grafana

---

## 🛠️ Development Workflow

### Local Development Setup

1. **Prerequisites**:
   ```bash
   # Node.js & npm/pnpm
   node --version
   pnpm --version
   
   # Java Development Kit
   java -version
   
   # Python
   python --version
   
   # .NET SDK
   dotnet --version
   
   # Docker
   docker --version
   ```

2. **Clone & Install**:
   ```bash
   git clone https://github.com/32sav/akiba.git
   cd akiba
   pnpm install
   ```

3. **Start Services** (Docker Compose):
   ```bash
   docker-compose up -d
   # Starts: PostgreSQL, Redis, RabbitMQ
   ```

4. **Run Each Service**:
   ```bash
   # Terminal 1: Frontend
   cd artifacts/akiba
   pnpm run dev
   
   # Terminal 2: C#/.NET Gateway
   cd artifacts/api-gateway
   dotnet watch run
   
   # Terminal 3: Java Services
   cd artifacts/java-services
   mvn spring-boot:run
   
   # Terminal 4: Python Services
   cd artifacts/python-services
   source venv/bin/activate
   uvicorn app.main:app --reload
   
   # Terminal 5: Desktop App (Windows)
   cd artifacts/desktop-app
   dotnet run
   ```

---

## 📊 Technology Matrix

| Aspect | Technology | Purpose |
|--------|-----------|---------|
| **Frontend UI** | HTML/CSS | Markup & styling |
| **Frontend Framework** | React + TypeScript | Web application |
| **Desktop App** | C#/.NET (WPF) | Native Windows client |
| **API Gateway** | C#/.NET Core | Request routing & orchestration |
| **Business Logic** | Java (Spring Boot) | Core domain services |
| **Data Processing** | Python (FastAPI) | Analytics & async jobs |
| **Database** | PostgreSQL | Relational data |
| **Caching** | Redis | Sessions & fast lookups |
| **Message Queue** | RabbitMQ/Kafka | Async task processing |
| **Authentication** | JWT + OAuth2 | Identity management |
| **Payment Gateway** | M-Pesa DaraJa API | Mobile money integration |
| **Containerization** | Docker | Application packaging |
| **Orchestration** | Kubernetes | Container management |
| **Monitoring** | Prometheus/Grafana | Observability |
| **Logging** | ELK Stack | Centralized logs |

---

## 📝 Contributing

Each language/framework has its own conventions:

- **TypeScript/React**: ESLint + Prettier, test with Jest
- **C#/.NET**: StyleCop + Resharper, test with xUnit
- **Java**: Checkstyle + SonarQube, test with JUnit 5
- **Python**: Black + Flake8, test with pytest

See `CONTRIBUTING.md` for detailed guidelines.

---

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated**: 2026-09-28  
**Maintainer**: Mark Kinyua (@32sav)
