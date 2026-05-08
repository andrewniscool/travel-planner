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
import { trips } from '../data/trips';
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

const tabs = ['All', 'Upcoming', 'Planning', 'Booked', 'Past'];

const formatDateRange = (start: string, end: string) => {
  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  const startFmt = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endFmt = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startFmt} - ${endFmt}`;
};

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tripList, setTripList] = useState(trips);

  const filteredTrips = useMemo(() => {
    let result = tripList;

    if (activeTab !== 'All') {
      const statusFilter = activeTab.toLowerCase() as 'upcoming' | 'planning' | 'booked' | 'past';
      result = result.filter((trip) => trip.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (trip) =>
          trip.destination.toLowerCase().includes(query) ||
          trip.country.toLowerCase().includes(query) ||
          trip.vibe.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activeTab, searchQuery, tripList]);

  const upcomingCount = tripList.filter((t) => t.status === 'upcoming').length;
  const totalBudget = tripList.reduce((sum, trip) => sum + trip.budget, 0);

  const handleDeleteTrip = (tripId: string, destination: string) => {
    const confirmed = window.confirm(`Delete the ${destination} trip from this dashboard?`);
    if (!confirmed) return;

    setTripList((currentTrips) => currentTrips.filter((trip) => trip.id !== tripId));
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
          {filteredTrips.map((trip) => (
            <Card key={trip.id} hover={false}>
              {/* Image with overlaid destination */}
              <div className="relative">
                <ImagePlaceholder
                  src={trip.image}
                  alt={trip.destination}
                  aspectRatio="video"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-white">
                    {trip.destination}, {trip.country}
                  </h3>
                </div>
              </div>

              {/* Trip Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
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
                  <Button
                    variant="danger"
                    size="md"
                    className="px-3"
                    aria-label={`Delete ${trip.destination} trip`}
                    onClick={() => handleDeleteTrip(trip.id, trip.destination)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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
