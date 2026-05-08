import { useParams } from 'react-router-dom';
import { getTripById } from '../data/trips';
import type { Trip } from '../types';

export function useTrip(): Trip | undefined {
  const { tripId } = useParams<{ tripId: string }>();
  if (!tripId) return undefined;
  return getTripById(tripId);
}
