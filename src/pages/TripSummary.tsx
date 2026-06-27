import React, { useMemo, useState } from 'react';
import {
  Plane,
  Building2,
  Wallet,
  ExternalLink,
  StickyNote,
  CheckSquare,
  Download,
  Share2,
  Printer,
  Calendar,
  Users,
  Clock,
  MapPin,
} from 'lucide-react';
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
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import RatingStars from '../components/ui/RatingStars';
import ImagePlaceholder from '../components/ui/ImagePlaceholder';
import type { ItineraryDay, ItineraryItem, TripStop } from '../types';

const statusBadgeVariant: Record<string, 'upcoming' | 'planning' | 'booked' | 'past'> = {
  upcoming: 'upcoming',
  planning: 'planning',
  booked: 'booked',
  past: 'past',
};

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
    [trip]
  );

  const selectedFlight = useMemo(
    () => flights.find((f) => f.isSelected),
    [flights]
  );

  const selectedHotel = useMemo(
    () => hotels.find((h) => h.isSelected),
    [hotels]
  );

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
    orderedStops.find((stop) => stop.id === day.stopId) ?? (trip ? getPrimaryStop(trip) : undefined);

  const getStopName = (stopId?: string) =>
    orderedStops.find((stop) => stop.id === stopId)?.name;

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
        lines.push(`- ${stop.order}. ${stop.name}: ${formatDate(stop.startDate)} - ${formatDate(stop.endDate)}`);
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
        const stopPlaces = places.filter((place) => place.stopId === stop.id && place.isSaved).slice(0, 3);
        const stopDays = itinerary.filter((day) => getStopForDay(day)?.id === stop.id);
        lines.push(`- ${stop.name}`);
        lines.push(`  Hotel: ${stopHotels.find((hotel) => hotel.isSelected)?.name || stopHotels[0]?.name || 'No hotel selected'}`);
        lines.push(`  Places: ${stopPlaces.length > 0 ? stopPlaces.map((place) => place.name).join(', ') : 'No saved places'}`);
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
        lines.push(`- ${category.name}: $${category.spent.toLocaleString()} spent of $${category.allocated.toLocaleString()}`);
      });
      lines.push(`Total: $${totalSpent.toLocaleString()} spent of $${totalAllocated.toLocaleString()} allocated`);
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
      {/* Trip Header */}
      <Card hover={false} className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              {tripName}
            </h1>
            <p className="text-neutral-500 mt-1">
              {tripRoute}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusBadgeVariant[trip.status] || 'default'}>
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </Badge>
            <Badge variant="default">{trip.vibe}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-neutral-600">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-neutral-400" />
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-neutral-400" />
            {trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-neutral-400" />
            ${trip.budget.toLocaleString()} budget
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-100" />
      </Card>

      {isMultiStop && (
        <Card hover={false} className="p-6">
          <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary-500" />
            Route
          </h2>
          <div className="space-y-4">
            {orderedStops.map((stop) => (
              <div key={stop.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold">
                  {stop.order}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-800">{stop.name}</p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(stop.startDate)} - {formatDate(stop.endDate)}
                  </p>
                </div>
              </div>
            ))}
            {trip.transportSegments.length > 0 && (
              <div className="pt-2 border-t border-neutral-100 space-y-2">
                {trip.transportSegments.map((segment) => (
                  <div key={segment.id} className="text-sm text-neutral-600">
                    {getStopName(segment.fromStopId)} → {getStopName(segment.toStopId)}
                    <span className="text-neutral-400"> · {segment.provider || segment.mode}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Selected Flight Summary */}
      <Card hover={false} className="p-6">
        <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <Plane className="w-5 h-5 text-primary-500" />
          Selected Flight
        </h2>
        {selectedFlight ? (
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-800">
                  {selectedFlight.airline}
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  {selectedFlight.departureAirportCode}{' '}
                  <span className="text-neutral-400">&rarr;</span>{' '}
                  {selectedFlight.arrivalAirportCode}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedFlight.departureTime} - {selectedFlight.arrivalTime}
                  </span>
                  <span>{selectedFlight.duration}</span>
                  {selectedFlight.stops > 0 && (
                    <span>
                      {selectedFlight.stops} stop{selectedFlight.stops > 1 ? 's' : ''}{' '}
                      ({selectedFlight.stopCity})
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-neutral-900">
                  ${selectedFlight.price.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  via {selectedFlight.bookingSource}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Plane className="w-8 h-8 text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500">No flight selected</p>
          </div>
        )}
      </Card>

      {/* Selected Hotel Summary */}
      {!isMultiStop && <Card hover={false} className="p-6">
        <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-accent-500" />
          Selected Hotel
        </h2>
        {selectedHotel ? (
          <div className="flex gap-4 bg-neutral-50 rounded-xl p-4">
            <div className="w-24 h-24 shrink-0">
              <ImagePlaceholder
                src={selectedHotel.image}
                alt={selectedHotel.name}
                className="rounded-lg w-full h-full"
                aspectRatio="square"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-neutral-800">
                {selectedHotel.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <RatingStars rating={selectedHotel.rating} size="sm" />
                <span className="text-xs text-neutral-400">
                  ({selectedHotel.reviewCount.toLocaleString()} reviews)
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                <span>
                  ${selectedHotel.pricePerNight}/night
                </span>
                <span>{selectedHotel.neighborhood}</span>
              </div>
              <p className="text-sm font-semibold text-neutral-800 mt-1">
                ${selectedHotel.totalCost.toLocaleString()} total
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Building2 className="w-8 h-8 text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500">No hotel selected</p>
          </div>
        )}
      </Card>}

      {isMultiStop && (
        <Card hover={false} className="p-6">
          <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-accent-500" />
            Stop Highlights
          </h2>
          <div className="space-y-4">
            {orderedStops.map((stop) => {
              const stopHotels = hotels.filter((hotel) => hotel.stopId === stop.id);
              const stopPlaces = places.filter((place) => place.stopId === stop.id && place.isSaved).slice(0, 3);
              const stopDays = itinerary.filter((day) => getStopForDay(day)?.id === stop.id);
              return (
                <div key={stop.id} className="bg-neutral-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-neutral-800 mb-2">{stop.name}</h3>
                  <div className="space-y-1 text-sm text-neutral-600">
                    <p>{stopHotels.find((hotel) => hotel.isSelected)?.name || stopHotels[0]?.name || 'No hotel selected'}</p>
                    <p>{stopPlaces.length > 0 ? stopPlaces.map((place) => place.name).join(', ') : 'No saved places'}</p>
                    <p>{stopDays.length} itinerary day{stopDays.length === 1 ? '' : 's'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Daily Itinerary Summary */}
      <Card hover={false} className="p-6">
        <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary-500" />
          Daily Itinerary
        </h2>
        {itinerary.length > 0 ? (
          <div className="space-y-4">
            {itinerary.map((day) => {
              const items = allItineraryItems(day);
              return (
                <div key={day.dayNumber} className="bg-neutral-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-neutral-800 mb-2">
                    Day {day.dayNumber} - {formatDayDate(day.date)}
                  </h3>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 text-sm text-neutral-600"
                      >
                        <span className="text-neutral-400 font-mono text-xs mt-0.5 shrink-0 w-12">
                          {item.time}
                        </span>
                        <span>{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar className="w-8 h-8 text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500">No itinerary planned</p>
          </div>
        )}
      </Card>

      {/* Budget Summary */}
      <Card hover={false} className="p-6">
        <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-success-500" />
          Budget Summary
        </h2>
        {budget ? (
          <div className="space-y-3">
            <div className="bg-neutral-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Allocated
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Spent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {budget.categories.map((cat) => (
                    <tr
                      key={`${cat.stopId ?? 'trip'}-${cat.name}`}
                      className="border-b border-neutral-50 last:border-0"
                    >
                      <td className="px-4 py-2.5 text-neutral-700">
                        <span className="mr-1.5">{cat.icon}</span>
                        {cat.name}
                      </td>
                      <td className="px-4 py-2.5 text-right text-neutral-600">
                        ${cat.allocated.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-neutral-600">
                        ${cat.spent.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between pt-2 px-4">
              <span className="text-sm font-semibold text-neutral-800">
                Total
              </span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-neutral-600">
                  ${totalAllocated.toLocaleString()} allocated
                </span>
                <span className="font-semibold text-neutral-800">
                  ${totalSpent.toLocaleString()} spent
                </span>
                <span
                  className={`font-semibold ${trip.budget - totalSpent >= 0 ? 'text-success-600' : 'text-error-500'}`}
                >
                  ${Math.abs(trip.budget - totalSpent).toLocaleString()}{' '}
                  {trip.budget - totalSpent >= 0 ? 'remaining' : 'over'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Wallet className="w-8 h-8 text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500">No budget data</p>
          </div>
        )}
      </Card>

      {/* Saved Links */}
      <Card hover={false} className="p-6">
        <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <ExternalLink className="w-5 h-5 text-primary-500" />
          Saved Links
        </h2>
        <div className="space-y-2">
          {selectedFlight?.bookingUrl && (
            <a
              href={selectedFlight.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors duration-150"
            >
              <Plane className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-primary-600 underline flex-1">
                Flight booking - {selectedFlight.airline}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </a>
          )}
          {selectedHotel && hotelLink && (
            <a
              href={hotelLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors duration-150"
            >
              <Building2 className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-primary-600 underline flex-1">
                Hotel reservation - {selectedHotel.name}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </a>
          )}
          {!selectedFlight?.bookingUrl && !hotelLink && (
            <p className="text-sm text-neutral-400 py-2">
              No booking links yet
            </p>
          )}
        </div>
      </Card>

      {/* Notes/Checklist Preview */}
      <Card hover={false} className="p-6">
        <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <StickyNote className="w-5 h-5 text-accent-500" />
          Notes & Checklist
        </h2>
        <div className="space-y-4">
          {/* Notes preview */}
          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.slice(0, 3).map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-xl bg-neutral-50"
                >
                  <p className="text-sm font-medium text-neutral-800">
                    {note.title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No notes</p>
          )}

          {/* Checklist progress */}
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
            <CheckSquare className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-600">
              Checklist: {checkedCount} of {checklist.length} items checked
            </span>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pb-6">
        <Button variant="outline" size="md" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Itinerary
        </Button>
        <Button variant="outline" size="md" onClick={() => void handleShare()}>
          <Share2 className="w-4 h-4 mr-2" />
          Share Trip
        </Button>
        <Button variant="outline" size="md" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        {actionStatus && (
          <span className="text-sm text-neutral-500">{actionStatus}</span>
        )}
      </div>
    </div>
  );
};

export default TripSummary;
