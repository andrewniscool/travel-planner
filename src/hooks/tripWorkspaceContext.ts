import { createContext } from 'react';
import type { Trip } from '../types';

export type TripWorkspaceSource = 'supabase' | 'fallback';

export interface TripWorkspaceContextValue {
  trips: Trip[];
  activeTrip: Trip | null;
  activeTripId: string | null;
  isLoading: boolean;
  error: string | null;
  source: TripWorkspaceSource;
  canDeleteTrips: boolean;
  selectTrip: (tripId: string) => void;
  deleteTrip: (tripId: string) => void;
}

export const TripWorkspaceContext = createContext<TripWorkspaceContextValue | null>(null);
