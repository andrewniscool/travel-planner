-- Layer 6: notes and checklist items.
--
-- Scope:
-- - Persist trip notes.
-- - Persist checklist item toggle/delete state where checklist rows exist.
-- - Existing mock notes/checklists remain frontend fallback data.

create table if not exists public.trip_notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  stop_id uuid references public.trip_stops(id) on delete set null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trip_notes_trip_id_idx
  on public.trip_notes(trip_id);

create index if not exists trip_notes_stop_id_idx
  on public.trip_notes(stop_id);

drop trigger if exists set_trip_notes_updated_at on public.trip_notes;
create trigger set_trip_notes_updated_at
before update on public.trip_notes
for each row execute function public.set_updated_at();

alter table public.trip_notes enable row level security;

drop policy if exists "Users can select notes for their own trips" on public.trip_notes;
create policy "Users can select notes for their own trips"
on public.trip_notes
for select
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_notes.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert notes for their own trips" on public.trip_notes;
create policy "Users can insert notes for their own trips"
on public.trip_notes
for insert
with check (
  exists (
    select 1
    from public.trips
    where trips.id = trip_notes.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can update notes for their own trips" on public.trip_notes;
create policy "Users can update notes for their own trips"
on public.trip_notes
for update
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_notes.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = trip_notes.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete notes for their own trips" on public.trip_notes;
create policy "Users can delete notes for their own trips"
on public.trip_notes
for delete
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_notes.trip_id
      and trips.user_id = auth.uid()
  )
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  stop_id uuid references public.trip_stops(id) on delete set null,
  text text not null,
  checked boolean not null default false,
  category text not null default 'reminders',
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklist_items_category_check
    check (category in ('packing', 'documents', 'reminders'))
);

create index if not exists checklist_items_trip_id_idx
  on public.checklist_items(trip_id);

create index if not exists checklist_items_stop_id_idx
  on public.checklist_items(stop_id);

create index if not exists checklist_items_trip_order_idx
  on public.checklist_items(trip_id, order_index);

drop trigger if exists set_checklist_items_updated_at on public.checklist_items;
create trigger set_checklist_items_updated_at
before update on public.checklist_items
for each row execute function public.set_updated_at();

alter table public.checklist_items enable row level security;

drop policy if exists "Users can select checklist items for their own trips" on public.checklist_items;
create policy "Users can select checklist items for their own trips"
on public.checklist_items
for select
using (
  exists (
    select 1
    from public.trips
    where trips.id = checklist_items.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert checklist items for their own trips" on public.checklist_items;
create policy "Users can insert checklist items for their own trips"
on public.checklist_items
for insert
with check (
  exists (
    select 1
    from public.trips
    where trips.id = checklist_items.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can update checklist items for their own trips" on public.checklist_items;
create policy "Users can update checklist items for their own trips"
on public.checklist_items
for update
using (
  exists (
    select 1
    from public.trips
    where trips.id = checklist_items.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = checklist_items.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete checklist items for their own trips" on public.checklist_items;
create policy "Users can delete checklist items for their own trips"
on public.checklist_items
for delete
using (
  exists (
    select 1
    from public.trips
    where trips.id = checklist_items.trip_id
      and trips.user_id = auth.uid()
  )
);
