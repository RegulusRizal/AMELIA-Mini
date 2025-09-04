# AMELIA-Mini VSA-ERP Architecture Document

## Executive Summary

AMELIA-Mini is an Enterprise Resource Planning (ERP) application built using Vertical Slice Architecture (VSA) principles with a modern serverless stack (Next.js + Supabase + Vercel). This architecture promotes modularity, maintainability, and scalability by organizing code around business features rather than technical layers.

## Current Implementation Status

### ✅ Completed
- **Basic Authentication System**: Login/signup with Supabase Auth
- **Protected Routes**: Middleware-based route protection  
- **Dashboard**: Basic authenticated user dashboard
- **Supabase Integration**: Client/server setup with SSR support
- **Project Structure**: Next.js App Router with TypeScript

### 🚧 In Progress
- **User Management Module**: Extending auth to full user management
- **Database Schema**: Creating tables for profiles, roles, permissions

### 📋 Planned
- **Human Resources Module**: Complete HR management system
- **Real-time Features**: Live updates using Supabase subscriptions
- **File Storage**: Document management with Supabase Storage
- **Advanced RBAC**: Role-based access control with RLS policies

## Immediate Next Steps

### Step 1: Set Up Database Schema (Day 1)
```sql
-- Run in Supabase SQL Editor
-- 1. Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policy
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);
```

### Step 2: Install UI Components (Day 1)
```bash
# Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card table form input
```

### Step 3: Create User Management Pages (Day 2-3)
- `/app/(modules)/users/page.tsx` - User list
- `/app/(modules)/users/[id]/page.tsx` - User detail/edit
- `/app/(modules)/profile/page.tsx` - Current user profile

### Step 4: Implement RBAC (Day 4-5)
- Create roles and permissions tables
- Set up RLS policies for role-based access
- Add role management UI

## 1. Architecture Overview

### 1.1 What is Serverless?

**Serverless** means you don't manage servers - the cloud provider (Vercel/Supabase) handles all infrastructure for you:

**How It Works in Your Stack:**
1. **Vercel (Frontend/API)**: 
   - Your Next.js code is deployed as **functions** that run on-demand
   - When someone visits your site, Vercel spins up your code instantly
   - After the request, the function shuts down (you only pay for actual usage)
   - No servers to maintain, update, or scale

2. **Supabase (Backend)**:
   - Database, auth, and storage are fully managed services
   - Supabase handles all PostgreSQL maintenance, backups, scaling
   - You just use their APIs - no server configuration needed

**Traditional vs Serverless:**
- **Traditional**: You rent a server (like EC2), install software, manage updates, handle scaling
- **Serverless**: You write code, deploy it, and the platform handles everything else

**Benefits for AMELIA-Mini:**
- ✅ **No DevOps**: No Docker, Kubernetes, or server management
- ✅ **Auto-scaling**: Handles 1 or 1,000,000 users automatically
- ✅ **Cost-effective**: Pay only when your code runs
- ✅ **Focus on features**: Write business logic, not infrastructure code

### Is Serverless Good for ERP Systems?

**YES, for Small-to-Medium ERP like AMELIA-Mini:**

**Advantages:**
- ✅ **Perfect for Variable Load**: ERP usage peaks during work hours, serverless scales automatically
- ✅ **Cost-Effective**: Most SMBs don't need 24/7 server capacity
- ✅ **Rapid Development**: Launch features faster without infrastructure overhead
- ✅ **Global Performance**: Vercel Edge Network serves users worldwide
- ✅ **Reliable**: 99.99% uptime with Vercel + Supabase SLAs
- ✅ **Real-time Ready**: Supabase Realtime perfect for live dashboards

**Potential Concerns & Solutions:**
- ❓ **Cold Starts**: First request might take 1-2 seconds
  - ✅ Solution: Vercel keeps functions warm for active apps
  
- ❓ **Complex Transactions**: Long-running processes (like payroll)
  - ✅ Solution: Use Supabase Edge Functions (up to 150s timeout)
  
