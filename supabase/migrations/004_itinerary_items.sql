-- Layer 6: itinerary items.
--
-- Scope:
-- - Persist itinerary item rows for the Itinerary page.
-- - No drag/drop persistence, place-to-itinerary migration, or external APIs.

create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  stop_id uuid references public.trip_stops(id) on delete set null,
  location_ref_id uuid references public.location_refs(id) on delete set null,
  title text not null,
  item_type text not null default 'activity',
  date date not null,
  start_time time,
  end_time time,
  time_of_day text,
  location_text text,
  estimated_cost numeric,
  notes text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists itinerary_items_trip_id_idx
  on public.itinerary_items(trip_id);

create index if not exists itinerary_items_stop_id_idx
  on public.itinerary_items(stop_id);

create index if not exists itinerary_items_location_ref_id_idx
  on public.itinerary_items(location_ref_id);

create index if not exists itinerary_items_trip_date_order_idx
  on public.itinerary_items(trip_id, date, order_index);

drop trigger if exists set_itinerary_items_updated_at on public.itinerary_items;
create trigger set_itinerary_items_updated_at
before update on public.itinerary_items
for each row execute function public.set_updated_at();

alter table public.itinerary_items enable row level security;

drop policy if exists "Users can select itinerary items for their own trips" on public.itinerary_items;
create policy "Users can select itinerary items for their own trips"
on public.itinerary_items
for select
using (
  exists (
    select 1
    from public.trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert itinerary items for their own trips" on public.itinerary_items;
create policy "Users can insert itinerary items for their own trips"
on public.itinerary_items
for insert
with check (
  exists (
    select 1
    from public.trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can update itinerary items for their own trips" on public.itinerary_items;
create policy "Users can update itinerary items for their own trips"
on public.itinerary_items
for update
using (
  exists (
    select 1
    from public.trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete itinerary items for their own trips" on public.itinerary_items;
create policy "Users can delete itinerary items for their own trips"
on public.itinerary_items
for delete
using (
  exists (
    select 1
    from public.trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
);
