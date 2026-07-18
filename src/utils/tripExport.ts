import type { TripData } from '../hooks/useTripData';
import { allItineraryItems } from './itineraryDisplay';
import { formatDayDate, formatLongDate } from './tripDisplay';
import { formatBudgetAmount } from './budget';

export function safeFilename(value: string): string {
  const fallback = 'trip-summary';
  const filename = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return filename || fallback;
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function buildTripSummaryText(data: TripData): string {
  const {
    trip,
    tripName,
    routeLabel,
    isMultiStop,
    orderedStops,
    hotels,
    places,
    itinerary,
    budget,
    notes,
    checklist,
    selectedFlight,
    selectedHotel,
    totalAllocated,
    totalSpent,
    checkedCount,
    getStopForDay,
  } = data;

  if (!trip) return '';

  const tripRoute = isMultiStop ? routeLabel : trip.country;

  const lines: string[] = [
    tripName,
    tripRoute,
    `${formatLongDate(trip.startDate)} - ${formatLongDate(trip.endDate)}`,
    `${trip.travelers} traveler${trip.travelers === 1 ? '' : 's'}`,
    `${formatBudgetAmount(trip.budget, trip.budgetCurrency)} budget`,
    '',
  ];

  if (orderedStops.length > 0) {
    lines.push('Route');
    orderedStops.forEach((stop) => {
      lines.push(
        `- ${stop.order}. ${stop.name}: ${formatLongDate(stop.startDate)} - ${formatLongDate(stop.endDate)}`,
      );
    });
    lines.push('');
  }

  lines.push('Selected Flight');
  if (selectedFlight) {
    lines.push(
      `- ${selectedFlight.airline}: ${selectedFlight.departureAirportCode} -> ${selectedFlight.arrivalAirportCode}`,
      `- Time: ${selectedFlight.departureTime} - ${selectedFlight.arrivalTime}`,
      `- Duration: ${selectedFlight.duration}`,
      `- Price: ${formatBudgetAmount(selectedFlight.price, trip.budgetCurrency)}`,
      `- Source: ${selectedFlight.bookingSource}`,
    );
  } else {
    lines.push('- No flight selected');
  }
  lines.push('');

  lines.push(isMultiStop ? 'Stop Highlights' : 'Selected Hotel');
  if (isMultiStop) {
    orderedStops.forEach((stop) => {
      const stopHotels = hotels.filter((hotel) => hotel.stopId === stop.id);
      const stopPlaces = places
        .filter((place) => place.stopId === stop.id && place.isSaved)
        .slice(0, 3);
      const stopDays = itinerary.filter((day) => getStopForDay(day)?.id === stop.id);
      lines.push(`- ${stop.name}`);
      lines.push(
        `  Hotel: ${stopHotels.find((hotel) => hotel.isSelected)?.name || stopHotels[0]?.name || 'No hotel selected'}`,
      );
      lines.push(
        `  Places: ${stopPlaces.length > 0 ? stopPlaces.map((place) => place.name).join(', ') : 'No saved places'}`,
      );
      lines.push(`  Itinerary days: ${stopDays.length}`);
    });
  } else if (selectedHotel) {
    lines.push(
      `- ${selectedHotel.name}`,
      `- ${selectedHotel.neighborhood}`,
      `- ${formatBudgetAmount(selectedHotel.pricePerNight, trip.budgetCurrency)}/night`,
      `- ${formatBudgetAmount(selectedHotel.totalCost, trip.budgetCurrency)} total`,
    );
  } else {
    lines.push('- No hotel selected');
  }
  lines.push('');

  lines.push('Daily Itinerary');
  if (itinerary.length > 0) {
    itinerary.forEach((day) => {
      lines.push(`Day ${day.dayNumber} - ${formatDayDate(day.date)}`);
      allItineraryItems(day).forEach((item) => {
        lines.push(`- ${item.time} ${item.name}${item.location ? ` (${item.location})` : ''}`);
      });
    });
  } else {
    lines.push('- No itinerary planned');
  }
  lines.push('');

  lines.push('Budget');
  if (budget) {
    budget.categories.forEach((category) => {
      lines.push(
        `- ${category.name}: ${formatBudgetAmount(category.spent, trip.budgetCurrency)} spent of ${formatBudgetAmount(category.allocated, trip.budgetCurrency)}`,
      );
    });
    lines.push(
      `Total: ${formatBudgetAmount(totalSpent, trip.budgetCurrency)} spent of ${formatBudgetAmount(totalAllocated, trip.budgetCurrency)} allocated`,
    );
  } else {
    lines.push('- No budget data');
  }
  lines.push('');

  lines.push('Notes');
  if (notes.length > 0) {
    notes.slice(0, 3).forEach((note) => {
      lines.push(`- ${note.title}: ${note.content}`);
    });
  } else {
    lines.push('- No notes');
  }
  lines.push(`Checklist: ${checkedCount} of ${checklist.length} items checked`);

  return `${lines.join('\n')}\n`;
}
