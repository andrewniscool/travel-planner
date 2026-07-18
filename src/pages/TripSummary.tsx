import React, { useMemo, useState } from 'react';
import { useTrip } from '../hooks/useTrip';
import { getFlightsByTripId } from '../data/flights';
import { getHotelsByTripId } from '../data/hotels';
import { getPlacesByTripId } from '../data/places';
import { getItineraryByTripId } from '../data/itinerary';
import { getBudgetByTripId } from '../data/budget';
import { getNotesByTripId, getChecklistByTripId } from '../data/notes';
import {
  getPrimaryStop,
  getTripDisplayName,
  getTripRouteLabel,
  isMultiStopTrip,
} from '../data/trips';
import TripSummaryHeader from '../components/trip-summary/TripSummaryHeader';
import SummaryRouteCard from '../components/trip-summary/SummaryRouteCard';
import SelectedFlightSummaryCard from '../components/trip-summary/SelectedFlightSummaryCard';
import SelectedHotelSummaryCard from '../components/trip-summary/SelectedHotelSummaryCard';
import StopHighlightsCard from '../components/trip-summary/StopHighlightsCard';
import DailyItinerarySummaryCard from '../components/trip-summary/DailyItinerarySummaryCard';
import BudgetSummaryCard from '../components/trip-summary/BudgetSummaryCard';
import SavedLinksCard from '../components/trip-summary/SavedLinksCard';
import NotesChecklistSummaryCard from '../components/trip-summary/NotesChecklistSummaryCard';
import SummaryActions from '../components/trip-summary/SummaryActions';
import type { ItineraryDay, ItineraryItem, TripStop } from '../types';

function safeFilename(value: string): string {
  const fallback = 'trip-summary';
  const filename = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return filename || fallback;
}

function downloadTextFile(filename: string, content: string) {
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

const TripSummary: React.FC = () => {
  const trip = useTrip();
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const flights = useMemo(() => (trip ? getFlightsByTripId(trip.id) : []), [trip]);
  const hotels = useMemo(() => (trip ? getHotelsByTripId(trip.id) : []), [trip]);
  const places = useMemo(() => (trip ? getPlacesByTripId(trip.id) : []), [trip]);
  const itinerary = useMemo(() => (trip ? getItineraryByTripId(trip.id) : []), [trip]);
  const budget = trip ? getBudgetByTripId(trip.id) : undefined;
  const notes = trip ? getNotesByTripId(trip.id) : [];
  const checklist = trip ? getChecklistByTripId(trip.id) : [];
  const isMultiStop = trip ? isMultiStopTrip(trip) : false;
  const orderedStops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.order - b.order) : []),
    [trip],
  );

  const selectedFlight = useMemo(() => flights.find((f) => f.isSelected), [flights]);

  const selectedHotel = useMemo(() => hotels.find((h) => h.isSelected), [hotels]);

  const totalSpent = useMemo(() => {
    if (!budget) return 0;
    return budget.categories.reduce((sum, cat) => sum + cat.spent, 0);
  }, [budget]);

  const totalAllocated = useMemo(() => {
    if (!budget) return 0;
    return budget.categories.reduce((sum, cat) => sum + cat.allocated, 0);
  }, [budget]);

  const checkedCount = checklist.filter((c) => c.checked).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const allItineraryItems = (day: ItineraryDay): ItineraryItem[] => [
    ...day.morning,
    ...day.afternoon,
    ...day.evening,
  ];

  const getStopForDay = (day: ItineraryDay): TripStop | undefined =>
    orderedStops.find((stop) => stop.id === day.stopId) ??
    (trip ? getPrimaryStop(trip) : undefined);

  const getStopName = (stopId?: string) => orderedStops.find((stop) => stop.id === stopId)?.name;

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Trip not found</p>
      </div>
    );
  }

  const tripName = getTripDisplayName(trip);
  const tripRoute = isMultiStop ? getTripRouteLabel(trip) : trip.country;
  const hotelLink = selectedHotel?.locationRef?.websiteUri ?? selectedHotel?.locationRef?.googleMapsUri;
  const stopHighlights = orderedStops.map((stop) => ({
    stop,
    hotels: hotels.filter((hotel) => hotel.stopId === stop.id),
    places: places
      .filter((place) => place.stopId === stop.id && place.isSaved)
      .slice(0, 3),
    days: itinerary.filter((day) => getStopForDay(day)?.id === stop.id),
  }));

  const buildExportText = () => {
    const lines: string[] = [
      tripName,
      tripRoute,
      `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`,
      `${trip.travelers} traveler${trip.travelers === 1 ? '' : 's'}`,
      `$${trip.budget.toLocaleString()} budget`,
      '',
    ];

    if (orderedStops.length > 0) {
      lines.push('Route');
      orderedStops.forEach((stop) => {
        lines.push(
          `- ${stop.order}. ${stop.name}: ${formatDate(stop.startDate)} - ${formatDate(stop.endDate)}`,
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
        `- Price: $${selectedFlight.price.toLocaleString()}`,
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
        `- $${selectedHotel.pricePerNight}/night`,
        `- $${selectedHotel.totalCost.toLocaleString()} total`,
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
          `- ${category.name}: $${category.spent.toLocaleString()} spent of $${category.allocated.toLocaleString()}`,
        );
      });
      lines.push(
        `Total: $${totalSpent.toLocaleString()} spent of $${totalAllocated.toLocaleString()} allocated`,
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
  };

  const handleExport = () => {
    downloadTextFile(`${safeFilename(tripName)}-summary.txt`, buildExportText());
    setActionStatus('Itinerary exported.');
  };

  const handleShare = async () => {
    const shareData = {
      title: tripName,
      text: `${tripName} - ${tripRoute}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setActionStatus('Share sheet opened.');
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setActionStatus('Trip link copied.');
    } catch {
      setActionStatus('Unable to share this trip right now.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <TripSummaryHeader
        trip={trip}
        tripName={tripName}
        tripRoute={tripRoute}
        formatDate={formatDate}
      />

      {isMultiStop && (
        <SummaryRouteCard
          stops={orderedStops}
          transportSegments={trip.transportSegments}
          formatDate={formatDate}
          getStopName={getStopName}
        />
      )}

      <SelectedFlightSummaryCard flight={selectedFlight} />

      {!isMultiStop && <SelectedHotelSummaryCard hotel={selectedHotel} />}

      {isMultiStop && (
        <StopHighlightsCard highlights={stopHighlights} />
      )}

      <DailyItinerarySummaryCard
        itinerary={itinerary}
        formatDayDate={formatDayDate}
        allItineraryItems={allItineraryItems}
      />

      <BudgetSummaryCard
        budget={budget}
        tripBudget={trip.budget}
        totalAllocated={totalAllocated}
        totalSpent={totalSpent}
      />

      <SavedLinksCard
        selectedFlight={selectedFlight}
        selectedHotel={selectedHotel}
        hotelLink={hotelLink}
      />

      <NotesChecklistSummaryCard
        notes={notes}
        checkedCount={checkedCount}
        checklistCount={checklist.length}
      />

      <SummaryActions
        actionStatus={actionStatus}
        onExport={handleExport}
        onShare={() => void handleShare()}
        onPrint={handlePrint}
      />
    </div>
  );
};

export default TripSummary;
