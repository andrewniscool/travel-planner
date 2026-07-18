import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LOCAL_TRIPS_STORAGE_KEY, trips as mockTrips } from '../data/trips';
import { selectNextTrip } from '../utils/tripDisplay';
import type { Trip } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { useServiceTrips } from './useServiceTrips';
import { TripWorkspaceContext } from './tripWorkspaceContext';

const ACTIVE_TRIP_STORAGE_KEY = 'travel-builder:active-trip';

const getTripIdFromPath = (pathname: string) => {
  const match = pathname.match(/^\/trip\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const readLocalTrips = (): Trip[] => {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_TRIPS_STORAGE_KEY) ?? '[]') as Trip[];
  } catch {
    return [];
  }
};

export const TripWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [localTrips, setLocalTrips] = useLocalStorage<Trip[]>(LOCAL_TRIPS_STORAGE_KEY, []);
  const [deletedMockTripIds, setDeletedMockTripIds] = useState<Set<string>>(new Set());
  const [selectedTripId, setSelectedTripId] = useLocalStorage<string | null>(
    ACTIVE_TRIP_STORAGE_KEY,
    null,
  );
  const { trips: serviceTrips, isLoading, error, source } = useServiceTrips();

  useEffect(() => {
    const storedTrips = readLocalTrips();
    if (JSON.stringify(storedTrips) !== JSON.stringify(localTrips)) setLocalTrips(storedTrips);
  }, [location.pathname, localTrips, setLocalTrips]);

  const fallbackTrips = useMemo(() => {
    const localTripIds = new Set(localTrips.map((trip) => trip.id));
    return [
      ...mockTrips.filter((trip) => !deletedMockTripIds.has(trip.id) && !localTripIds.has(trip.id)),
      ...localTrips,
    ];
  }, [deletedMockTripIds, localTrips]);

  const availableTrips = serviceTrips ?? fallbackTrips;
  const routeTripId = getTripIdFromPath(location.pathname);
  const activeTrip =
    availableTrips.find((trip) => trip.id === routeTripId) ??
    availableTrips.find((trip) => trip.id === selectedTripId) ??
    selectNextTrip(availableTrips) ??
    availableTrips[0] ??
    null;

  useEffect(() => {
    if (activeTrip && activeTrip.id !== selectedTripId) setSelectedTripId(activeTrip.id);
    if (!activeTrip && selectedTripId) setSelectedTripId(null);
  }, [activeTrip, selectedTripId, setSelectedTripId]);

  const value = useMemo(
    () => ({
      trips: availableTrips,
      activeTrip,
      activeTripId: activeTrip?.id ?? null,
      isLoading,
      error,
      source,
      canDeleteTrips: source === 'fallback',
      selectTrip: setSelectedTripId,
      deleteTrip(tripId: string) {
        if (source !== 'fallback') return;
        if (localTrips.some((trip) => trip.id === tripId)) {
          setLocalTrips((current) => current.filter((trip) => trip.id !== tripId));
        } else {
          setDeletedMockTripIds((current) => new Set([...current, tripId]));
        }
      },
    }),
    [
      activeTrip,
      availableTrips,
      error,
      isLoading,
      localTrips,
      setLocalTrips,
      setSelectedTripId,
      source,
    ],
  );

  return <TripWorkspaceContext.Provider value={value}>{children}</TripWorkspaceContext.Provider>;
};
