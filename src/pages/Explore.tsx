import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getPlacesByTripId } from '../data/places';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  getAuthenticatedUserId,
  savedPlaceService,
} from '../services/travelDataService';
import { getPlaceIdFromSavedPlace } from '../services/tripMappers';
import FilterTabs from '../components/ui/FilterTabs';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import PlaceCard from '../components/explore/PlaceCard';
import PlaceDetailModal from '../components/explore/PlaceDetailModal';
import StopSelector from '../components/trips/StopSelector';
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

const LOCAL_SAVED_PLACES_KEY = 'travel-builder:saved-places';

const loadSavedPlaces = (tripId: string, initialSavedPlaceIds: string[]) => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(LOCAL_SAVED_PLACES_KEY) ?? '{}',
    ) as Record<string, string[]>;
    return new Set(stored[tripId] ?? initialSavedPlaceIds);
  } catch {
    return new Set(initialSavedPlaceIds);
  }
};

const persistSavedPlaces = (tripId: string, placeIds: Set<string>) => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(LOCAL_SAVED_PLACES_KEY) ?? '{}',
    ) as Record<string, string[]>;
    window.localStorage.setItem(
      LOCAL_SAVED_PLACES_KEY,
      JSON.stringify({ ...stored, [tripId]: [...placeIds] }),
    );
  } catch {
    window.localStorage.setItem(
      LOCAL_SAVED_PLACES_KEY,
      JSON.stringify({ [tripId]: [...placeIds] }),
    );
  }
};

const Explore: React.FC = () => {
  const { tripId: routeTripId } = useParams<{ tripId: string }>();
  const fallbackTrip = useTrip();
  const {
    trip: serviceTrip,
    error: serviceTripError,
    source: tripSource,
  } = useServiceTrip(routeTripId);
  const trip = serviceTrip ?? fallbackTrip;
  const allPlaces = useMemo(() => (trip ? getPlacesByTripId(trip.id) : []), [trip]);
  const initialSavedPlaceIds = useMemo(
    () => allPlaces.filter((place) => place.isSaved).map((place) => place.id),
    [allPlaces],
  );
  const orderedStops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.order - b.order) : []),
    [trip]
  );
  const [selectedStopId, setSelectedStopId] = useState(orderedStops[0]?.id ?? '');

  useEffect(() => {
    if (orderedStops.length > 0 && !orderedStops.some((stop) => stop.id === selectedStopId)) {
      setSelectedStopId(orderedStops[0].id);
    }
  }, [orderedStops, selectedStopId]);

  const selectedStop = useMemo(
    () => orderedStops.find((stop) => stop.id === selectedStopId) ?? orderedStops[0],
    [orderedStops, selectedStopId]
  );

  const stopPlaces = useMemo(() => {
    if (!selectedStop) return allPlaces;
    return allPlaces.filter((place) =>
      place.stopId === selectedStop.id || (!place.stopId && orderedStops.length <= 1)
    );
  }, [allPlaces, orderedStops.length, selectedStop]);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPlaces, setSavedPlaces] = useState<Set<string>>(() =>
    trip ? loadSavedPlaces(trip.id, initialSavedPlaceIds) : new Set(),
  );
  const [savedPlacesSource, setSavedPlacesSource] = useState<'supabase' | 'fallback'>('fallback');
  const [savedPlacesError, setSavedPlacesError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    if (!trip) return;
    const localSavedPlaces = loadSavedPlaces(trip.id, initialSavedPlaceIds);
    let cancelled = false;

    setSavedPlaces(localSavedPlaces);
    setSavedPlacesSource('fallback');
    setSavedPlacesError(null);

    async function loadSupabaseSavedPlaces() {
      if (!trip || tripSource !== 'supabase') return;

      try {
        const userId = await getAuthenticatedUserId();
        if (!userId) return;

        const rows = await savedPlaceService.listSavedPlaces(trip.id);
        if (cancelled) return;

        const savedPlaceIds = rows
          .filter((row) => row.is_saved)
          .map(getPlaceIdFromSavedPlace);
        const nextSavedPlaces = new Set([
          ...initialSavedPlaceIds,
          ...savedPlaceIds,
        ]);

        setSavedPlaces(nextSavedPlaces);
        persistSavedPlaces(trip.id, nextSavedPlaces);
        setSavedPlacesSource('supabase');
      } catch {
        if (cancelled) return;
        setSavedPlacesError('Supabase saved places could not be loaded. Showing local saved places instead.');
      }
    }

    void loadSupabaseSavedPlaces();

    return () => {
      cancelled = true;
    };
  }, [initialSavedPlaceIds, trip, tripSource]);

  const filteredPlaces = useMemo(() => {
    let places = stopPlaces;

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
  }, [stopPlaces, activeCategory, searchQuery, savedPlaces]);

  const handleSave = async (placeId: string) => {
    if (!trip) return;
    const place = allPlaces.find((item) => item.id === placeId);
    if (!place) return;

    const next = new Set(savedPlaces);
    if (next.has(placeId)) next.delete(placeId);
    else next.add(placeId);

    setSavedPlaces(next);
    persistSavedPlaces(trip.id, next);

    if (savedPlacesSource !== 'supabase') return;

    try {
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        setSavedPlacesError('Saved locally. Sign-in is not connected yet.');
        setSavedPlacesSource('fallback');
        return;
      }

      await savedPlaceService.upsertSavedPlace(trip.id, place, next.has(placeId));
      setSavedPlacesError(null);
    } catch {
      setSavedPlacesError('Supabase saved place update failed. Saved locally instead.');
      setSavedPlacesSource('fallback');
    }
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
        <h1 className="text-2xl font-bold text-neutral-900">
          {orderedStops.length > 1 && selectedStop ? `Explore ${selectedStop.name}` : 'Explore'}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Discover places and activities in {selectedStop?.name || trip?.destination || 'your destination'}
        </p>
        {(serviceTripError || savedPlacesError) && (
          <p className="text-sm text-warning-700 mt-2">
            {savedPlacesError || 'Supabase trip data could not be loaded. Showing local places instead.'}
          </p>
        )}
      </div>

      <StopSelector
        stops={orderedStops}
        selectedStopId={selectedStop?.id}
        onChange={setSelectedStopId}
      />

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
      {stopPlaces.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8" />}
          title={selectedStop ? `No places in ${selectedStop.name} yet` : 'No places yet'}
          description="Restaurants, activities, and saved places for this stop will appear here once they are added."
        />
      ) : filteredPlaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onSave={(placeId) => void handleSave(placeId)}
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
        place={
          selectedPlace
            ? { ...selectedPlace, isSaved: savedPlaces.has(selectedPlace.id) }
            : null
        }
        isOpen={selectedPlace !== null}
        onClose={() => setSelectedPlace(null)}
        onSave={(placeId) => void handleSave(placeId)}
        onAddToItinerary={handleAddToItinerary}
      />
    </div>
  );
};

export default Explore;