- ❓ **Data Sovereignty**: Some companies need on-premise data
  - ✅ Solution: Supabase offers self-hosted option if needed later

- ❓ **Vendor Lock-in**: Tied to Vercel/Supabase
  - ✅ Solution: Next.js and PostgreSQL are portable if you need to migrate

**When Traditional Servers Are Better:**
- ❌ Enterprise with 10,000+ concurrent users
- ❌ Heavy computational work (AI/ML processing)
- ❌ Strict compliance requiring on-premise deployment
- ❌ Legacy system integrations requiring specific protocols

**For AMELIA-Mini**: Serverless is IDEAL because:
- Target: Small-to-medium businesses
- Users: 10-500 employees per company
- Load: Predictable business hours usage
- Features: Standard ERP operations (CRUD, reports, workflows)

### 1.2 Vertical Slice Architecture Principles

VSA organizes the application into self-contained feature slices where each slice includes:
- **Presentation Layer** (React components, pages)
- **Business Logic Layer** (Server actions, API routes)
- **Data Access Layer** (Supabase queries)
- **Infrastructure Concerns** (Already handled by Vercel/Supabase)

Each module/slice is independent and contains all layers necessary to fulfill its business function.

### 1.3 Core Design Principles

1. **Feature-Centric Organization**: Code organized by business features, not technical layers
2. **Minimal Cross-Slice Dependencies**: Each slice should be as independent as possible
3. **CQRS Pattern**: Separate read and write operations for optimal performance
4. **Event-Driven Communication**: Modules communicate via domain events
5. **Database per Module**: Each module owns its data schema
6. **API-First Design**: RESTful APIs with OpenAPI documentation
7. **Security by Design**: Authentication, authorization, and audit built-in

## 2. Technology Stack

### 2.1 Core Platform Stack

**Backend-as-a-Service:**
- **Platform**: Supabase
- **Database**: PostgreSQL (Supabase managed)
- **Authentication**: Supabase Auth (JWT-based)
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for files
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **Row Level Security**: PostgreSQL RLS policies

**Frontend & API:**
- **Framework**: Next.js 14+ with TypeScript (App Router)
- **Deployment**: Vercel (serverless/edge)
- **API Routes**: Next.js API Routes (Edge Runtime)
- **UI Library**: React 18+
- **State Management**: Zustand
- **Styling**: Tailwind CSS + shadcn/ui
- **Form Handling**: React Hook Form + Zod
- **Data Fetching**: @supabase/ssr + TanStack Query

**Infrastructure:**
- **Hosting**: Vercel (Frontend + API Routes)
- **Database**: Supabase (Managed PostgreSQL)
- **CDN**: Vercel Edge Network
- **CI/CD**: Vercel Deploy + GitHub Actions
- **Monitoring**: Vercel Analytics + Supabase Dashboard
- **Logging**: Vercel Logs + Supabase Logs

## 3. Module Architecture

### 3.1 Module Structure (Simplified for Serverless)

Each module in AMELIA-Mini follows this structure:

```
# Module folder structure
lib/modules/[module-name]/
├── types.ts              # TypeScript interfaces & types
├── schemas.ts            # Zod validation schemas  
├── actions.ts            # Server actions for mutations
├── queries.ts            # Data fetching functions
└── hooks.ts             # React hooks for client-side

app/(modules)/[module-name]/
├── page.tsx             # Main module page
├── [id]/page.tsx        # Detail/edit pages
└── components/          # Module-specific components

app/api/[module-name]/
└── route.ts             # REST API endpoints (if needed)

supabase/migrations/
└── [timestamp]_[module-name].sql  # Database schema
```

### 3.2 Cross-Cutting Concerns

