import React, { useState, useMemo } from 'react';
import { Compass } from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getPlacesByTripId } from '../data/places';
import FilterTabs from '../components/ui/FilterTabs';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import PlaceCard from '../components/explore/PlaceCard';
import PlaceDetailModal from '../components/explore/PlaceDetailModal';
import type { Place, PlaceCategory } from '../types';

const CATEGORIES: (PlaceCategory | 'All')[] = [
  'All',
  'Restaurants',
  'Cafes',
  'Museums',
  'Outdoor',
  'Nightlife',
  'Shopping',
  'Tours',
  'Landmarks',
  'Hidden Gems',
];

const Explore: React.FC = () => {
  const trip = useTrip();
  const allPlaces = trip ? getPlacesByTripId(trip.id) : [];

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPlaces, setSavedPlaces] = useState<Set<string>>(
    new Set(allPlaces.filter((p) => p.isSaved).map((p) => p.id))
  );
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const filteredPlaces = useMemo(() => {
    let places = allPlaces;

    // Filter by category
    if (activeCategory !== 'All') {
      places = places.filter((p) => p.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      places = places.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.location.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Merge saved state
    return places.map((p) => ({
      ...p,
      isSaved: savedPlaces.has(p.id),
    }));
  }, [allPlaces, activeCategory, searchQuery, savedPlaces]);

  const handleSave = (placeId: string) => {
    setSavedPlaces((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });
  };

  const handleAddToItinerary = (placeId: string) => {
    // Placeholder: would add to itinerary
    const place = allPlaces.find((p) => p.id === placeId);
    if (place) {
      alert(`Added "${place.name}" to your itinerary!`);
    }
  };

  const handleViewDetails = (placeId: string) => {
    const place = allPlaces.find((p) => p.id === placeId);
    if (place) {
      setSelectedPlace({ ...place, isSaved: savedPlaces.has(placeId) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Explore</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Discover places and activities in {trip?.destination || 'your destination'}
        </p>
      </div>

      {/* Category Tabs */}
      <FilterTabs
        tabs={CATEGORIES}
        activeTab={activeCategory}
        onChange={setActiveCategory}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search places by name, location, or tag..."
        className="max-w-md"
      />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'} found
          {activeCategory !== 'All' && ` in ${activeCategory}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      {/* Place Cards Grid */}
      {filteredPlaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onSave={handleSave}
              onAddToItinerary={handleAddToItinerary}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Compass className="w-8 h-8" />}
          title="No places found"
          description={
            searchQuery
              ? `No places match "${searchQuery}". Try a different search term or category.`
              : `No places available in the ${activeCategory} category. Try selecting a different category.`
          }
          actionLabel="Clear filters"
          onAction={() => {
            setSearchQuery('');
            setActiveCategory('All');
          }}
        />
      )}

      {/* Place Detail Modal */}
      <PlaceDetailModal
        place={selectedPlace}
        isOpen={selectedPlace !== null}
        onClose={() => setSelectedPlace(null)}
      />
    </div>
  );
};

export default Explore;
