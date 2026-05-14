import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  MapPin,
  Calendar,
  Bookmark,
  Wallet,
  Users,
  Luggage,
  Trash2,
} from 'lucide-react';
import {
  getTripDisplayName,
  getTripRouteLabel,
  isMultiStopTrip,
  LOCAL_TRIPS_STORAGE_KEY,
  trips,
} from '../data/trips';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useServiceTrips } from '../hooks/useServiceTrips';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import SearchBar from '../components/ui/SearchBar';
import FilterTabs from '../components/ui/FilterTabs';
import StatCard from '../components/ui/StatCard';
import PriceTag from '../components/ui/PriceTag';
import ImagePlaceholder from '../components/ui/ImagePlaceholder';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import type { Trip } from '../types';

const tabs = ['All', 'Upcoming', 'Planning', 'Booked', 'Past'];

const formatDateRange = (start: string, end: string) => {
  if (!start && !end) return 'Dates TBD';
  if (!start) return `Until ${new Date(`${end}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  if (!end) return `From ${new Date(`${start}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  const startFmt = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endFmt = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startFmt} - ${endFmt}`;
};

const getTripLocationLabel = (trip: Trip) => {
  if (isMultiStopTrip(trip)) return getTripRouteLabel(trip);
  const [stop] = trip.stops;
  if (stop?.country) return `${stop.name}, ${stop.country}`;
  return stop?.name || [trip.destination, trip.country].filter(Boolean).join(', ');
};

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [localTrips, setLocalTrips] = useLocalStorage<Trip[]>(LOCAL_TRIPS_STORAGE_KEY, []);
  const [deletedMockTripIds, setDeletedMockTripIds] = useState<Set<string>>(new Set());
  const {
    trips: serviceTrips,
    isLoading: isLoadingServiceTrips,
    error: serviceTripsError,
    source: tripsSource,
  } = useServiceTrips();
  const fallbackTripList = useMemo(
    () => {
      const localTripIds = new Set(localTrips.map((trip) => trip.id));
      return [
        ...trips.filter(
          (trip) =>
            !deletedMockTripIds.has(trip.id) && !localTripIds.has(trip.id),
        ),
        ...localTrips,
      ];
    },
    [deletedMockTripIds, localTrips],
  );
  const tripList = serviceTrips ?? fallbackTripList;
  const canDeleteFromDashboard = tripsSource === 'fallback';

  const filteredTrips = useMemo(() => {
    let result = tripList;

    if (activeTab !== 'All') {
      const statusFilter = activeTab.toLowerCase() as 'upcoming' | 'planning' | 'booked' | 'past';
      result = result.filter((trip) => trip.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (trip) => {
          const searchable = [
            getTripDisplayName(trip),
            getTripRouteLabel(trip),
            trip.destination,
            trip.country,
            trip.vibe,
            ...trip.stops.flatMap((stop) => [stop.name, stop.country ?? '']),
          ].join(' ').toLowerCase();

          return searchable.includes(query);
        }
      );
    }

    return result;
  }, [activeTab, searchQuery, tripList]);

  const upcomingCount = tripList.filter((t) => t.status === 'upcoming').length;
  const totalBudget = tripList.reduce((sum, trip) => sum + trip.budget, 0);

  const handleDeleteTrip = (tripId: string, tripName: string) => {
    const confirmed = window.confirm(`Delete ${tripName} from this dashboard?`);
    if (!confirmed) return;

    if (localTrips.some((trip) => trip.id === tripId)) {
      setLocalTrips((currentTrips) => currentTrips.filter((trip) => trip.id !== tripId));
    } else {
      setDeletedMockTripIds((current) => new Set([...current, tripId]));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">My Trips</h1>
        <div className="flex items-center gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search trips..."
            className="w-48 sm:w-64"
          />
          <Link to="/create-trip">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              Create New Trip
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <FilterTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {isLoadingServiceTrips && (
        <div className="rounded-lg border border-neutral-100 bg-white px-4 py-3 text-sm text-neutral-500">
          Loading trips...
        </div>
      )}

      {serviceTripsError && (
        <div className="rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          Supabase trips could not be loaded. Showing local trips instead.
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MapPin className="w-5 h-5" />}
          value={tripList.length}
          label="Total Trips"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          value={upcomingCount}
          label="Upcoming Trips"
        />
        <StatCard
          icon={<Bookmark className="w-5 h-5" />}
          value="24"
          label="Saved Places"
        />
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(totalBudget)}
          label="Est. Spending"
        />
      </div>

      {/* Trip Cards Grid */}
      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const tripName = getTripDisplayName(trip);
            const locationLabel = getTripLocationLabel(trip);

            return (
              <Card key={trip.id} hover={false}>
                {/* Image with overlaid destination */}
                <div className="relative">
                  <ImagePlaceholder
                    src={trip.image}
                    alt={tripName}
                    aspectRatio="video"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white">
                      {tripName}
                    </h3>
                    <p className="text-sm text-white/85 mt-0.5 line-clamp-1">
                      {locationLabel}
                    </p>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    <span className="line-clamp-1">{locationLabel}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span>{trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={trip.status as 'upcoming' | 'planning' | 'booked' | 'past'}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </Badge>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                      {trip.vibe}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Est. Budget</span>
                    <PriceTag amount={trip.budget} size="sm" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-500">Planning progress</span>
                      <span className="text-xs font-medium text-neutral-600">{trip.planningProgress}%</span>
                    </div>
                    <ProgressBar
                      value={trip.planningProgress}
                      color="primary"
                      size="sm"
                      showLabel={false}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link
                      to={`/trip/${trip.id}`}
                      className="block flex-1"
                    >
                      <Button variant="outline" size="md" className="w-full">
                        View Trip
                      </Button>
                    </Link>
                    {canDeleteFromDashboard && (
                      <Button
                        variant="danger"
                        size="md"
                        className="px-3"
                        aria-label={`Delete ${tripName}`}
                        onClick={() => handleDeleteTrip(trip.id, tripName)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Luggage className="w-8 h-8" />}
          title="No trips found"
          description={
            searchQuery
              ? 'No trips match your search. Try a different search term.'
              : `No ${activeTab.toLowerCase()} trips yet. Create a new trip to get started.`
          }
          actionLabel="Create Trip"
          onAction={() => {
            window.location.href = '/create-trip';
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
