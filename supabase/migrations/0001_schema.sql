-- Paaramparik — schema, RLS and moderation function.
-- Run in Supabase SQL editor (or `supabase db push`).
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ---------- tables ----------
create table public.profiles (          -- "users" in the spec; extends auth.users
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'user' check (role in ('user','contributor','admin')),
  profile_image text,
  created_at timestamptz not null default now()
);

create table public.categories (
  id text primary key,
  name text not null,
  description text,
  icon text
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  listing_type text not null check (listing_type in ('place','artist','event','performance','workshop','practice')),
  category_id text references public.categories(id),
  description text not null,
  cultural_background text,
  district text,
  location_name text,
  address text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location geography(Point,4326) generated always as (st_setsrid(st_makepoint(longitude, latitude),4326)::geography) stored,
  cover_image text,
  practitioner_name text,
  experience_type text check (experience_type in ('visit','attend','learn','meet')),
  contact_information jsonb not null default '{}',
  external_links jsonb not null default '[]',
  event_start date, event_end date, event_start_time time, event_end_time time,
  date_note text, venue text, participation_info text,
  verification_status text not null default 'unverified' check (verification_status in ('demo','unverified','under_review','verified')),
  is_visible boolean not null default true,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_location_gix on public.listings using gist (location);
create index listings_type_idx on public.listings (listing_type, category_id);
create index listings_district_idx on public.listings (district);
create index listings_event_start_idx on public.listings (event_start);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  listing_data jsonb not null,
  status text not null default 'pending_review' check (status in ('pending_review','approved','changes_requested','rejected')),
  admin_feedback text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index submissions_contributor_idx on public.submissions (contributor_id);
create index submissions_status_idx on public.submissions (status);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete cascade,
  source_name text not null,
  source_url text not null,
  source_type text,
  description text,
  created_at timestamptz not null default now(),
  check (listing_id is not null or submission_id is not null)
);
create index sources_listing_idx on public.sources (listing_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  decision text not null check (decision in ('approved','changes_requested','rejected')),
  comments text,
  created_at timestamptz not null default now()
);

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  source_listing_id uuid not null references public.listings(id) on delete cascade,
  related_listing_id uuid not null references public.listings(id) on delete cascade,
  relationship_type text not null,
  description text,
  unique (source_listing_id, related_listing_id, relationship_type),
  check (source_listing_id <> related_listing_id)
);
create index relationships_related_idx on public.relationships (related_listing_id);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete cascade,
  file_url text not null,
  media_type text not null default 'image',
  caption text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index media_listing_idx on public.media (listing_id);

-- ---------- helpers ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger listings_touch before update on public.listings for each row execute function public.touch_updated_at();
create trigger submissions_touch before update on public.submissions for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Stop users promoting themselves: only admins may change `role`.
create or replace function public.protect_role() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'only administrators can change roles';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_role();

