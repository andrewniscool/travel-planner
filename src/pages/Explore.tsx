import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getPlacesByTripId } from '../data/places';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  getAuthenticatedUserId,
  itineraryService,
  locationRefService,
  savedPlaceService,
} from '../services/travelDataService';
import {
  getPlaceIdFromSavedPlace,
  mapLocationRefRowToLocationRef,
  mapSavedPlaceRowToPlace,
} from '../services/tripMappers';
import { placesService } from '../services/placesService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import FilterTabs from '../components/ui/FilterTabs';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import PlaceCard from '../components/explore/PlaceCard';
import PlaceDetailModal from '../components/explore/PlaceDetailModal';
import StopSelector from '../components/trips/StopSelector';
import type {
  ItineraryItemType,
  LocationRef,
  Place,
  PlaceCategory,
  TimeOfDay,
} from '../types';
import type { ItineraryItemInsert } from '../services/supabaseTypes';

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
const GOOGLE_PLACE_IMAGE =
  'https://images.pexels.com/photos/2422461/pexels-photo-2422461.jpeg?auto=compress&cs=tinysrgb&w=600';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

const getCategoryFromGoogleTypes = (
  location: LocationRef,
  activeCategory: string,
): PlaceCategory => {
  if (activeCategory !== 'All') return activeCategory as PlaceCategory;

  const types = location.placeTypes ?? [];
  if (types.some((type) => ['restaurant', 'meal_takeaway', 'food'].includes(type))) {
    return 'Restaurants';
  }
  if (types.some((type) => ['cafe', 'bakery'].includes(type))) return 'Cafes';
  if (types.some((type) => ['museum', 'art_gallery'].includes(type))) return 'Museums';
  if (types.some((type) => ['park', 'campground', 'tourist_attraction'].includes(type))) {
    return 'Outdoor';
  }
  if (types.some((type) => ['bar', 'night_club'].includes(type))) return 'Nightlife';
  if (types.some((type) => ['shopping_mall', 'store'].includes(type))) return 'Shopping';
  if (types.some((type) => ['travel_agency'].includes(type))) return 'Tours';

  return 'Landmarks';
};

const mapLocationRefToPlace = (
  tripId: string,
  stopId: string | undefined,
  location: LocationRef,
  activeCategory: string,
): Place => {
  const category = getCategoryFromGoogleTypes(location, activeCategory);
  const tags = location.placeTypes?.slice(0, 3).map((type) => type.replace(/_/g, ' ')) ?? [];

  return {
    id: location.googlePlaceId ? `google-${location.googlePlaceId}` : location.id,
    tripId,
    stopId,
    name: location.displayName ?? location.name,
    image: location.photoUrls?.[0] ?? GOOGLE_PLACE_IMAGE,
    category,
    rating: location.rating ?? 0,
    reviewCount: location.reviewCount ?? 0,
    priceRange: location.priceRange ?? location.priceLevel ?? 'Not listed',
    location: location.formattedAddress ?? location.name,
    locationRef: location,
    reviewSnippet: location.formattedAddress
      ? `Found near ${location.formattedAddress}.`
      : 'Found through Google Places.',
    tags,
    description: location.formattedAddress,
    hours: location.regularOpeningHours?.[0],
  };
};

const getPlaceItineraryType = (place: Place): ItineraryItemType => {
  if (place.category === 'Restaurants' || place.category === 'Cafes') {
    return 'restaurant';
  }

  return 'activity';
};

const getPlaceItineraryTimeOfDay = (place: Place): TimeOfDay => {
  if (place.category === 'Restaurants') return 'evening';
  if (place.category === 'Cafes') return 'morning';
  return 'afternoon';
};

