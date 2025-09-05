# AMELIA-Mini ERP

A modern, scalable Enterprise Resource Planning (ERP) application built with Vertical Slice Architecture (VSA) principles. AMELIA-Mini provides comprehensive business management capabilities through modular design and cutting-edge technology.

## 🚀 Overview

AMELIA-Mini is designed as a full-featured ERP system that grows with your business. Built with modularity at its core, each business feature is self-contained with its own database schema, UI components, and business logic.

### Key Features

- **User Management** - Complete user lifecycle with role-based access control
- **Authentication & Authorization** - Secure login with JWT tokens and RLS policies
- **Role-Based Access Control (RBAC)** - Granular permissions system
- **Modular Architecture** - VSA design for maintainable and scalable code
- **Real-time Updates** - Live data synchronization with Supabase
- **Responsive Design** - Mobile-first UI with Tailwind CSS

## 🛠 Tech Stack

### Frontend & API
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **Row Level Security (RLS)** - Database-level security policies
- **Supabase Auth** - Built-in authentication system
- **Server Actions** - Type-safe server-side operations

### Deployment & Tools
- **Vercel** - Serverless deployment platform
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking

## 🏗 Architecture

AMELIA-Mini follows **Vertical Slice Architecture (VSA)** principles where each business feature is organized as a self-contained module:

```
app/
├── (modules)/           # Business modules with shared layout
│   ├── users/          # User Management module
│   ├── hr/             # HR module (planned)
│   └── finance/        # Finance module (planned)
├── auth/               # Authentication pages
├── api/                # API routes and endpoints
├── lib/                # Shared utilities and configurations
└── components/         # Reusable UI components
```

Each module contains:
- **Database Schema** - Tables, relationships, and RLS policies
- **Server Actions** - Business logic and CRUD operations
- **UI Components** - Forms, tables, and interactive elements
- **Type Definitions** - TypeScript interfaces and schemas

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Git for version control

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AMELIA-Mini.git
cd AMELIA-Mini
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project credentials from Settings > API
3. Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Database Setup

Run the database migrations to set up the schema:

```bash
# Push migrations to your Supabase project
npx supabase db push --db-url "postgresql://postgres.[YOUR-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Or use the connection string from your project
npx supabase db push
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run build:analyze    # Build with bundle analysis
npm run start            # Start production server
npm run lint             # Run ESLint

# Database Management (Supabase CLI required)
npx supabase db push     # Push migrations to remote database
npx supabase db pull     # Pull remote schema changes
npx supabase migration new <name>  # Create new migration

# Caching and Performance
npm run cache:clear      # Clear Next.js cache
npm run cache:stats      # View cache statistics
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

3. **Deploy**
   ```bash
   vercel --prod --yes
   ```

### Manual Deployment

```bash
# Build the application
npm run build

# Test the production build
npm start

# Deploy to your preferred platform
```

## 🔐 Security

- **Row Level Security (RLS)** - All database tables use RLS policies
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Permissions** - Granular access control
- **Environment Variables** - Sensitive data stored securely
- **Input Validation** - Zod schema validation on all inputs

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

See [docs/TESTING.md](docs/TESTING.md) for detailed testing guidelines.

## 📚 Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [Testing Guide](docs/TESTING.md) - Testing strategies and setup
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute
- [Architecture Documentation](ARCHITECTURE.md) - System design details

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code of conduct
- Development setup
- Pull request process
- Coding standards
- Testing requirements

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation** - Check our comprehensive docs
- **Issues** - Report bugs via GitHub Issues
- **Discussions** - Join community discussions
- **Email** - Contact the maintainers

## 🗺 Roadmap

### Current (Phase 3)
- ✅ User Management with RBAC
- ✅ Authentication & Authorization
- ✅ Core Infrastructure

### Upcoming
- 🚧 HR Module (Employee management, Leave tracking)
- 📋 POS Module (Point of Sale system)
- 📋 Inventory Management
- 📋 Finance Module (Accounting, Reporting)
- 📋 Advanced Reporting & Analytics

---

**AMELIA-Mini** - Modern ERP for the modern business.