```
lib/
├── shared/
│   ├── auth/                   # Supabase Auth helpers
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── database/               # Database utilities
│   │   ├── client.ts          # Supabase client
│   │   └── types.ts           # Generated types
│   ├── utils/
│   │   ├── constants.ts
│   │   └── helpers.ts
│   └── ui/                     # Shared components
│       └── components/

middleware.ts                    # Next.js middleware for auth
```

## 4. Module Definitions

### 4.1 User Management Module

**Purpose**: Handle user authentication, authorization, and profile management using Supabase Auth

**Core Features:**
- User registration and onboarding (Supabase Auth)
- Authentication (magic link, OAuth, email/password)
- Password management (Supabase Auth built-in)
- Role-based access control (RBAC via RLS policies)
- User profile management
- Session management (Supabase Auth sessions)
- Audit logging

**Database Schema (Supabase):**
```sql
-- Leverages Supabase auth.users table
-- Additional profile data in public schema

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

**Next.js API Routes:**
```
# Supabase Auth handles these automatically:
# - Registration (supabase.auth.signUp)
# - Login (supabase.auth.signInWithPassword)
# - Logout (supabase.auth.signOut)
# - Password reset (supabase.auth.resetPasswordForEmail)

# Custom API routes:
GET    /api/users                    # List users (admin)
GET    /api/users/[id]/route.ts      # Get user details
PUT    /api/users/[id]/route.ts      # Update user
DELETE /api/users/[id]/route.ts      # Delete user (admin)

GET    /api/profile/route.ts         # Get current user profile
PUT    /api/profile/route.ts         # Update current user profile

GET    /api/roles/route.ts           # List roles
POST   /api/roles/route.ts           # Create role (admin)
PUT    /api/roles/[id]/route.ts      # Update role (admin)
DELETE /api/roles/[id]/route.ts      # Delete role (admin)

POST   /api/roles/[id]/assign/route.ts   # Assign role to user
DELETE /api/roles/[id]/revoke/route.ts   # Revoke role from user
```

**Supabase Realtime Events:**
- `profiles` table changes (INSERT, UPDATE, DELETE)
- `user_roles` table changes (INSERT, DELETE)
- Auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)

### 4.2 Human Resources Module

**Purpose**: Manage employee information, organizational structure, and HR processes

**Core Features:**
- Employee information management
- Department & team structure
- Position & job title management
- Employee onboarding/offboarding
- Leave management
- Attendance tracking
- Performance reviews
- Training records
- Document management

**Database Schema (Supabase):**
```sql
-- Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  position_id UUID REFERENCES public.positions(id),
  manager_id UUID REFERENCES public.employees(id),
  hire_date DATE NOT NULL,
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern')),
  contract_end_date DATE,
  salary DECIMAL(10, 2),
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  address JSONB DEFAULT '{}',
  emergency_contacts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  manager_id UUID REFERENCES public.employees(id),
  parent_department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions table
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  level TEXT,
  department_id UUID REFERENCES public.departments(id),
  responsibilities TEXT[],
  requirements TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  overtime_hours DECIMAL(4, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('present', 'absent', 'late', 'half-day', 'holiday', 'weekend')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Performance reviews table
CREATE TABLE public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.employees(id),
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  goals JSONB DEFAULT '[]',
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee documents table
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
```

**Next.js API Routes:**
```
# Employee Management
GET    /api/hr/employees/route.ts
POST   /api/hr/employees/route.ts
GET    /api/hr/employees/[id]/route.ts
PUT    /api/hr/employees/[id]/route.ts
DELETE /api/hr/employees/[id]/route.ts

# Department Management
GET    /api/hr/departments/route.ts
POST   /api/hr/departments/route.ts
GET    /api/hr/departments/[id]/route.ts
PUT    /api/hr/departments/[id]/route.ts
DELETE /api/hr/departments/[id]/route.ts

# Leave Management
GET    /api/hr/leaves/route.ts
POST   /api/hr/leaves/route.ts
GET    /api/hr/leaves/[id]/route.ts
PUT    /api/hr/leaves/[id]/route.ts
POST   /api/hr/leaves/[id]/approve/route.ts
POST   /api/hr/leaves/[id]/reject/route.ts

# Attendance
POST   /api/hr/attendance/check-in/route.ts
POST   /api/hr/attendance/check-out/route.ts
GET    /api/hr/attendance/[employeeId]/route.ts
GET    /api/hr/attendance/reports/route.ts

# Performance Reviews
GET    /api/hr/reviews/route.ts
POST   /api/hr/reviews/route.ts
GET    /api/hr/reviews/[id]/route.ts
PUT    /api/hr/reviews/[id]/route.ts
```

**Supabase Realtime Events:**
- `employees` table changes (INSERT, UPDATE, DELETE)
- `departments` table changes (INSERT, UPDATE, DELETE)
- `leave_requests` table changes (INSERT, UPDATE)
- `attendance` table changes (INSERT, UPDATE)
- `performance_reviews` table changes (INSERT, UPDATE)

### 4.3 Future Modules (Placeholders)

#### Point of Sale (POS) Module
**Purpose**: Handle retail transactions and payment processing
- *To be defined*

#### Inventory Management Module
**Purpose**: Track and manage product inventory
- *To be defined*

#### Financial Management Module
**Purpose**: Manage accounting, budgeting, and financial reporting
- *To be defined*

#### Customer Relationship Management (CRM) Module
**Purpose**: Manage customer interactions and relationships
- *To be defined*

#### Supply Chain Management Module
**Purpose**: Manage suppliers, procurement, and logistics
- *To be defined*

## 5. Integration Patterns

### 5.1 Inter-Module Communication

**Server-Side Communication (Next.js):**
- Direct database queries via Supabase client
- Server Actions for mutations
- API Routes for external integrations
- Edge Functions for complex business logic

**Real-time Communication (Supabase):**
- Supabase Realtime for live updates
- PostgreSQL LISTEN/NOTIFY for events
- Row-level subscriptions for data changes
- Presence for online status

### 5.2 Event Architecture (Supabase)

```typescript
// Supabase Realtime Subscription
interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  new_record?: Record<string, any>;
  old_record?: Record<string, any>;
  commit_timestamp: string;
}

