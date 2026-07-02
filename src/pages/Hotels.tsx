import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Hotel as HotelIcon } from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getHotelsByTripId } from '../data/hotels';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  getAuthenticatedUserId,
  locationRefService,
  lodgingService,
} from '../services/travelDataService';
import {
  getHotelIdFromLodgingOption,
  mapLocationRefRowToLocationRef,
  mapLodgingOptionRowToHotel,
} from '../services/tripMappers';
import { mapLocationRefToHotel } from '../services/locationDisplayMappers';
import { placesService } from '../services/placesService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
  loadTripScopedValue,
  persistTripScopedValue,
} from '../utils/tripStorage';
import type { Hotel } from '../types';
import EmptyState from '../components/ui/EmptyState';
import SearchBar from '../components/ui/SearchBar';
import Select from '../components/ui/Select';
import StopSelector from '../components/trips/StopSelector';
import HotelCard from '../components/hotels/HotelCard';
import HotelDetailModal from '../components/hotels/HotelDetailModal';
import HotelFilters from '../components/hotels/HotelFilters';
import {
  extractDistanceNumber,
  getGoogleRating,
  getGoogleReviewCount,
} from '../components/hotels/hotelDisplay';

const LOCAL_SELECTED_HOTELS_KEY = 'travel-builder:selected-hotels';

type HotelSortOption = 'recommended' | 'highest-rated' | 'most-reviewed' | 'closest';

const loadSelectedHotels = (tripId: string, initialSelectedHotelIds: string[]) => {
  return new Set(
    loadTripScopedValue(
      LOCAL_SELECTED_HOTELS_KEY,
      tripId,
      initialSelectedHotelIds,
    ),
  );
};

const persistSelectedHotels = (tripId: string, hotelIds: Set<string>) => {
  persistTripScopedValue(LOCAL_SELECTED_HOTELS_KEY, tripId, [...hotelIds]);
};

