import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MapPin,
  CalendarDays,
  Plane,
  Building2,
  DollarSign,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { getTripFromStorageOrMock } from '../hooks/useTrip';
import { useServiceTrip } from '../hooks/useServiceTrips';
import { getFlightsByTripId } from '../data/flights';
import { getHotelsByTripId } from '../data/hotels';
import { getPlacesByTripId } from '../data/places';
import { getItineraryByTripId } from '../data/itinerary';
import { getBudgetByTripId } from '../data/budget';
import { getTripDisplayName, getTripRouteLabel, isMultiStopTrip } from '../data/trips';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import ImagePlaceholder from '../components/ui/ImagePlaceholder';
import TripNav from '../components/layout/TripNav';
import TripHero from '../components/trip-details/TripHero';
import TripRouteCard from '../components/trip-details/TripRouteCard';
import PlanningProgressCard from '../components/trip-details/PlanningProgressCard';
import SelectedFlightCard from '../components/trip-details/SelectedFlightCard';
import SelectedHotelCard from '../components/trip-details/SelectedHotelCard';

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
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Trip not found</h2>
          <p className="text-neutral-500 mb-6">The trip you are looking for does not exist.</p>
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
  const totalSpent = budget ? budget.categories.reduce((sum, c) => sum + c.spent, 0) : 0;

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <TripHero
        tripId={trip.id}
        image={trip.image}
        tripName={tripName}
        routeLabel={isMultiStop ? routeLabel : orderedStops[0]?.country || trip.country}
        dateLabel={`${formatFullDate(trip.startDate)} - ${formatFullDate(trip.endDate)}`}
        travelers={trip.travelers}
        budget={trip.budget}
        status={trip.status}
      />

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

        <TripRouteCard
          stops={orderedStops}
          isMultiStop={isMultiStop}
          routeLabel={routeLabel}
          formatDate={formatFullDate}
        />

        {/* Two-column layout for progress + flight/hotel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlanningProgressCard
            checklist={CHECKLIST}
            progress={trip.planningProgress}
          />

          <SelectedFlightCard flight={selectedFlight} />
        </div>

        <SelectedHotelCard hotel={selectedHotel} />

        {/* Two-column: Saved Places + Mini Itinerary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Saved Places */}
          <Card hover={false} className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Saved Places</h2>
            {displayPlaces.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {displayPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100"
                  >
                    <ImagePlaceholder src={place.image} alt={place.name} aspectRatio="square" />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {place.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default">{place.category}</Badge>
                        <span className="text-xs text-neutral-500">{place.rating}</span>
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
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Itinerary Preview</h2>
            {previewItinerary.length > 0 ? (
              <div className="space-y-5">
                {previewItinerary.map((day) => (
                  <div key={day.dayNumber}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-primary-600">
                        Day {day.dayNumber}
                      </span>
                      <span className="text-xs text-neutral-400">{formatFullDate(day.date)}</span>
                    </div>
                    <div className="space-y-1.5 pl-2 border-l-2 border-neutral-100">
                      {(
                        [
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
                        ] as { period: string; time: string; name: string }[]
                      ).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm py-0.5">
                          <span className="text-xs text-neutral-400 w-12 flex-shrink-0">
                            {item.time}
                          </span>
                          <span className="text-neutral-700 truncate">{item.name}</span>
                        </div>
                      ))}
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
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Budget Summary</h2>
            <div className="space-y-4">
              {budget.categories.map((cat) => {
                const pct =
                  cat.allocated > 0 ? Math.min(100, (cat.spent / cat.allocated) * 100) : 0;
                const color = pct >= 100 ? 'error' : pct >= 75 ? 'warning' : 'primary';
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-neutral-700">
                        <span className="mr-1.5">{cat.icon}</span>
                        {cat.name}
                      </span>
                      <span className="text-sm text-neutral-500">
                        ${cat.spent.toLocaleString()} / ${cat.allocated.toLocaleString()}
                      </span>
                    </div>
                    <ProgressBar value={pct} color={color} size="sm" />
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-base font-semibold text-neutral-900">Total</span>
              <span className="text-base font-semibold text-neutral-900">
                ${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TripDetails;