// Custom events via Edge Functions
interface CustomEvent {
  eventType: string;
  aggregateId: string;
  payload: any;
  userId: string;
  timestamp: string;
}
```

### 5.3 API Architecture (Next.js + Vercel)

- Next.js App Router for routing
- API Routes for RESTful endpoints
- Server Actions for form submissions
- Edge Runtime for global performance
- Vercel Edge Config for feature flags
- Automatic API versioning via paths

## 6. Database Design (Supabase PostgreSQL)

### 6.1 Database Strategy

- **Schema per Module**: Each module has its own schema in Supabase
- **Shared Auth Schema**: Leverage Supabase auth.users
- **Views & Functions**: PostgreSQL views for complex queries
- **RLS Policies**: Row-level security for data isolation

### 6.2 Data Consistency

- **ACID Transactions**: PostgreSQL native support
- **Foreign Key Constraints**: Referential integrity
- **Database Functions**: Complex business logic in PostgreSQL
- **Triggers**: Automatic data synchronization

## 7. Security Architecture

### 7.1 Authentication (Supabase Auth)

- JWT-based authentication (Supabase managed)
- Automatic refresh token rotation
- Multi-factor authentication (TOTP)
- OAuth providers (Google, GitHub, etc.)
- Magic links & OTP support
- Session management

### 7.2 Authorization (RLS Policies)

- Row Level Security (PostgreSQL RLS)
- Role-based policies
- User-based data isolation
- Service role for admin operations
- API key management (Supabase)

### 7.3 Data Protection

- Encryption at rest (Supabase managed)
- TLS encryption in transit
- Secrets management (Vercel env vars)
- PII column encryption
- Audit trails via database triggers

## 8. Deployment Architecture

### 8.1 Vercel Deployment

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/*/route.ts": {
      "runtime": "edge",
      "maxDuration": 30
    }
  },
  "env": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_KEY"
  ]
}
```

