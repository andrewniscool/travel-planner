-- Persist trip-stop fields represented by the frontend model.

alter table public.trip_stops
  add column if not exists notes text,
  add column if not exists image text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'trip_stops_latitude_check'
  ) then
    alter table public.trip_stops
      add constraint trip_stops_latitude_check
      check (latitude is null or latitude between -90 and 90);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'trip_stops_longitude_check'
  ) then
    alter table public.trip_stops
      add constraint trip_stops_longitude_check
      check (longitude is null or longitude between -180 and 180);
  end if;
end;
$$;