-- ---------- moderation (the only way a submission becomes a public listing) ----------
create or replace function public.review_submission(p_submission_id uuid, p_decision text, p_comments text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.submissions%rowtype; d jsonb; lid uuid; v_slug text; el jsonb;
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  if p_decision not in ('approved','changes_requested','rejected') then raise exception 'invalid decision'; end if;
  select * into s from public.submissions where id = p_submission_id for update;
  if not found then raise exception 'submission not found'; end if;
  if p_decision <> 'approved' and coalesce(trim(p_comments),'') = '' then raise exception 'comments are required for this decision'; end if;

  lid := s.listing_id;
  if p_decision = 'approved' then
    d := s.listing_data;
    if lid is null then
      v_slug := trim(both '-' from regexp_replace(lower(d->>'title'), '[^a-z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);
      insert into public.listings (title, slug, listing_type, category_id, description, cultural_background, district, location_name, address,
        latitude, longitude, cover_image, practitioner_name, experience_type, contact_information, external_links,
        event_start, event_end, event_start_time, event_end_time, venue, participation_info,
        verification_status, is_visible, published_at, created_by)
      values (d->>'title', v_slug, d->>'listing_type', nullif(d->>'category_id',''), d->>'description', nullif(d->>'cultural_background',''),
        nullif(d->>'district',''), nullif(d->>'location_name',''), nullif(d->>'address',''),
        (d->>'latitude')::float8, (d->>'longitude')::float8, d->'images'->>0, nullif(d->>'practitioner_name',''), nullif(d->>'experience_type',''),
        coalesce(d->'contact_information','{}'), coalesce(d->'external_links','[]'),
        nullif(d->>'event_start','')::date, nullif(d->>'event_end','')::date, nullif(d->>'event_start_time','')::time, nullif(d->>'event_end_time','')::time,
        nullif(d->>'venue',''), nullif(d->>'participation_info',''),
        'verified', true, now(), s.contributor_id)
      returning id into lid;
    else
      update public.listings set title = d->>'title', description = d->>'description', cultural_background = nullif(d->>'cultural_background',''),
        practitioner_name = nullif(d->>'practitioner_name',''), contact_information = coalesce(d->'contact_information','{}'),
        external_links = coalesce(d->'external_links','[]'), verification_status = 'verified' where id = lid;
    end if;
    delete from public.sources where listing_id = lid;
    for el in select * from jsonb_array_elements(coalesce(d->'sources','[]')) loop
      insert into public.sources (listing_id, submission_id, source_name, source_url, source_type, description)
      values (lid, s.id, el->>'source_name', el->>'source_url', el->>'source_type', el->>'description');
    end loop;
    for el in select * from jsonb_array_elements(coalesce(d->'images','[]')) loop
      insert into public.media (listing_id, submission_id, file_url, media_type, uploaded_by)
      values (lid, s.id, el #>> '{}', 'image', s.contributor_id);
    end loop;
  end if;

  update public.submissions set status = p_decision, admin_feedback = p_comments, reviewed_by = auth.uid(), reviewed_at = now(), listing_id = lid
  where id = p_submission_id;
  insert into public.reviews (submission_id, admin_id, decision, comments) values (p_submission_id, auth.uid(), p_decision, p_comments);
  return lid;
end $$;
revoke all on function public.review_submission(uuid, text, text) from public, anon;
grant execute on function public.review_submission(uuid, text, text) to authenticated;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.submissions enable row level security;
alter table public.sources enable row level security;
alter table public.reviews enable row level security;
alter table public.relationships enable row level security;
alter table public.media enable row level security;

-- profiles: private. Own row, or admin.
create policy "profiles read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin update" on public.profiles for update using (public.is_admin());

-- categories: public read, admin write.
create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- listings: public sees only published + visible. Admin manages all.
create policy "listings public read" on public.listings for select using (published_at is not null and is_visible);
create policy "listings admin all" on public.listings for all using (public.is_admin()) with check (public.is_admin());

-- submissions: contributors manage their own; they cannot self-approve (status stays pending on insert/update).
create policy "submissions read own" on public.submissions for select using (contributor_id = auth.uid());
create policy "submissions admin read" on public.submissions for select using (public.is_admin());
create policy "submissions insert own" on public.submissions for insert with check (contributor_id = auth.uid() and status = 'pending_review' and reviewed_by is null);
create policy "submissions update own" on public.submissions for update
  using (contributor_id = auth.uid() and status in ('pending_review','changes_requested'))
  with check (contributor_id = auth.uid() and status = 'pending_review');

-- Contributors may only change listing_data/status; moderation columns are admin-only.
create or replace function public.protect_submission_fields() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and (new.reviewed_by is distinct from old.reviewed_by or new.reviewed_at is distinct from old.reviewed_at
     or new.admin_feedback is distinct from old.admin_feedback or new.listing_id is distinct from old.listing_id or new.contributor_id is distinct from old.contributor_id) then
    raise exception 'moderation fields can only be changed by administrators';
  end if;
  return new;
end $$;
create trigger submissions_protect before update on public.submissions for each row execute function public.protect_submission_fields();

-- sources / media / relationships: readable when their listing is public.
create policy "sources public read" on public.sources for select
  using (exists (select 1 from public.listings l where l.id = listing_id and l.published_at is not null and l.is_visible));
create policy "sources admin all" on public.sources for all using (public.is_admin()) with check (public.is_admin());
create policy "media public read" on public.media for select
  using (exists (select 1 from public.listings l where l.id = listing_id and l.published_at is not null and l.is_visible));
create policy "media read own" on public.media for select using (uploaded_by = auth.uid());
create policy "media insert own" on public.media for insert with check (uploaded_by = auth.uid());
create policy "media admin all" on public.media for all using (public.is_admin()) with check (public.is_admin());
create policy "relationships public read" on public.relationships for select
  using (exists (select 1 from public.listings l where l.id = source_listing_id and l.published_at is not null and l.is_visible)
     and exists (select 1 from public.listings l where l.id = related_listing_id and l.published_at is not null and l.is_visible));
create policy "relationships admin all" on public.relationships for all using (public.is_admin()) with check (public.is_admin());

-- reviews: contributors read decisions about their own submissions; admins read all. Inserts happen only inside review_submission().
create policy "reviews read own" on public.reviews for select
  using (exists (select 1 from public.submissions s where s.id = submission_id and s.contributor_id = auth.uid()));
create policy "reviews admin read" on public.reviews for select using (public.is_admin());

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('listing-media', 'listing-media', true) on conflict do nothing;
create policy "listing-media public read" on storage.objects for select using (bucket_id = 'listing-media');
create policy "listing-media upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "listing-media delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-media' and (storage.foldername(name))[1] = auth.uid()::text);