### 8.2 Scalability (Vercel + Supabase)

- **Automatic Scaling**: Vercel serverless functions
- **Edge Network**: Global CDN via Vercel
- **Database Pooling**: Supabase connection pooler
- **Edge Caching**: Vercel Edge Cache
- **Database Scaling**: Supabase auto-scaling
- **Rate Limiting**: Vercel Edge Middleware

## 9. Development Workflow

### 9.1 Project Structure (Actual)

```
AMELIA-Mini/
├── app/                      # Next.js App Router
│   ├── auth/                # Auth routes
│   │   └── login/          # Login page
│   ├── dashboard/          # Protected dashboard
│   ├── api/                # API routes
│   │   ├── auth/          # Auth endpoints
│   │   └── [modules]/     # Future module APIs
│   └── layout.tsx
├── lib/                     # Core libraries
│   ├── supabase/           # Supabase clients
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client
│   │   └── auth.ts        # Auth helpers
│   └── modules/            # Module logic (to be created)
│       ├── user-management/
│       └── human-resources/
├── components/             # React components (to be created)
│   ├── ui/                # shadcn/ui components
│   └── modules/           # Module-specific components
├── supabase/              # Database (to be created)
│   ├── migrations/        # SQL migrations
│   └── functions/         # Edge Functions
├── public/                # Static assets
├── middleware.ts          # Auth middleware
└── .env.local            # Environment variables
```

### 9.2 Development Practices

- **Monorepo**: Next.js app with modular structure
- **Code Quality**: ESLint, Prettier, Husky
- **Type Safety**: TypeScript strict mode
- **Testing**: Vitest, React Testing Library, Playwright
- **Documentation**: TypeDoc, README files
- **Version Control**: Git with feature branches
- **CI/CD**: Vercel automatic deployments

## 10. Testing Strategy

### 10.1 Test Pyramid

1. **Unit Tests** (70%)
   - Domain logic
   - Business rules
   - Utility functions

2. **Integration Tests** (20%)
   - API endpoints
   - Database operations
   - External service integration

3. **E2E Tests** (10%)
   - Critical user journeys
   - Cross-module workflows

### 10.2 Test Infrastructure

- Vitest for unit testing
- React Testing Library for components
- Playwright for E2E testing
- Supabase test instances
- MSW for API mocking

## 11. Monitoring & Observability

### 11.1 Metrics

- **Vercel Analytics**: Web Vitals, performance metrics
- **Supabase Dashboard**: Database metrics, API usage
- **Custom Metrics**: Business KPIs via Supabase functions

### 11.2 Logging

- **Vercel Logs**: Function logs, build logs
- **Supabase Logs**: Database queries, auth events
- **Browser Console**: Client-side errors

### 11.3 Monitoring

- **Vercel Monitoring**: Real-time performance
- **Supabase Monitoring**: Database health, API status
- **Sentry**: Error tracking and alerting

## 12. Performance Considerations

### 12.1 Optimization Strategies

- **Database**: PostgreSQL indexes, query optimization
- **API**: Edge Runtime for faster responses
- **Caching**: Vercel Edge Cache, React Query
- **Loading**: Next.js streaming, Suspense boundaries
- **Images**: Next.js Image optimization
- **Bundle**: Code splitting, tree shaking

### 12.2 Performance Targets

- API response time: < 200ms (p95)
- Page load time: < 3s
- Database query time: < 100ms
- Availability: 99.9%

## 13. Implementation Roadmap

### ✅ Phase 0: Foundation (COMPLETED)
- Next.js project with TypeScript
- Supabase Auth integration
- Basic login/signup functionality
- Protected routes with middleware
- Basic dashboard
- Vercel deployment ready

