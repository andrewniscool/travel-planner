import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MapPin,
  CalendarDays,
  Plane,
  Building2,
  DollarSign,
  CheckCircle,
  CheckCircle2,
  Circle,
  Pencil,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { getTripFromStorageOrMock } from '../hooks/useTrip';
import { useServiceTrip } from '../hooks/useServiceTrips';
import { getFlightsByTripId } from '../data/flights';
import { getHotelsByTripId } from '../data/hotels';
import { getPlacesByTripId } from '../data/places';
import { getItineraryByTripId } from '../data/itinerary';
import { getBudgetByTripId } from '../data/budget';
import {
  getTripDisplayName,
  getTripRouteLabel,
  isMultiStopTrip,
} from '../data/trips';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import RatingStars from '../components/ui/RatingStars';
import ImagePlaceholder from '../components/ui/ImagePlaceholder';
import TripNav from '../components/layout/TripNav';
import type { TripStatus } from '../types';

function formatFullDate(dateStr: string): string {
  if (!dateStr) return 'Date TBD';

  const [year, month, day] = dateStr.split('-');
  return new Date(+year, +month - 1, +day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;

  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

const statusVariant: Record<TripStatus, 'upcoming' | 'planning' | 'booked' | 'past'> = {
  upcoming: 'upcoming',
  planning: 'planning',
  booked: 'booked',
  past: 'past',
};

interface ChecklistRule {
  label: string;
  threshold: number;
}

const CHECKLIST: ChecklistRule[] = [
  { label: 'Book flights', threshold: 30 },
  { label: 'Select hotel', threshold: 50 },
  { label: 'Plan activities', threshold: 60 },
  { label: 'Set budget', threshold: 70 },
  { label: 'Organize itinerary', threshold: 85 },
];

const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const fallbackTrip = tripId ? getTripFromStorageOrMock(tripId) : undefined;
  const {
    trip: serviceTrip,
    isLoading: isLoadingServiceTrip,
    error: serviceTripError,
  } = useServiceTrip(tripId);
  const trip = serviceTrip ?? fallbackTrip;

  if (isLoadingServiceTrip && !trip) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center animate-fade-in">
        <div className="rounded-lg border border-neutral-100 bg-white px-5 py-4 text-sm text-neutral-500">
          Loading trip...
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Trip not found
          </h2>
          <p className="text-neutral-500 mb-6">
            The trip you are looking for does not exist.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const flights = getFlightsByTripId(trip.id);
  const hotels = getHotelsByTripId(trip.id);
  const places = getPlacesByTripId(trip.id);
  const itinerary = getItineraryByTripId(trip.id);
  const budget = getBudgetByTripId(trip.id);
  const tripName = getTripDisplayName(trip);
  const routeLabel = getTripRouteLabel(trip);
  const isMultiStop = isMultiStopTrip(trip);
  const orderedStops = [...trip.stops].sort((a, b) => a.order - b.order);

  const selectedFlight = flights.find((f) => f.isSelected);
  const selectedHotel = hotels.find((h) => h.isSelected);
  const savedPlaces = places.filter((p) => p.isSaved).slice(0, 4);
  const displayPlaces = savedPlaces.length > 0 ? savedPlaces : places.slice(0, 4);
  const previewItinerary = itinerary.slice(0, 3);

  const daysPlanned = calcDays(trip.startDate, trip.endDate);
  const totalBudget = budget
    ? budget.categories.reduce((sum, c) => sum + c.allocated, 0)
    : trip.budget;
  const totalSpent = budget
    ? budget.categories.reduce((sum, c) => sum + c.spent, 0)
    : 0;

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      {/* Hero Section */}
      <div className="relative w-full h-64 sm:h-72 md:h-80">
        {trip.image ? (
          <img
            src={trip.image}
            alt={tripName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Edit button */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <Link
            to={`/trip/${trip.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/30 text-white text-sm font-medium bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Trip
          </Link>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
              {tripName}
            </h1>
            <p className="text-white/80 text-sm mb-3">
              {isMultiStop ? routeLabel : orderedStops[0]?.country || trip.country}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                {formatFullDate(trip.startDate)} - {formatFullDate(trip.endDate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                ${trip.budget.toLocaleString()}
              </span>
              <Badge variant={statusVariant[trip.status]}>
                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* TripNav */}
      <TripNav />

      {/* Overview Section Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {serviceTripError && (
          <div className="rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
            Supabase trip details could not be loaded. Showing local trip data instead.
          </div>
        )}

        {/* Summary Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            value={`$${totalBudget.toLocaleString()}`}
            label="Est. Total Cost"
          />
          <StatCard
            icon={<CalendarDays className="w-5 h-5" />}
            value={daysPlanned}
            label="Days Planned"
          />
          <StatCard
            icon={<Plane className="w-5 h-5" />}
            value={flights.length}
            label="Flights Saved"
          />
          <StatCard
            icon={<Building2 className="w-5 h-5" />}
            value={hotels.length}
            label="Hotel Options"
          />
          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            value={places.length}
            label="Places Saved"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            value={`${trip.planningProgress}%`}
            label="Booking Progress"
          />
        </div>

        {/* Stops Route */}
        {orderedStops.length > 0 && (
          <Card hover={false} className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {isMultiStop ? 'Trip Route' : 'Destination'}
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  {isMultiStop ? routeLabel : `${orderedStops[0].name}${orderedStops[0].country ? `, ${orderedStops[0].country}` : ''}`}
                </p>
              </div>
              {isMultiStop && (
                <Badge variant="default">
                  {orderedStops.length} stops
                </Badge>
              )}
            </div>

            <div className={isMultiStop ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4' : 'max-w-md'}>
              {orderedStops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="relative rounded-xl border border-neutral-100 bg-neutral-50 p-4"
                >
                  {isMultiStop && index < orderedStops.length - 1 && (
                    <div className="hidden xl:block absolute top-8 left-full w-4 h-px bg-neutral-200" />
                  )}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold shrink-0">
                      {stop.order}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900">
                        {stop.name}
                      </h3>
                      {stop.country && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {stop.country}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 mt-2">
                        {formatFullDate(stop.startDate)} - {formatFullDate(stop.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Two-column layout for progress + flight/hotel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Planning Progress Checklist */}
          <Card hover={false} className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Planning Progress
            </h2>
            <div className="space-y-3">
              {CHECKLIST.map((item) => {
                const checked = trip.planningProgress >= item.threshold;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    {checked ? (
                      <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-neutral-300 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        checked
                          ? 'text-neutral-700 line-through'
                          : 'text-neutral-600'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5">
              <ProgressBar
                value={trip.planningProgress}
                color="primary"
                showLabel
                size="md"
              />
            </div>
          </Card>

          {/* Selected Flight Preview */}
          <Card hover={false} className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Selected Flight
            </h2>
            {selectedFlight ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {selectedFlight.airline}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {selectedFlight.departureAirportCode} -{' '}
                      {selectedFlight.arrivalAirportCode}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary-600">
                    ${selectedFlight.price}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    {selectedFlight.departureTime} - {selectedFlight.arrivalTime}
                  </span>
                  <span>{selectedFlight.duration}</span>
                  <span>
                    {selectedFlight.stops === 0
                      ? 'Nonstop'
                      : `${selectedFlight.stops} stop${
                          selectedFlight.stops > 1 ? 's' : ''
                        }`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Plane className="w-10 h-10 text-neutral-300 mb-3" />
                <p className="text-neutral-600 font-medium mb-1">
                  No flight selected yet
                </p>
                <Link
                  to="flights"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Browse flights
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Selected Hotel Preview */}
        <Card hover={false} className="overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Selected Hotel
            </h2>
          </div>
          {selectedHotel ? (
            <div className="flex flex-col sm:flex-row gap-0 sm:gap-5 px-6 pb-6">
              <div className="w-full sm:w-48 flex-shrink-0">
                <ImagePlaceholder
                  src={selectedHotel.image}
                  alt={selectedHotel.name}
                  aspectRatio="square"
                  className="rounded-xl"
                />
              </div>
              <div className="flex-1 pt-3 sm:pt-0 space-y-2">
                <h3 className="font-semibold text-neutral-900">
                  {selectedHotel.name}
                </h3>
                <RatingStars
                  rating={selectedHotel.rating}
                  showCount
                  count={selectedHotel.reviewCount}
                  size="sm"
                />
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span className="font-semibold text-primary-600">
                    ${selectedHotel.pricePerNight}
                    <span className="text-neutral-400 font-normal">/night</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {selectedHotel.neighborhood}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
              <Building2 className="w-10 h-10 text-neutral-300 mb-3" />
              <p className="text-neutral-600 font-medium mb-1">
                No hotel selected yet
              </p>
              <Link
                to="hotels"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Browse hotels
              </Link>
            </div>
          )}
        </Card>

        {/* Two-column: Saved Places + Mini Itinerary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Saved Places */}
          <Card hover={false} className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Saved Places
            </h2>
            {displayPlaces.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {displayPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100"
                  >
                    <ImagePlaceholder
                      src={place.image}
                      alt={place.name}
                      aspectRatio="square"
                    />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {place.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default">{place.category}</Badge>
                        <span className="text-xs text-neutral-500">
                          {place.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MapPin className="w-10 h-10 text-neutral-300 mb-3" />
                <p className="text-neutral-500">No places saved yet</p>
              </div>
            )}
          </Card>

          {/* Mini Itinerary Preview */}
          <Card hover={false} className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Itinerary Preview
            </h2>
            {previewItinerary.length > 0 ? (
              <div className="space-y-5">
                {previewItinerary.map((day) => (
                  <div key={day.dayNumber}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-primary-600">
                        Day {day.dayNumber}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {formatFullDate(day.date)}
                      </span>
                    </div>
                    <div className="space-y-1.5 pl-2 border-l-2 border-neutral-100">
                      {([
                        ...day.morning.map((i) => ({
                          ...i,
                          period: 'Morning',
                        })),
                        ...day.afternoon.map((i) => ({
                          ...i,
                          period: 'Afternoon',
                        })),
                        ...day.evening.map((i) => ({
                          ...i,
                          period: 'Evening',
                        })),
                      ] as { period: string; time: string; name: string }[]).map(
                        (item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm py-0.5"
                          >
                            <span className="text-xs text-neutral-400 w-12 flex-shrink-0">
                              {item.time}
                            </span>
                            <span className="text-neutral-700 truncate">
                              {item.name}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="w-10 h-10 text-neutral-300 mb-3" />
                <p className="text-neutral-500">No itinerary planned yet</p>
              </div>
            )}
          </Card>
        </div>

        {/* Budget Summary */}
        {budget && (
          <Card hover={false} className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Budget Summary
            </h2>
            <div className="space-y-4">
              {budget.categories.map((cat) => {
                const pct = cat.allocated > 0
                  ? Math.min(100, (cat.spent / cat.allocated) * 100)
                  : 0;
                const color =
                  pct >= 100
                    ? 'error'
                    : pct >= 75
                      ? 'warning'
                      : 'primary';
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-neutral-700">
                        <span className="mr-1.5">{cat.icon}</span>
                        {cat.name}
                      </span>
                      <span className="text-sm text-neutral-500">
                        ${cat.spent.toLocaleString()} / $
                        {cat.allocated.toLocaleString()}
                      </span>
                    </div>
                    <ProgressBar value={pct} color={color} size="sm" />
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-base font-semibold text-neutral-900">
                Total
              </span>
              <span className="text-base font-semibold text-neutral-900">
                ${totalSpent.toLocaleString()} / $
                {totalBudget.toLocaleString()}
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TripDetails;
