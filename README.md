# Paaramparik — The Living Culture Map

Paaramparik is a community-driven guide to the living cultural heritage of Kerala. Explore festivals, performances, places, crafts, and traditions on an interactive map; learn their stories; and help keep the directory useful by contributing information for review.

The project combines a **Next.js web application**, **Supabase** for the main site’s accounts and cultural directory, and a separate **Express API** backed by PostgreSQL and Prisma for event discovery, contact verification, and moderation workflows.

## What you can do

- Explore cultural listings on a map or in a searchable, filterable directory.
- View listing stories, locations, dates, sources, and related experiences.
- Browse a featured Story of the Day.
- Create an account and manage your profile.
- Submit cultural experiences and track their moderation status.
- Review contributions and manage listings through administrator tools.
- Discover events through an API with combined filters for art form, event type, locality, date, cost, verification status, and distance.
- Report misinformation and verify organizer contact details.

The site includes a small bundled demonstration directory for browsing without Supabase. Demo records are clearly identified and should not be treated as independently verified cultural information.

## Technology

| Area | Technologies |
| --- | --- |
| Web application | Next.js 15 App Router, React 19, TypeScript |
| Styling and icons | Tailwind CSS, Lucide |
| Maps | Leaflet, React Leaflet, OpenStreetMap |
| Main site data and authentication | Supabase Auth, PostgreSQL, PostGIS, Storage, Row Level Security |
| Event API | Node.js, Express, TypeScript, Zod |
| API persistence | PostgreSQL, Prisma |
| API authentication and email | JWT, Nodemailer |
| Tests | Jest, Supertest |

## Repository layout

```text
app/                    Next.js routes (home, directory, listings, account, admin)
components/             Shared UI, forms, maps, listing cards, and admin tools
data/                   Bundled categories, demonstration listings, and relationships
hooks/                  Authentication and geolocation hooks
lib/                    Data access, filters, validation, and Supabase clients
public/                 Static assets, fonts, and images
scripts/                Data-generation utilities
supabase/
  migrations/           Main website database schema, policies, and functions
  seed.sql              Optional seed data for the main website database
backend/                Separate Express API, Prisma schema, migrations, and tests
types/                  Shared website TypeScript types
```

## Requirements

- Node.js 20 or newer (Node.js 22 recommended).
- npm.
- Supabase project credentials to use accounts, submissions, and administrative features.
- PostgreSQL if you want to run the separate Express API.

## Run the website locally

Install dependencies and start the Next.js development server:

```bash
npm ci
Copy-Item .env.local.example .env.local
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000). On macOS or Linux, copy the example environment file with:

```bash
cp .env.local.example .env.local
```

Without Supabase credentials, the public browsing experience uses bundled demonstration data. Account, contribution, and administration features require Supabase.

### Configure Supabase

1. Create a Supabase project.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` using the project URL and **public anon key** from the Supabase API settings.
3. Never put a Supabase service-role key in the Next.js application or commit credentials.
4. Run [`supabase/migrations/0001_schema.sql`](./supabase/migrations/0001_schema.sql) in the Supabase SQL Editor. It creates the website's tables, PostGIS location support, Row Level Security policies, moderation functions, and storage policies.
5. To load the bundled examples, optionally run `npm run seed:sql`, then run the generated [`supabase/seed.sql`](./supabase/seed.sql) in the SQL Editor.
6. Enable the Email provider in Supabase Auth.

To grant administrator access to a trusted account after it has signed up, run this query using that account's email:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'you@example.com';
```

Only trusted operators should be granted the administrator role.

### Website commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run typecheck` | Check website TypeScript types |
| `npm run build` | Create a production build of the website |
| `npm run start` | Serve the production build locally |
| `npm run seed:sql` | Regenerate `supabase/seed.sql` from `data/` |

## Run the event API locally

The API is a separate application with its own PostgreSQL/Prisma schema. Its database is **not** the same schema as the website's Supabase database.

1. Create a PostgreSQL database for the API.
2. Create `backend/.env` from `backend/.env.example` and set at least `DATABASE_URL` and a private `JWT_SECRET`.
3. Install and initialize the API:

```bash
npm ci --prefix backend
npm run backend:generate
npm run backend:push
npm run backend:seed
npm run backend:dev
```

The API listens on [http://localhost:4000](http://localhost:4000). The Next.js app proxies `/api/*` requests to `BACKEND_URL`; for local development it defaults to `http://localhost:4000/api`. If using another API address, set `BACKEND_URL` in `.env.local`, including the `/api` path.

### API routes

All API routes are prefixed with `/api`.

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Health check |
| `GET /api/events` | List published events |
| `GET /api/events/filter` | Filter and paginate events |
| `GET /api/events/filter-options` | Return available filter options |
| `GET /api/events/:id` | Retrieve an event |
| `POST /api/events` | Submit an event for moderation |
| `GET /api/events/my-submissions` | List the signed-in contributor’s submissions |
| `POST /api/auth/register` | Register an API account |
| `POST /api/auth/login` | Sign in and receive a JWT |
| `GET /api/auth/me` | Retrieve the signed-in API account |
| `POST /api/contact/send-otp` | Send a contact verification code |
| `POST /api/contact/verify-otp` | Verify a contact code |
| `GET /api/admin/events/pending` | List events awaiting administrator review |
| `GET /api/admin/reports` | List misinformation reports |

Additional event, report, and administration routes are defined under [`backend/src/routes/`](./backend/src/routes/). See [`backend/docs/API_DOCUMENTATION.md`](./backend/docs/API_DOCUMENTATION.md) for request and response details.

### API commands

| Command | Purpose |
| --- | --- |
| `npm run backend:dev` | Start the API in watch mode |
| `npm run backend:generate` | Generate the Prisma client |
| `npm run backend:push` | Apply the Prisma schema to a development database |
| `npm run backend:seed` | Seed the API database with example events |
| `npm run backend:test` | Run API unit and integration tests |
| `npm run backend:build` | Compile the API TypeScript |

The API's optional email verification requires a working SMTP provider. For local setup, see the comments in `backend/.env.example`. Never use test credentials or development fallback behavior for a public service.

## How moderation works

Contributions to the website are stored as pending submissions. An administrator reviews each submission and can approve it, request changes, or reject it. Website database policies and the `review_submission()` function enforce the review flow.

The Express API has its own event submission and moderation flow. API submissions are intended to remain pending until an administrator approves them. API accounts and Supabase website accounts are separate authentication systems.

## Trust and data notes

- Demonstration content is for discovery and development, not a substitute for checking authoritative local sources.
- Confirm dates, locations, access details, and contact information with the organizers before relying on them.
- Do not publish private contact details or images unless you have permission to do so.
- Keep secrets in local environment files or hosting-provider secret settings; never commit them.
- Do not use the Supabase service-role key in client-side code.

## Contributing

Bug reports, corrections, and improvements are welcome. For cultural information, include reliable sources and distinguish documented facts from local tradition or interpretation. For code changes, include a concise description and run the relevant type checks and tests.

## License

No license is currently specified in this repository. Contact the project maintainers before reusing or redistributing the project or its content.
