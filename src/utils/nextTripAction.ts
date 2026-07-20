import type { TripData } from '../hooks/useTripData';

export interface NextTripAction {
  label: string;
  description: string;
  route: string;
}

export const getNextTripAction = (data: TripData): NextTripAction => {
  const { trip } = data;
  if (!trip) {
    return { label: 'Return to your trips', description: 'Choose a trip to continue planning.', route: '' };
  }

  if (!trip.startDate || !trip.endDate || data.orderedStops.some((stop) => !stop.startDate || !stop.endDate)) {
    return { label: 'Finish trip dates', description: 'Confirm the dates for this trip and each stop.', route: 'edit' };
  }

  if (trip.transportSegments.length === 0) {
    return { label: 'Add your transportation', description: 'Start with the flight, train, or drive that gets the trip moving.', route: 'plan?add=transport' };
  }

  const stopsWithSelectedLodging = new Set(
    data.hotels.filter((hotel) => hotel.isSelected).map((hotel) => hotel.stopId).filter(Boolean),
  );
  if (data.orderedStops.some((stop) => !stopsWithSelectedLodging.has(stop.id))) {
    return { label: 'Choose a stay', description: 'Add lodging for the next stop that still needs it.', route: 'plan?add=stay' };
  }

  const scheduledItems = data.itinerary.flatMap((day) => [
    ...day.morning,
    ...day.afternoon,
    ...day.evening,
  ]);
  if (!scheduledItems.some((item) => item.type === 'activity' || item.type === 'restaurant')) {
    return { label: 'Plan your first place', description: 'Add an activity or restaurant to the timeline.', route: 'plan?add=place' };
  }

  if (data.totalAllocated <= 0) {
    return { label: 'Set the trip budget', description: 'Add a target so spending has useful context.', route: 'budget' };
  }

  const openTasks = data.checklist.filter((item) => !item.checked).length;
  if (openTasks > 0) {
    return { label: `Review ${openTasks} open task${openTasks === 1 ? '' : 's'}`, description: 'Clear the reminders waiting in Unscheduled.', route: 'plan#unscheduled' };
  }

  return { label: 'Review your Plan', description: 'Your essentials are in place. Check the timeline for gaps.', route: 'plan' };
};