const getPersistedLocationRefId = (location?: LocationRef) =>
  location?.id && UUID_PATTERN.test(location.id) ? location.id : null;

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
  const [savedPlacesError, setSavedPlacesError] = useState<string | null>(null);
  const [serviceSavedPlaces, setServiceSavedPlaces] = useState<Place[]>([]);
  const [googlePlaces, setGooglePlaces] = useState<Place[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [googlePlacesError, setGooglePlacesError] = useState<string | null>(null);
  const [addingItineraryPlaceIds, setAddingItineraryPlaceIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [itineraryMessage, setItineraryMessage] = useState<string | null>(null);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    if (!trip) return;
    const localSavedPlaces = loadSavedPlaces(trip.id, initialSavedPlaceIds);
    let cancelled = false;

    setSavedPlaces(localSavedPlaces);
    setServiceSavedPlaces([]);
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
        const nextServiceSavedPlaces = rows
          .filter((row) => row.is_saved)
          .map((row) => mapSavedPlaceRowToPlace(row, trip.id));
        const nextSavedPlaces = new Set([
          ...initialSavedPlaceIds,
          ...savedPlaceIds,
        ]);

        setServiceSavedPlaces(nextServiceSavedPlaces);
        setSavedPlaces(nextSavedPlaces);
        persistSavedPlaces(trip.id, nextSavedPlaces);
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

  useEffect(() => {
    if (!trip || !selectedStop || tripSource !== 'supabase' || !isSupabaseConfigured) {
      setGooglePlaces([]);
      setIsSearchingGoogle(false);
      setGooglePlacesError(null);
      return;
    }

    const trimmedSearch = searchQuery.trim();
    const shouldSearchGoogle = trimmedSearch.length >= 2 || activeCategory !== 'All';
    if (!shouldSearchGoogle) {
      setGooglePlaces([]);
      setIsSearchingGoogle(false);
      setGooglePlacesError(null);
      return;
    }

    const searchLabel = activeCategory === 'All' ? 'places' : activeCategory.toLowerCase();
    const textQuery = `${trimmedSearch || searchLabel} in ${selectedStop.name}`;
    const locationBias =
      selectedStop.locationRef?.latitude != null && selectedStop.locationRef?.longitude != null
        ? {
            circle: {
              center: {
                latitude: selectedStop.locationRef.latitude,
                longitude: selectedStop.locationRef.longitude,
              },
              radius: 15000,
            },
          }
        : undefined;
    let cancelled = false;

    setIsSearchingGoogle(true);
    setGooglePlacesError(null);

    const timeoutId = window.setTimeout(() => {
      getAuthenticatedUserId()
        .then((userId) => {
          if (!userId) return [];
          return placesService.textSearch(textQuery, {
            locationBias,
            maxResultCount: 9,
          });
        })
        .then((locations) => {
          if (cancelled) return;
          setGooglePlaces(
            locations.map((location) =>
              mapLocationRefToPlace(
                trip.id,
                selectedStop.id,
                location,
                activeCategory,
              ),
            ),
          );
        })
        .catch(() => {
          if (cancelled) return;
          setGooglePlaces([]);
          setGooglePlacesError('Google Places search is unavailable. Showing saved and local places instead.');
        })
        .finally(() => {
          if (cancelled) return;
          setIsSearchingGoogle(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeCategory, searchQuery, selectedStop, trip, tripSource]);

  const serviceStopPlaces = useMemo(() => {
    if (!selectedStop) return serviceSavedPlaces;
    return serviceSavedPlaces.filter((place) =>
      place.stopId === selectedStop.id || (!place.stopId && orderedStops.length <= 1)
    );
  }, [orderedStops.length, selectedStop, serviceSavedPlaces]);

  const availablePlaces = useMemo(() => {
    const placesById = new Map<string, Place>();
    [...stopPlaces, ...serviceStopPlaces, ...googlePlaces].forEach((place) => {
      placesById.set(place.id, place);
    });
    return [...placesById.values()];
  }, [googlePlaces, serviceStopPlaces, stopPlaces]);

  const filteredPlaces = useMemo(() => {
    let places = availablePlaces;

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
  }, [availablePlaces, activeCategory, searchQuery, savedPlaces]);

  const handleSave = async (placeId: string) => {
    if (!trip) return;
    const place = availablePlaces.find((item) => item.id === placeId);
    if (!place) return;

    const next = new Set(savedPlaces);
    if (next.has(placeId)) next.delete(placeId);
    else next.add(placeId);

    setSavedPlaces(next);
    persistSavedPlaces(trip.id, next);

    if (tripSource !== 'supabase') return;

    try {
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        setSavedPlacesError('Saved locally. Sign-in is not connected yet.');
        return;
      }

      const placeToSave =
        place.locationRef?.googlePlaceId && next.has(placeId)
          ? {
              ...place,
              locationRef: mapLocationRefRowToLocationRef(
                await locationRefService.upsertGoogleLocationRef(
                  userId,
                  place.locationRef,
                ),
              ),
            }
          : place;

      await savedPlaceService.upsertSavedPlace(
        trip.id,
        placeToSave,
        next.has(placeId),
      );
      setSavedPlacesError(null);
    } catch {
      setSavedPlacesError('Supabase saved place update failed. Saved locally instead.');
    }
  };

  const handleAddToItinerary = (placeId: string) => {
    void addPlaceToItinerary(placeId);
  };

  const addPlaceToItinerary = async (placeId: string) => {
    if (!trip) return;
    const place = availablePlaces.find((p) => p.id === placeId);
    if (!place) return;

    setItineraryMessage(null);
    setItineraryError(null);

    if (tripSource !== 'supabase') {
      setItineraryError('Add to itinerary is available after this trip is saved to Supabase.');
      return;
    }

    setAddingItineraryPlaceIds((current) => new Set(current).add(placeId));

    try {
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        setItineraryError('Sign in again to add places to your itinerary.');
        return;
      }

      const locationRef =
        place.locationRef?.googlePlaceId
          ? mapLocationRefRowToLocationRef(
              await locationRefService.upsertGoogleLocationRef(
                userId,
                place.locationRef,
              ),
            )
          : place.locationRef;
      const itineraryDate =
        selectedStop?.startDate || trip.startDate || new Date().toISOString().slice(0, 10);
      const payload: ItineraryItemInsert = {
        trip_id: trip.id,
        stop_id: selectedStop?.id ?? place.stopId ?? null,
        location_ref_id: getPersistedLocationRefId(locationRef),
        title: place.locationRef?.displayName || place.name,
        item_type: getPlaceItineraryType(place),
        date: itineraryDate,
        time_of_day: getPlaceItineraryTimeOfDay(place),
        location_text: locationRef?.formattedAddress ?? place.location,
        estimated_cost: 0,
        notes: place.description || place.reviewSnippet || 'Added from Explore.',
        order_index: Date.now() % 1_000_000,
      };

      await itineraryService.createItineraryItem(payload);
      setItineraryMessage(`Added "${payload.title}" to your itinerary.`);
    } catch {
      setItineraryError('Could not add this place to your itinerary. Try again.');
    } finally {
      setAddingItineraryPlaceIds((current) => {
        const next = new Set(current);
        next.delete(placeId);
        return next;
      });
    }
  };

  const handleViewDetails = (placeId: string) => {
    const place = availablePlaces.find((p) => p.id === placeId);
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
        {(serviceTripError || savedPlacesError || googlePlacesError || itineraryError) && (
          <p className="text-sm text-warning-700 mt-2">
            {itineraryError ||
              savedPlacesError ||
              googlePlacesError ||
              'Supabase trip data could not be loaded. Showing local places instead.'}
          </p>
        )}
        {itineraryMessage && (
          <p className="text-sm text-success-700 mt-2">{itineraryMessage}</p>
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
          {isSearchingGoogle && ' · searching Google Places'}
        </p>
      </div>

      {/* Place Cards Grid */}
      {availablePlaces.length === 0 && !isSearchingGoogle ? (
        <EmptyState
          icon={<Compass className="w-8 h-8" />}
          title={selectedStop ? `No places in ${selectedStop.name} yet` : 'No places yet'}
          description="Search by name or category to find places from Google."
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
              isAddingToItinerary={addingItineraryPlaceIds.has(place.id)}
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
        isAddingToItinerary={
          selectedPlace ? addingItineraryPlaceIds.has(selectedPlace.id) : false
        }
      />
    </div>
  );
};

export default Explore;
