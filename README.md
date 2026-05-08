# Travel Builder

Travel Builder is a travel planning frontend prototype for organizing trips, comparing flights and hotels, saving places, building itineraries, tracking budgets, and reviewing trip details in one workspace.

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React icons
- ESLint

## Project Status

This is a Phase 1 frontend-only prototype. It uses mock data from `src/data` and local component state for interactions.

There are no real APIs, authentication flows, databases, payment systems, map integrations, flight or hotel booking integrations, or external backend services connected yet.

## Install

```powershell
npm install
```

## Run Locally

```powershell
npm run dev
```

The Vite dev server usually runs at:

```text
http://localhost:5173
```

## Checks

```powershell
npm run typecheck
npm run lint
npm run build
```

## Notes

- Trip, flight, hotel, place, itinerary, budget, note, weather, and testimonial data are currently static mock data.
- Some buttons intentionally use local-only placeholder behavior.
- Data changes made in the UI may reset after refresh until a real persistence layer is added.
