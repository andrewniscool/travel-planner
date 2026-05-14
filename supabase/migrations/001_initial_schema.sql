-- Travel Builder initial Supabase schema.
--
-- Layer 1 scope:
-- - Schema, indexes, updated_at triggers, and Row Level Security policies only.
-- - No frontend migration, API integrations, Edge Functions, or data migration.
--
-- How to run manually:
-- 1. Open your Supabase project dashboard.
-- 2. Go to SQL Editor.
-- 3. Paste this entire file into a new query.
-- 4. Review it, then run it.
--
-- If you later configure Supabase CLI for this repo, this file can also be
-- applied as the first migration.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination text,
  country text,
  start_date date,
  end_date date,
  description text,
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.location_refs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_place_id text,
  name text not null,
  formatted_address text,
  lat numeric,
  lng numeric,
  place_types text[] not null default '{}',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  country text,
  start_date date,
  end_date date,
  order_index integer not null,
  location_ref_id uuid references public.location_refs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transport_segments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  from_stop_id uuid references public.trip_stops(id) on delete set null,
  to_stop_id uuid references public.trip_stops(id) on delete set null,
  mode text not null,
  role text,
  is_primary boolean not null default false,
  provider text,
  confirmation_code text,
  booking_url text,
  cost numeric,
  departure_time timestamptz,
  arrival_time timestamptz,
  notes text,
  from_text text,
  to_text text,
  from_location_ref_id uuid references public.location_refs(id) on delete set null,
  to_location_ref_id uuid references public.location_refs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx
  on public.profiles(email);

create index if not exists trips_user_id_idx
  on public.trips(user_id);

create index if not exists trip_stops_trip_id_idx
  on public.trip_stops(trip_id);

create index if not exists trip_stops_location_ref_id_idx
  on public.trip_stops(location_ref_id);

create index if not exists transport_segments_trip_id_idx
  on public.transport_segments(trip_id);

create index if not exists transport_segments_from_stop_id_idx
  on public.transport_segments(from_stop_id);

create index if not exists transport_segments_to_stop_id_idx
  on public.transport_segments(to_stop_id);

create index if not exists transport_segments_from_location_ref_id_idx
  on public.transport_segments(from_location_ref_id);

create index if not exists transport_segments_to_location_ref_id_idx
  on public.transport_segments(to_location_ref_id);

create index if not exists location_refs_user_id_idx
  on public.location_refs(user_id);

create index if not exists location_refs_google_place_id_idx
  on public.location_refs(google_place_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_trips_updated_at on public.trips;
create trigger set_trips_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists set_location_refs_updated_at on public.location_refs;
create trigger set_location_refs_updated_at
before update on public.location_refs
for each row execute function public.set_updated_at();

drop trigger if exists set_trip_stops_updated_at on public.trip_stops;
create trigger set_trip_stops_updated_at
before update on public.trip_stops
for each row execute function public.set_updated_at();

drop trigger if exists set_transport_segments_updated_at on public.transport_segments;
create trigger set_transport_segments_updated_at
before update on public.transport_segments
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_stops enable row level security;
alter table public.location_refs enable row level security;
alter table public.transport_segments enable row level security;

drop policy if exists "Users can select their own profile" on public.profiles;
create policy "Users can select their own profile"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
on public.profiles
for delete
using (id = auth.uid());

drop policy if exists "Users can select their own trips" on public.trips;
create policy "Users can select their own trips"
on public.trips
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert their own trips" on public.trips;
create policy "Users can insert their own trips"
on public.trips
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update their own trips" on public.trips;
create policy "Users can update their own trips"
on public.trips
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own trips" on public.trips;
create policy "Users can delete their own trips"
on public.trips
for delete
using (user_id = auth.uid());

drop policy if exists "Users can select stops for their own trips" on public.trip_stops;
create policy "Users can select stops for their own trips"
on public.trip_stops
for select
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert stops for their own trips" on public.trip_stops;
create policy "Users can insert stops for their own trips"
on public.trip_stops
for insert
with check (
  exists (
    select 1
    from public.trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can update stops for their own trips" on public.trip_stops;
create policy "Users can update stops for their own trips"
on public.trip_stops
for update
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete stops for their own trips" on public.trip_stops;
create policy "Users can delete stops for their own trips"
on public.trip_stops
for delete
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can select their own location refs" on public.location_refs;
create policy "Users can select their own location refs"
on public.location_refs
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert their own location refs" on public.location_refs;
create policy "Users can insert their own location refs"
on public.location_refs
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update their own location refs" on public.location_refs;
create policy "Users can update their own location refs"
on public.location_refs
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own location refs" on public.location_refs;
create policy "Users can delete their own location refs"
on public.location_refs
for delete
using (user_id = auth.uid());

drop policy if exists "Users can select segments for their own trips" on public.transport_segments;
create policy "Users can select segments for their own trips"
on public.transport_segments
for select
using (
  exists (
    select 1
    from public.trips
    where trips.id = transport_segments.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert segments for their own trips" on public.transport_segments;
create policy "Users can insert segments for their own trips"
on public.transport_segments
for insert
with check (
  exists (
    select 1
    from public.trips
    where trips.id = transport_segments.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can update segments for their own trips" on public.transport_segments;
create policy "Users can update segments for their own trips"
on public.transport_segments
for update
using (
  exists (
    select 1
    from public.trips
    where trips.id = transport_segments.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = transport_segments.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete segments for their own trips" on public.transport_segments;
create policy "Users can delete segments for their own trips"
on public.transport_segments
for delete
using (
  exists (
    select 1
    from public.trips
    where trips.id = transport_segments.trip_id
      and trips.user_id = auth.uid()
  )
);
