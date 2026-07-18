import React, { useMemo, useState } from 'react';
import { Luggage, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getPlacesByTripId } from '../data/places';
import { getTripDisplayName, getTripRouteLabel } from '../data/trips';
import NextStepsPanel from '../components/dashboard/NextStepsPanel';
import NextTripHero from '../components/dashboard/NextTripHero';
import StatStrip from '../components/dashboard/StatStrip';
import TripCard from '../components/dashboard/TripCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import FilterTabs from '../components/ui/FilterTabs';
import SearchBar from '../components/ui/SearchBar';
import { useTripWorkspace } from '../hooks/useTripWorkspace';
import { selectNextTrip } from '../utils/tripDisplay';

const tabs = ['All', 'Upcoming', 'Planning', 'Booked', 'Past'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    trips: tripList,
    isLoading: isLoadingServiceTrips,
    error: serviceTripsError,
    canDeleteTrips: canDeleteFromDashboard,
    deleteTrip,
  } = useTripWorkspace();
  const filteredTrips = useMemo(() => {
    let result = tripList;
    if (activeTab !== 'All')
      result = result.filter((trip) => trip.status === activeTab.toLowerCase());
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((trip) =>
        [
          getTripDisplayName(trip),
          getTripRouteLabel(trip),
          trip.destination,
          trip.country,
          trip.vibe,
          ...trip.stops.flatMap((stop) => [stop.name, stop.country ?? '']),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query),
      );
    }
    return result;
  }, [activeTab, searchQuery, tripList]);
  const nextTrip = useMemo(() => selectNextTrip(tripList), [tripList]);
  const upcomingCount = tripList.filter((trip) => trip.status === 'upcoming').length;
  const totalBudget = tripList.reduce((sum, trip) => sum + trip.budget, 0);
  const savedPlaces = useMemo(
    () =>
      tripList.reduce(
        (count, trip) => count + getPlacesByTripId(trip.id).filter((place) => place.isSaved).length,
        0,
      ),
    [tripList],
  );
  const handleDeleteTrip = (tripId: string, tripName: string) => {
    if (!window.confirm(`Delete ${tripName} from this dashboard?`)) return;
    deleteTrip(tripId);
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-app-text-strong sm:text-[1.75rem]">
            My Trips
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">
            Welcome back — pick up where you left off.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search trips..."
            className="w-44 sm:w-64"
          />
          <Link to="/create-trip">
            <Button size="md">
              <Plus className="mr-2 h-4 w-4" />
              Create New Trip
            </Button>
          </Link>
        </div>
      </div>
      {serviceTripsError && (
        <div className="rounded-xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          Supabase trips could not be loaded. Showing local trips instead.
        </div>
      )}
      {isLoadingServiceTrips && tripList.length === 0 && (
        <div className="rounded-xl border border-app-border-muted bg-app-surface px-4 py-3 text-sm text-app-text-muted">
          Loading trips...
        </div>
      )}
      {nextTrip && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <NextTripHero trip={nextTrip} />
          <NextStepsPanel trip={nextTrip} />
        </div>
      )}
      {tripList.length > 0 && (
        <StatStrip
          upcomingCount={upcomingCount}
          plannedSpend={totalBudget}
          savedPlaces={savedPlaces}
        />
      )}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-app-text-strong">All trips</h2>
            <p className="text-xs text-app-text-muted">
              {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
            </p>
          </div>
          <FilterTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />
        </div>
        {filteredTrips.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                canDelete={canDeleteFromDashboard}
                onDelete={handleDeleteTrip}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Luggage className="h-8 w-8" />}
            title="No trips found"
            description={
              searchQuery
                ? 'No trips match your search. Try a different search term.'
                : `No ${activeTab.toLowerCase()} trips yet. Create a new trip to get started.`
            }
            actionLabel="Create Trip"
            onAction={() => navigate('/create-trip')}
          />
        )}
      </section>
    </div>
  );
};
export default Dashboard;
