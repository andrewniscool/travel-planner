import { useEffect, useState } from 'react';
import type { Trip } from '../types';
import { getAuthenticatedUserId, tripService } from '../services/travelDataService';
import { mapTripWithRelationsToTrip } from '../services/tripMappers';
import { getLocalTrips } from './useTrip';

type ServiceSource = 'supabase' | 'fallback';

interface ServiceTripsState {
  trips: Trip[] | null;
  isLoading: boolean;
  error: string | null;
  source: ServiceSource;
}

interface ServiceTripState {
  trip: Trip | null;
  isLoading: boolean;
  error: string | null;
  source: ServiceSource;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to load Supabase data.';
}

export function useServiceTrips(): ServiceTripsState {
  const [state, setState] = useState<ServiceTripsState>({
    trips: null,
    isLoading: true,
    error: null,
    source: 'fallback',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadTrips() {
      try {
        const userId = await getAuthenticatedUserId();

        if (!userId) {
          if (isMounted) {
            setState({
              trips: null,
              isLoading: false,
              error: null,
              source: 'fallback',
            });
          }
          return;
        }

        const rows = await tripService.listTripsWithRelations(userId);

        if (isMounted) {
          const localTrips = getLocalTrips();

          setState({
            trips: rows.map((row) =>
              mapTripWithRelationsToTrip(
                row,
                localTrips.find((trip) => trip.id === row.id),
              ),
            ),
            isLoading: false,
            error: null,
            source: 'supabase',
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            trips: null,
            isLoading: false,
            error: getErrorMessage(error),
            source: 'fallback',
          });
        }
      }
    }

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

export function useServiceTrip(tripId?: string): ServiceTripState {
  const [state, setState] = useState<ServiceTripState>({
    trip: null,
    isLoading: Boolean(tripId),
    error: null,
    source: 'fallback',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadTrip() {
      if (!tripId) {
        setState({
          trip: null,
          isLoading: false,
          error: null,
          source: 'fallback',
        });
        return;
      }

      try {
        const userId = await getAuthenticatedUserId();

        if (!userId) {
          if (isMounted) {
            setState({
              trip: null,
              isLoading: false,
              error: null,
              source: 'fallback',
            });
          }
          return;
        }

        const row = await tripService.getTrip(tripId);

        if (isMounted) {
          const localTrip = getLocalTrips().find((trip) => trip.id === row?.id);

          setState({
            trip: row ? mapTripWithRelationsToTrip(row, localTrip) : null,
            isLoading: false,
            error: null,
            source: row ? 'supabase' : 'fallback',
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            trip: null,
            isLoading: false,
            error: getErrorMessage(error),
            source: 'fallback',
          });
        }
      }
    }

    loadTrip();

    return () => {
      isMounted = false;
    };
  }, [tripId]);

  return state;
}