const Hotels: React.FC = () => {
  const { tripId: routeTripId } = useParams<{ tripId: string }>();
  const fallbackTrip = useTrip();
  const {
    trip: serviceTrip,
    error: serviceTripError,
    source: tripSource,
  } = useServiceTrip(routeTripId);
  const trip = serviceTrip ?? fallbackTrip;
  const tripId = trip?.id;
  const allHotels = useMemo(() => (trip ? getHotelsByTripId(trip.id) : []), [trip]);
  const initiallySelectedHotelIds = useMemo(
    () => allHotels.filter((hotel) => hotel.isSelected).map((hotel) => hotel.id),
    [allHotels]
  );
  const orderedStops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.order - b.order) : []),
    [trip]
  );
  const [selectedStopId, setSelectedStopId] = useState(orderedStops[0]?.id ?? '');
  const [sortBy, setSortBy] = useState<HotelSortOption>('recommended');
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [savedHotels, setSavedHotels] = useState<Set<string>>(() =>
    trip ? loadSelectedHotels(trip.id, initiallySelectedHotelIds) : new Set()
  );
  const [serviceHotels, setServiceHotels] = useState<Hotel[]>([]);
  const [googleHotels, setGoogleHotels] = useState<Hotel[]>([]);
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');
  const debouncedHotelSearchQuery = useDebouncedValue(hotelSearchQuery, 400);
  const hasEditedHotelSearchRef = useRef(false);
  const [isSearchingGoogleHotels, setIsSearchingGoogleHotels] = useState(false);
  const [lodgingSource, setLodgingSource] = useState<'supabase' | 'fallback'>('fallback');
  const [lodgingError, setLodgingError] = useState<string | null>(null);
  const [detailHotel, setDetailHotel] = useState<Hotel | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    const localSelections = loadSelectedHotels(tripId, initiallySelectedHotelIds);
    let cancelled = false;

    setSavedHotels(localSelections);
    setServiceHotels([]);
    setLodgingSource('fallback');
    setLodgingError(null);

    async function loadSupabaseLodging() {
      if (tripSource !== 'supabase') return;

      try {
        const userId = await getAuthenticatedUserId();
        if (!userId || !tripId) return;

        const lodgingOptions = await lodgingService.listLodgingOptions(tripId);
        if (cancelled) return;

        const selectedHotelIds = lodgingOptions
          .filter((option) => option.is_selected || option.is_saved)
          .map(getHotelIdFromLodgingOption);
        const nextServiceHotels = lodgingOptions
          .filter((option) => option.is_selected || option.is_saved)
          .map((option) => mapLodgingOptionRowToHotel(option, tripId));
        const nextSelections = new Set([
          ...initiallySelectedHotelIds,
          ...selectedHotelIds,
        ]);

        setServiceHotels(nextServiceHotels);
        setSavedHotels(nextSelections);
        persistSelectedHotels(tripId, nextSelections);
        setLodgingSource('supabase');
      } catch {
        if (cancelled) return;
        setLodgingError('Supabase lodging selections could not be loaded. Showing local hotel selections instead.');
      }
    }

    void loadSupabaseLodging();

    return () => {
      cancelled = true;
    };
  }, [initiallySelectedHotelIds, tripId, tripSource]);

  useEffect(() => {
    if (orderedStops.length > 0 && !orderedStops.some((stop) => stop.id === selectedStopId)) {
      setSelectedStopId(orderedStops[0].id);
    }
  }, [orderedStops, selectedStopId]);

  const selectedStop = useMemo(
    () => orderedStops.find((stop) => stop.id === selectedStopId) ?? orderedStops[0],
    [orderedStops, selectedStopId]
  );

  useEffect(() => {
    if (!trip || !selectedStop || tripSource !== 'supabase' || !isSupabaseConfigured) {
      setGoogleHotels([]);
      setIsSearchingGoogleHotels(false);
      return;
    }

    const trimmedSearch = debouncedHotelSearchQuery.trim();
    if (trimmedSearch.length > 0 && trimmedSearch.length < 2) {
      setGoogleHotels([]);
      setIsSearchingGoogleHotels(false);
      return;
    }

    const textQuery = `${trimmedSearch || 'hotels'} in ${selectedStop.name}`;
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
    const searchOptions = {
      cacheQuery: trimmedSearch,
      cacheLocationName: selectedStop.name,
      category: 'lodging',
      includedPrimaryTypes: ['lodging'],
      locationBias,
      maxResultCount: 9,
      requirePhotoUrls: true,
    };
    const cachedDefaultLocations = !trimmedSearch
      ? placesService.getCachedTextSearch(textQuery, searchOptions)
      : undefined;

    if (cachedDefaultLocations) {
      setGoogleHotels(
        cachedDefaultLocations.map((location) =>
          mapLocationRefToHotel(trip.id, selectedStop.id, location),
        ),
      );
      setIsSearchingGoogleHotels(false);
      return;
    }

    if (!trimmedSearch && hasEditedHotelSearchRef.current) {
      setGoogleHotels([]);
      setIsSearchingGoogleHotels(false);
      return;
    }

    let cancelled = false;

    setIsSearchingGoogleHotels(true);

    placesService.textSearch(textQuery, searchOptions)
      .then((locations) => {
        if (cancelled) return;
        setGoogleHotels(
          locations.map((location) =>
            mapLocationRefToHotel(trip.id, selectedStop.id, location),
          ),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setGoogleHotels([]);
        setLodgingError('Google lodging search is unavailable. Showing saved and local hotels instead.');
      })
      .finally(() => {
        if (cancelled) return;
        setIsSearchingGoogleHotels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedHotelSearchQuery, selectedStop, trip, tripSource]);

  const availableHotels = useMemo(() => {
    const hotelsById = new Map<string, Hotel>();
    [...allHotels, ...serviceHotels, ...googleHotels].forEach((hotel) => {
      hotelsById.set(hotel.id, hotel);
    });
    return [...hotelsById.values()];
  }, [allHotels, googleHotels, serviceHotels]);

  const stopHotels = useMemo(() => {
    if (!selectedStop) return availableHotels;
    return availableHotels.filter((hotel) =>
      hotel.stopId === selectedStop.id || (!hotel.stopId && orderedStops.length <= 1)
    );
  }, [availableHotels, orderedStops.length, selectedStop]);

  const availableAmenities = useMemo(
    () => [...new Set(stopHotels.flatMap((hotel) => hotel.amenities))].sort(),
    [stopHotels]
  );

  const filteredHotels = useMemo(() => {
    return stopHotels.filter((hotel) => {
      if (selectedRatings.length > 0 && !selectedRatings.some((rating) => getGoogleRating(hotel) >= rating)) {
        return false;
      }
      if (
        selectedAmenities.length > 0 &&
        !selectedAmenities.every((amenity) => hotel.amenities.includes(amenity))
      ) {
        return false;
      }
      return true;
    });
  }, [selectedAmenities, selectedRatings, stopHotels]);

  const sortedHotels = useMemo(() => {
    const sorted = [...filteredHotels];
    switch (sortBy) {
      case 'highest-rated':
        sorted.sort((a, b) => getGoogleRating(b) - getGoogleRating(a) || getGoogleReviewCount(b) - getGoogleReviewCount(a));
        break;
      case 'most-reviewed':
        sorted.sort((a, b) => getGoogleReviewCount(b) - getGoogleReviewCount(a));
        break;
      case 'closest':
        sorted.sort((a, b) => extractDistanceNumber(a.distanceToCenter) - extractDistanceNumber(b.distanceToCenter));
        break;
      case 'recommended':
      default:
        sorted.sort((a, b) => {
          const selectedWeight = Number(savedHotels.has(b.id)) - Number(savedHotels.has(a.id));
          return selectedWeight || getGoogleRating(b) - getGoogleRating(a) || getGoogleReviewCount(b) - getGoogleReviewCount(a);
        });
        break;
    }
    return sorted;
  }, [filteredHotels, savedHotels, sortBy]);

  const handleRatingToggle = (rating: number) => {
    setSelectedRatings((prev) =>
      prev.includes(rating) ? prev.filter((item) => item !== rating) : [...prev, rating]
    );
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((item) => item !== amenity) : [...prev, amenity]
    );
  };

  const toggleHotelSelection = async (hotelId: string) => {
    if (!trip) return;
    const hotel = availableHotels.find((item) => item.id === hotelId);
    if (!hotel) return;

    const next = new Set(savedHotels);
    if (next.has(hotelId)) next.delete(hotelId);
    else next.add(hotelId);

    setSavedHotels(next);
    persistSelectedHotels(trip.id, next);

    if (lodgingSource !== 'supabase') return;

    try {
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        setLodgingError('Saved locally. Sign-in is not connected yet.');
        setLodgingSource('fallback');
        return;
      }

      const hotelToSave =
        hotel.locationRef?.googlePlaceId && next.has(hotelId)
          ? {
              ...hotel,
              locationRef: mapLocationRefRowToLocationRef(
                await locationRefService.upsertGoogleLocationRef(
                  userId,
                  hotel.locationRef,
                ),
              ),
            }
          : hotel;

      await lodgingService.upsertHotelSelection(trip.id, hotelToSave, next.has(hotelId));
      setLodgingError(null);
    } catch {
      setLodgingError('Supabase lodging save failed. Saved the hotel selection locally instead.');
      setLodgingSource('fallback');
    }
  };

  const openHotelDetails = (hotel: Hotel) => {
    setDetailHotel(hotel);
    setDetailModalOpen(true);

    if (!hotel.locationRef?.googlePlaceId) return;

    placesService
      .getDetails(hotel.locationRef.googlePlaceId, { photoLimit: 5 })
      .then((locationRef) => {
        setDetailHotel((currentHotel) =>
          currentHotel?.id === hotel.id
            ? {
                ...currentHotel,
                image: locationRef.photoUrls?.[0] ?? currentHotel.image,
                locationRef,
              }
            : currentHotel,
        );
      })
      .catch(() => {
        setLodgingError('Google hotel photos could not be loaded. Showing the available photo instead.');
      });
  };

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<HotelIcon className="w-8 h-8" />}
          title="Trip not found"
          description="Could not find the trip for these hotels."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {orderedStops.length > 1 && selectedStop ? `Hotels in ${selectedStop.name}` : 'Hotels'}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Choose lodging candidates using location, ratings, reviews, photos, and amenities.
          </p>
          {(serviceTripError || lodgingError) && (
            <p className="text-sm text-warning-700 mt-2">
              {lodgingError || 'Supabase trip data could not be loaded. Showing local hotel data instead.'}
            </p>
          )}
        </div>

        <div className="w-full sm:w-52">
          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value as HotelSortOption)}
            options={[
              { value: 'recommended', label: 'Recommended' },
              { value: 'highest-rated', label: 'Highest Rated' },
              { value: 'most-reviewed', label: 'Most Reviewed' },
              { value: 'closest', label: 'Closest' },
            ]}
            aria-label="Sort hotels"
          />
        </div>
      </div>

      <StopSelector
        stops={orderedStops}
        selectedStopId={selectedStop?.id}
        onChange={setSelectedStopId}
      />

      <div className="flex flex-col gap-2 sm:max-w-md">
        <SearchBar
          value={hotelSearchQuery}
          onChange={(value) => {
            hasEditedHotelSearchRef.current = true;
            setHotelSearchQuery(value);
          }}
          placeholder={`Search hotels${selectedStop ? ` in ${selectedStop.name}` : ''}...`}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-64 shrink-0">
          <HotelFilters
            selectedRatings={selectedRatings}
            onRatingToggle={handleRatingToggle}
            selectedAmenities={selectedAmenities}
            onAmenityToggle={handleAmenityToggle}
            availableAmenities={availableAmenities}
          />
        </aside>

        <div className="flex-1 space-y-3">
          {isSearchingGoogleHotels ? (
            <EmptyState
              icon={<HotelIcon className="w-8 h-8 animate-pulse" />}
              title="Searching Google hotels"
              description={
                selectedStop
                  ? `Looking for lodging candidates in ${selectedStop.name}.`
                  : 'Looking for lodging candidates.'
              }
            />
          ) : stopHotels.length === 0 ? (
            <EmptyState
              icon={<HotelIcon className="w-8 h-8" />}
              title={selectedStop ? `No hotels in ${selectedStop.name} yet` : 'No hotels yet'}
              description="Google Places-ready lodging candidates for this stop will appear here once they are added."
            />
          ) : sortedHotels.length === 0 ? (
            <EmptyState
              icon={<HotelIcon className="w-8 h-8" />}
              title="No hotels match your filters"
              description="Try adjusting rating or amenity preferences."
              actionLabel="Reset filters"
              onAction={() => {
                setSelectedRatings([]);
                setSelectedAmenities([]);
              }}
            />
          ) : (
            sortedHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                isSelected={savedHotels.has(hotel.id)}
                onSelect={() => void toggleHotelSelection(hotel.id)}
                onSave={() => void toggleHotelSelection(hotel.id)}
                onViewDetails={() => openHotelDetails(hotel)}
              />
            ))
          )}
        </div>
      </div>

      <HotelDetailModal
        hotel={detailHotel}
        isOpen={detailModalOpen}
        isSelected={detailHotel ? savedHotels.has(detailHotel.id) : false}
        onClose={() => setDetailModalOpen(false)}
        onSelect={() => {
          if (detailHotel) void toggleHotelSelection(detailHotel.id);
        }}
      />
    </div>
  );
};

export default Hotels;
