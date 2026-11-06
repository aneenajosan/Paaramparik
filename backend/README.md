# Paaramparik — Backend Service

A high-performance REST API service for cultural event discovery and multi-criteria filtering, built with **Node.js**, **Express.js**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, and **Zod**.

---

## 🏛️ Features

- **Multi-Criteria Cultural Filtering**: Simultaneous `AND` filtering across:
  - **Art Forms**: Music, Dance, Theatre, Visual Arts, Crafts, Literature, Traditional Ritual Arts.
  - **Locations**: Locality, Neighborhood, and geographical radius around latitude/longitude in km.
  - **Dates**: Today, Upcoming (excluding expired events), Custom Single Date, Date Range.
  - **Experience Types**: Festival, Workshop, Performance, Exhibition, Cultural Gathering, Heritage Event.
  - **Cost Models**: Free, Paid, Unknown.
  - **Verification Statuses**: Verified, Community Submitted, Pending Verification.
- **Geographical Distance**: Great-circle Haversine formula calculation executed in SQL / geo-pipeline.
- **Strict Validation**: Zod schemas validating all query parameters with user-friendly error messages.
- **SQL Injection Prevention**: Parameterized queries via Prisma and tagged SQL templates.
- **Pagination & Sorting**: Robust pagination metadata (`page`, `limit`, `total`, `totalPages`) and multi-mode sorting (date, relevance, distance, title).
- **JWT Authentication**: Protected endpoints for contributor and administrative workflows.
- **Comprehensive Test Suite**: Unit and integration test suite with Supertest and Jest.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.18+ (Node 20+ or Node 25 recommended)
- **PostgreSQL**: PostgreSQL 14+ instance running locally, via Docker, or on cloud (e.g., Supabase / Neon / Railway).

### 2. Installation
Navigate to the `backend/` directory:
```bash
cd backend
npm install
```
*(Or from the project root: `npm run backend:build`)*

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/living_culture_map?schema=public"
JWT_SECRET="your-secure-jwt-secret-key"
PORT=4000
```

### 4. Database Setup & Seed
Push the Prisma schema to PostgreSQL and populate authentic sample events:
```bash
# Push schema to database
npm run prisma:push

# Run seed data script (seeds events in Kunnamkulam, Thrissur, etc.)
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
The server will start at: **`http://localhost:4000`**

- **Health check**: `http://localhost:4000/api/health`
- **Filter endpoint**: `http://localhost:4000/api/events/filter`
- **Filter options**: `http://localhost:4000/api/events/filter-options`

---

## 🧪 Running Tests

Run the test suite:
```bash
npm test
```

Run test suite with coverage report:
```bash
npm run test:coverage
```

All 39 unit and integration tests run in-memory without requiring an external database.

---

## 📚 API Endpoints Summary

| Method | Endpoint | Description | Public / Auth |
|---|---|---|---|
| `GET` | `/api/health` | Service health status | Public |
| `GET` | `/api/events` | Fetch all published events | Public |
| `GET` | `/api/events/filter` | Multi-criteria event filtering | Public |
| `GET` | `/api/events/filter-options` | Dynamic categories & localities | Public |
| `GET` | `/api/events/:id` | Event details by ID | Public |
| `POST`| `/api/auth/register` | Register user account | Public |
| `POST`| `/api/auth/login` | Login and receive JWT | Public |
| `GET` | `/api/auth/me` | Current user profile | Bearer Token |

For detailed API request / response specifications, refer to:
👉 [API Documentation](./docs/API_DOCUMENTATION.md)

---

## 📮 Postman Collection

Import the included collection into Postman:
👉 [Postman Collection](./docs/postman_collection.json)

---

## 📁 Project Architecture

```
backend/
├── prisma/
│   ├── schema.prisma              # Prisma PostgreSQL schema
│   ├── seed.ts                    # Database seeder with authentic events
│   └── migrations/
│       └── 20261105000000_init/
│           └── migration.sql      # Raw SQL migration with indexes & enums
├── src/
│   ├── config/
│   │   ├── env.ts                 # Environment variable validation
│   │   └── database.ts            # Prisma client singleton
│   ├── controllers/
│   │   ├── event.controller.ts    # Event endpoints controller
│   │   └── auth.controller.ts     # Auth endpoints controller
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # JWT & role-based access guards
│   │   ├── error.middleware.ts    # Global error & 404 handlers
│   │   └── validate.middleware.ts # Zod query / body validator
│   ├── routes/
│   │   ├── event.routes.ts        # /api/events routes
│   │   ├── auth.routes.ts         # /api/auth routes
│   │   └── index.ts               # Express router aggregator
│   ├── services/
│   │   ├── event.service.ts       # Core filtering & database querying
│   │   └── auth.service.ts        # Authentication business logic
│   ├── types/
│   │   ├── event.types.ts         # TypeScript interfaces & DTOs
│   │   └── express.d.ts           # Express Request user augmentation
│   ├── utils/
│   │   ├── api-response.ts        # Standardized JSON response helpers
│   │   ├── formatters.ts          # Enum <-> display label mappings
│   │   └── geo.ts                 # Haversine distance & bounding box
│   ├── app.ts                     # Express app configuration
│   └── server.ts                  # Server entrypoint
├── tests/
│   ├── unit/
│   │   ├── event.service.test.ts  # Filtering logic & criteria tests
│   │   └── geo.test.ts            # Haversine & geo bounding box tests
│   ├── integration/
│   │   ├── event-api.test.ts      # Supertest HTTP integration tests
│   │   └── auth.test.ts           # Authentication & security tests
│   └── setup.ts                   # Jest test harness setup
├── docs/
│   ├── API_DOCUMENTATION.md       # Comprehensive API documentation
│   └── postman_collection.json    # Postman v2.1 collection
├── .env.example
├── jest.config.js
├── package.json
└── tsconfig.json
```

