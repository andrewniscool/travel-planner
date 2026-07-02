import type { LocationRef } from '../../types';

export interface StopForm {
  name: string;
  country: string;
  startDate: string;
  endDate: string;
  notes: string;
  locationRef: LocationRef | null;
}

export type RouteMode = 'single' | 'multi';

export const getRouteStepLabel = (index: number, stopCount: number) => {
  if (stopCount <= 1) return 'Destination';
  if (index === 0) return 'Start';
  if (index === stopCount - 1) return 'Final destination';
  return `Stop ${index + 1}`;
};
