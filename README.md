# Travel Builder

Travel Builder is a travel planning app for organizing trips, comparing lodging and transport options, saving places, building itineraries, tracking budgets, and reviewing trip details in one workspace.

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React icons
- Supabase Auth, Database, Row Level Security, and Edge Functions

## Project Status

The app now has a Supabase-backed data layer for trips, stops, transport segments, lodging selections, saved places, itinerary items, budgets, notes, checklists, and profile preferences.

Mock data still exists in `src/data` as fallback/demo content. Some screens continue to merge or fall back to local/mock data when Supabase data is unavailable.

## Google Places Phase

The project has the backend boundary needed before using Google Places from the app:

- `supabase/functions/places` proxies Google Places API calls from Supabase Edge Functions.
- The browser calls the Edge Function through `src/services/placesService.ts`; it should not call Google Places directly.
- `GOOGLE_PLACES_API_KEY` must be stored as a Supabase secret, not as a `VITE_*` variable.
- The function verifies the bearer token against Supabase Auth; a publishable key by itself is rejected.
- Migration `012_google_places_rate_limits.sql` enforces a service-role-only per-user rate limit before Google is called.
- `supabase/migrations/010_google_places_location_refs.sql` expands `location_refs` to store Google place metadata.
- `src/services/travelDataService.ts` includes `locationRefService.upsertGoogleLocationRef` for reusing a user's saved Google-backed locations.

Current Places actions supported by the Edge Function:

- `autocomplete`
- `details`
- `textSearch`

Current UI integration: `LocationInput` uses live Google autocomplete/details in Flights & Transportation, then persists selected Google places through `locationRefService.upsertGoogleLocationRef`.

## Environment

Create a local env file from the example:

```powershell
Copy-Item .env.example .env.local
```

Required browser-safe variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_ENABLE_MOCK_DATA=false
landing_page=true
DEV_BYPASS_AUTH=false
```

Set `landing_page=false` in `.env.local` to skip the landing page and route `/`
to the dashboard. Restart the Vite dev server after changing it. The landing
page remains enabled when the variable is omitted.

Set `DEV_BYPASS_AUTH=true` to bypass authentication while running the Vite
development server. `/sign-in` will then redirect to the dashboard. Production
builds reject this setting, and authentication remains enabled when it is omitted.

Required Supabase Edge Function secret:

```powershell
pnpm supabase secrets set --env-file .env.supabase.local
```

`.env.supabase.local` should contain server-only secrets and should not use `VITE_*` names:

```text
GOOGLE_PLACES_API_KEY=
```

## Install

```powershell
pnpm install
```

## Run Locally

The backend is hosted Supabase. You usually do not start a backend server for normal development; run the React app and it talks to the linked Supabase project from `.env.local`.

```powershell
pnpm run dev
```

The Vite dev server usually runs at:

```text
http://localhost:5173
```

## Supabase

One-time setup on a new machine:

```powershell
pnpm supabase login
pnpm supabase link --project-ref YOUR_PROJECT_REF
pnpm supabase migration list
```

After adding or pulling migrations, inspect first, then push:

```powershell
pnpm supabase db push --linked --dry-run
pnpm supabase db push --linked
```

After changing `supabase/functions/places`, deploy the Edge Function:

```powershell
pnpm supabase functions deploy places --project-ref YOUR_PROJECT_REF
```

After changing hosted secrets:

```powershell
pnpm supabase secrets set --env-file .env.supabase.local --project-ref YOUR_PROJECT_REF
pnpm supabase secrets list --project-ref YOUR_PROJECT_REF
```

Useful verification commands:

```powershell
pnpm supabase migration list
pnpm supabase functions list --project-ref YOUR_PROJECT_REF
```

Optional local Edge Function development, mainly for function-only debugging:

```powershell
pnpm supabase functions serve places --env-file .env.supabase.local
```

## Checks

```powershell
pnpm run typecheck
pnpm run lint
pnpm run build
```
