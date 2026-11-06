# Paaramparik

Community-driven cultural discovery map. Next.js 15 (App Router) · TypeScript · Tailwind · Leaflet/OpenStreetMap · Supabase (Auth, Postgres/PostGIS, Storage, RLS).

## 1. Install & run

Requires Node 18.18+ (Node 20+ recommended).

```bash
npm install          # installs everything in package.json
npm run dev          # http://localhost:3000
```

Dependencies: `next react react-dom @supabase/ssr @supabase/supabase-js leaflet react-leaflet lucide-react` and dev: `typescript tailwindcss@3 postcss autoprefixer @types/*`.

## 2. What works without Supabase (demo mode)
Browsing only: home, map, directory, search/filters, listing pages, connections, Story of the Day, using 15 **demonstration records** in `data/` (clearly badged "Demo record — not verified"). Login, signup, contribute, dashboard, profile and admin show a "needs Supabase" notice. Nothing is simulated.

## 3. Connect Supabase (enables everything)
1. Create a project at supabase.com. Copy `.env.local.example` to `.env.local`; add the project URL and **anon** key (Project Settings → API). Never add the service-role key.
2. SQL editor: run `supabase/migrations/0001_schema.sql` (tables, indexes, PostGIS, RLS, moderation function, storage bucket + policies).
3. Optional demo data: `npm run seed:sql` regenerates `supabase/seed.sql` from `data/*.json`; run it in the SQL editor.
4. Auth → Providers: enable Email. (For quick testing, disable "Confirm email".)
5. Make yourself admin: sign up in the app, then run
   `update public.profiles set role = 'admin' where email = 'you@example.com';`
6. Restart `npm run dev`.

## 4. Moderation flow
Contributor submits → `submissions` row (`pending_review`). Admin opens **/admin/submissions/[id]** → Approve / Request changes / Reject. Decisions go through the `review_submission()` SQL function, which checks `is_admin()`, writes the `reviews` history, and on approval creates the public `listing` (+ sources, media) with status `verified`. Contributors can never self-approve (RLS + trigger).

## 5. Design tokens (from the supplied palette)
`tailwind.config.ts`: `crimson` (950 #240006, 900 #5C0008, 800 #94000F, 600 #B5001A, 500 #DB0016), `saffron` (950 #241400, 900 #5C2400, 800 #8F3F00, 600 #B84A00, 500 #E06000), `plum` (950 #1A0014, 900 #4D0040, 800 #700050, 600 #8A0068, 500 #A8007A). Values were read by eye from the image, so adjust if you have the exact hex codes. `cream` (#F6EBDD) is the only added neutral, for text.

## 6. Structure
`app/` routes · `components/{map,listings,forms,admin}` · `lib/` (data, filters, validation, `supabase/`) · `hooks/` · `types/` · `data/` demo JSON · `supabase/` SQL.

## 7. Replacing demo data
Delete `data/listings.json` entries (or just use Supabase, which takes over automatically when configured). Add verified listings through the contribute + approve flow. Coordinates in demo data are approximate.

## 8. Known limits / assumptions
- Locality is Thrissur district, Kerala (change in `data/`); `district` field supports more regions.
- Filtering runs in the browser over the published set (fine for hundreds of listings). Move to SQL queries / PostGIS `ST_DWithin` before scaling.
- No cover photographs are bundled: cards show a plain palette block until a real image is uploaded. Add licensed images via Supabase Storage.
- Editing an already-approved listing by contributors is not built; admins edit directly.
- Email confirmation, password reset UI and notification emails are not implemented ("notify" is in-app via the dashboard).
- Demo source links are Wikipedia article URLs written from memory; open each and confirm before relying on them.