### 🚧 Phase 1: User Management Module (Current - Week 1-2)
**Immediate Tasks:**
1. **Database Schema**
   - Create profiles table with user details
   - Create roles and permissions tables
   - Set up user_roles junction table
   - Implement RLS policies for data security

2. **UI Components**
   - Install and configure shadcn/ui
   - Create user profile form
   - Build user list table with search/filter
   - Add role management interface

3. **API Routes**
   - `/api/users` - CRUD operations
   - `/api/profile` - Profile management
   - `/api/roles` - Role management

### 📋 Phase 2: Human Resources Module (Weeks 3-5)
1. **Database Schema**
   - Employees, departments, positions tables
   - Leave requests and attendance tables
   - Performance reviews table
   
2. **Core Features**
   - Employee directory
   - Department management
   - Leave request workflow
   - Basic attendance tracking

3. **Dashboard**
   - HR overview with statistics
   - Employee quick actions
   - Pending approvals widget

### 📋 Phase 3: Advanced Features (Weeks 6-7)
1. **Real-time Updates**
   - Supabase Realtime for notifications
   - Live attendance status
   - Instant leave request updates

2. **File Management**
   - Employee document uploads
   - Supabase Storage integration
   - Document categorization

3. **Reporting**
   - Employee reports
   - Attendance reports
   - Leave balance reports

### 📋 Phase 4: Production Polish (Week 8)
1. **Performance**
   - Query optimization
   - Caching strategies
   - Image optimization

2. **Security**
   - Comprehensive RLS policies
   - Input validation
   - Rate limiting

3. **Testing & Documentation**
   - Unit tests for critical functions
   - E2E tests for main flows
   - User documentation

### Phase 5: Future Modules (TBD)
- POS Module
- Inventory Management
- Financial Management
- CRM Module
- Supply Chain Management

## 14. Risk Mitigation

### Technical Risks
- **Complexity**: Mitigate with clear boundaries and documentation
- **Performance**: Regular profiling and optimization
- **Security**: Security audits and penetration testing
- **Data Consistency**: Implement saga pattern for distributed transactions

### Operational Risks
- **Scalability**: Design for horizontal scaling from start
- **Maintenance**: Comprehensive documentation and testing
- **Vendor Lock-in**: Use abstraction layers for external services

## 15. Success Criteria

- Modular architecture with clear boundaries
- 80%+ test coverage
- < 200ms API response time (p95)
- Zero-downtime deployments
- Comprehensive API documentation
- Audit trail for all critical operations

## Appendix A: Technology Decision Records

### ADR-001: Vertical Slice Architecture
**Status**: Accepted
**Context**: Need for maintainable, scalable ERP system
**Decision**: Use VSA to organize code by features
**Consequences**: Better modularity, potential code duplication

### ADR-002: TypeScript
**Status**: Accepted
**Context**: Need for type safety and better developer experience
**Decision**: Use TypeScript for both frontend and backend
**Consequences**: Compile step required, better IDE support

### ADR-003: Supabase + Vercel
**Status**: Accepted
**Context**: Need for rapid development with managed infrastructure
**Decision**: Use Supabase for backend and Vercel for hosting
**Consequences**: Faster development, vendor lock-in considerations

### ADR-004: PostgreSQL via Supabase
**Status**: Accepted
**Context**: Need for reliable, ACID-compliant database
**Decision**: Use Supabase's managed PostgreSQL
**Consequences**: Strong consistency, automatic backups, scaling handled

## Appendix B: Glossary

- **VSA**: Vertical Slice Architecture
- **CQRS**: Command Query Responsibility Segregation
- **DDD**: Domain-Driven Design
- **RBAC**: Role-Based Access Control
- **JWT**: JSON Web Token
- **DTO**: Data Transfer Object
- **ACID**: Atomicity, Consistency, Isolation, Durability

---

*Document Version: 2.0 - Serverless Edition*
*Last Updated: September 4, 2025*
*Status: Implementation Ready*