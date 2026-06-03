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
- `supabase/migrations/010_google_places_location_refs.sql` expands `location_refs` to store Google place metadata.
- `src/services/travelDataService.ts` includes `locationRefService.upsertGoogleLocationRef` for reusing a user's saved Google-backed locations.

Current Places actions supported by the Edge Function:

- `autocomplete`
- `details`
- `textSearch`

Next UI integration step: replace the mock suggestions in `LocationInput` with debounced `placesService.autocomplete`, then fetch `placesService.getDetails` on selection and persist the result with `locationRefService.upsertGoogleLocationRef`.

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
```

Required Supabase Edge Function secret:

```powershell
supabase secrets set GOOGLE_PLACES_API_KEY=your_google_places_key
```

## Install

```powershell
pnpm install
```

## Run Locally

```powershell
pnpm run dev
```

The Vite dev server usually runs at:

```text
http://localhost:5173
```

## Supabase

Apply database migrations:

```powershell
pnpm run db:push
```

Deploy the Places Edge Function:

```powershell
pnpm supabase functions deploy places
```

For local Edge Function development:

```powershell
pnpm supabase functions serve places --env-file .env.local
```

## Checks

```powershell
pnpm run typecheck
pnpm run lint
pnpm run build
```
