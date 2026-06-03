-- Layer 7: dashboard and create-trip metadata on trips.
--
-- Scope:
-- - Persist fields currently used by Dashboard and CreateTrip.
-- - Keep budget expense/category detail in the existing budget tables/local flow.

alter table public.trips
  add column if not exists travelers integer not null default 1,
  add column if not exists budget numeric not null default 0,
  add column if not exists budget_currency text not null default 'USD',
  add column if not exists vibe text not null default 'Relaxing',
  add column if not exists status text not null default 'planning',
  add column if not exists planning_progress integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trips_travelers_check'
  ) then
    alter table public.trips
      add constraint trips_travelers_check check (travelers >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trips_budget_check'
  ) then
    alter table public.trips
      add constraint trips_budget_check check (budget >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trips_budget_currency_check'
  ) then
    alter table public.trips
      add constraint trips_budget_currency_check
      check (budget_currency in ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trips_vibe_check'
  ) then
    alter table public.trips
      add constraint trips_vibe_check
      check (
        vibe in (
          'Relaxing',
          'Adventure',
          'Food-focused',
          'Romantic',
          'Family',
          'Budget-friendly',
          'Luxury',
          'Cultural'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trips_status_check'
  ) then
    alter table public.trips
      add constraint trips_status_check
      check (status in ('upcoming', 'planning', 'booked', 'past'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trips_planning_progress_check'
  ) then
    alter table public.trips
      add constraint trips_planning_progress_check
      check (planning_progress between 0 and 100);
  end if;
end;
$$;
