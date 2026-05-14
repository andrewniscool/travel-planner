import { useParams } from 'react-router-dom';
import { getTripById, LOCAL_TRIPS_STORAGE_KEY } from '../data/trips';
import type { Trip } from '../types';

export function getLocalTrips(): Trip[] {
  try {
    return JSON.parse(
      window.localStorage.getItem(LOCAL_TRIPS_STORAGE_KEY) ?? '[]'
    ) as Trip[];
  } catch {
    return [];
  }
}

export function getTripFromStorageOrMock(tripId: string): Trip | undefined {
  const localTrip = getLocalTrips().find((trip) => trip.id === tripId);
  return localTrip ?? getTripById(tripId);
}

export function useTrip(): Trip | undefined {
  const { tripId } = useParams<{ tripId: string }>();
  if (!tripId) return undefined;
  return getTripFromStorageOrMock(tripId);
}
