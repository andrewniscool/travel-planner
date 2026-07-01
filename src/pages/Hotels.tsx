import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Coffee,
  ConciergeBell,
  Dumbbell,
  ExternalLink,
  Hotel as HotelIcon,
  MapPin,
  Phone,
  SlidersHorizontal,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wine,
} from 'lucide-react';
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
import {
  GOOGLE_HOTEL_IMAGE,
  mapLocationRefToHotel,
} from '../services/locationDisplayMappers';
import { placesService } from '../services/placesService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
  loadTripScopedValue,
  persistTripScopedValue,
} from '../utils/tripStorage';
import type { Hotel, LocationRef } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import PhotoGallery from '../components/ui/PhotoGallery';
import RatingStars from '../components/ui/RatingStars';
import SearchBar from '../components/ui/SearchBar';
import Select from '../components/ui/Select';
import StopSelector from '../components/trips/StopSelector';

const LOCAL_SELECTED_HOTELS_KEY = 'travel-builder:selected-hotels';

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-3.5 h-3.5" />,
  Pool: <Waves className="w-3.5 h-3.5" />,
  Spa: <Wine className="w-3.5 h-3.5" />,
  Restaurant: <UtensilsCrossed className="w-3.5 h-3.5" />,
  Bar: <Wine className="w-3.5 h-3.5" />,
  'Room Service': <Phone className="w-3.5 h-3.5" />,
  Concierge: <ConciergeBell className="w-3.5 h-3.5" />,
  Gym: <Dumbbell className="w-3.5 h-3.5" />,
  Breakfast: <Coffee className="w-3.5 h-3.5" />,
};

const mockReviews = [
  { author: 'Sarah M.', text: 'Wonderful experience! The staff was incredibly attentive and the amenities were top-notch.', rating: 5 },
  { author: 'James L.', text: 'Great location and comfortable rooms. Would definitely stay here again.', rating: 4 },
  { author: 'Emily R.', text: 'Beautiful property with excellent service. The breakfast buffet was a highlight.', rating: 5 },
];

type HotelSortOption = 'recommended' | 'highest-rated' | 'most-reviewed' | 'closest';

const getLocationLabel = (hotel: Hotel) =>
  hotel.locationRef?.formattedAddress || hotel.neighborhood;

const getGoogleRating = (hotel: Hotel) =>
  hotel.locationRef?.rating ?? hotel.rating;

const getGoogleReviewCount = (hotel: Hotel) =>
  hotel.locationRef?.reviewCount ?? hotel.reviewCount;

const getGooglePhoto = (hotel: Hotel) =>
  hotel.locationRef?.photoUrls?.[0] || hotel.image;

const getGoogleTypes = (locationRef?: LocationRef) =>
  locationRef?.placeTypes?.map((type) => type.replace(/_/g, ' ')) ?? ['lodging'];

const extractDistanceNumber = (distance: string) => {
  const match = distance.match(/(\d+)/);
  return match ? Number(match[1]) : 999;
};

interface HotelCardProps {
  hotel: Hotel;
  isSelected: boolean;
  onSelect: () => void;
  onSave: () => void;
  onViewDetails: () => void;
}

const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  isSelected,
  onSelect,
  onSave,
  onViewDetails,
}) => (
  <Card
    hover={false}
    className={[
      'transition-all duration-200 overflow-hidden',
      isSelected ? 'border-primary-500 bg-primary-50/30' : 'border-neutral-100 bg-white',
    ].join(' ')}
  >
    <div className="flex flex-col sm:flex-row">
      <div className="sm:w-48 sm:shrink-0">
        <img
          src={getGooglePhoto(hotel)}
          alt={hotel.name}
          loading="lazy"
          decoding="async"
          width={320}
          height={192}
          className="w-full h-48 sm:h-full object-cover sm:rounded-l-xl"
          onError={(event) => {
            if (event.currentTarget.src !== GOOGLE_HOTEL_IMAGE) {
              event.currentTarget.src = GOOGLE_HOTEL_IMAGE;
            }
          }}
        />
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-neutral-900 text-base truncate">
                {hotel.locationRef?.displayName || hotel.name}
              </h3>
              <Badge variant={hotel.locationRef?.source === 'google' ? 'success' : 'default'}>
                {hotel.locationRef?.source === 'google' ? 'Google' : 'Places-ready'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <RatingStars rating={getGoogleRating(hotel)} size="sm" />
              <span className="text-xs text-neutral-500">
                ({getGoogleReviewCount(hotel).toLocaleString()} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{getLocationLabel(hotel)}</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">{hotel.distanceToCenter}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {getGoogleTypes(hotel.locationRef).slice(0, 3).map((type) => (
            <span
              key={type}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-50 text-primary-700 border border-primary-100 capitalize"
            >
              {type}
            </span>
          ))}
          {hotel.amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-50 text-neutral-600 border border-neutral-100"
            >
              {amenityIcons[amenity] || null}
              {amenity}
            </span>
          ))}
        </div>

        <p className="text-sm text-neutral-500 line-clamp-2">{hotel.description}</p>

        <div className="flex items-center gap-1.5 mt-auto pt-1 flex-wrap">
          <Button variant="ghost" size="sm" onClick={onSave}>
            <Bookmark className={`w-4 h-4 ${isSelected ? 'fill-current' : ''}`} />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            View Details
          </Button>
          <Button variant={isSelected ? 'primary' : 'outline'} size="sm" onClick={onSelect}>
            <Check className="w-4 h-4 mr-1" />
            Select
          </Button>
          {hotel.locationRef?.googleMapsUri && (
            <a href={hotel.locationRef.googleMapsUri} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" />
                Map
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  </Card>
);

interface HotelFiltersProps {
  selectedRatings: number[];
  onRatingToggle: (rating: number) => void;
  selectedAmenities: string[];
  onAmenityToggle: (amenity: string) => void;
  availableAmenities: string[];
}

const HotelFilters: React.FC<HotelFiltersProps> = ({
  selectedRatings,
  onRatingToggle,
  selectedAmenities,
  onAmenityToggle,
  availableAmenities,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-card p-4 border border-neutral-100">
      <div className="flex items-center justify-between lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-700"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div className={['space-y-5', isOpen ? 'block mt-4' : 'hidden', 'lg:block lg:mt-0'].join(' ')}>
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Google Rating</p>
          <div className="space-y-2">
            {[4.5, 4, 3.5].map((rating) => (
              <label key={rating} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedRatings.includes(rating)}
                  onChange={() => onRatingToggle(rating)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-1"
                />
                <span className="text-sm text-neutral-600 group-hover:text-neutral-900">
                  {rating}+ stars
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Amenities</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {availableAmenities.map((amenity) => (
              <label key={amenity} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => onAmenityToggle(amenity)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-1"
                />
                <span className="text-sm text-neutral-600 group-hover:text-neutral-900">
                  {amenity}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface HotelDetailModalProps {
  hotel: Hotel | null;
  isOpen: boolean;
  isSelected: boolean;
  onClose: () => void;
  onSelect: () => void;
}

const HotelDetailModal: React.FC<HotelDetailModalProps> = ({
  hotel,
  isOpen,
  isSelected,
  onClose,
  onSelect,
}) => {
  if (!hotel) return null;
  const hotelPhotos = hotel.locationRef?.photoUrls?.length
    ? hotel.locationRef.photoUrls
    : [hotel.image];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={hotel.locationRef?.displayName || hotel.name} size="lg">
      <div className="space-y-6">
        <div className="rounded-xl overflow-hidden">
          <PhotoGallery
            photos={hotelPhotos}
            fallbackPhoto={GOOGLE_HOTEL_IMAGE}
            alt={hotel.name}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <RatingStars rating={getGoogleRating(hotel)} />
          <span className="text-sm text-neutral-500">
            ({getGoogleReviewCount(hotel).toLocaleString()} reviews)
          </span>
          <Badge variant="default">Google Places-ready</Badge>
        </div>

        <p className="text-sm text-neutral-700 leading-relaxed">{hotel.description}</p>

        <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2 text-sm text-neutral-600">
            <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
            <span>{getLocationLabel(hotel)}</span>
          </div>
          <p className="text-sm text-neutral-500">{hotel.distanceToCenter}</p>
          {hotel.locationRef?.nationalPhoneNumber && (
            <p className="text-sm text-neutral-500">{hotel.locationRef.nationalPhoneNumber}</p>
          )}
          {hotel.locationRef?.websiteUri && (
            <a
              href={hotel.locationRef.websiteUri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Website
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-neutral-900 mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 text-primary-700"
              >
                {amenityIcons[amenity] || null}
                {amenity}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-neutral-900 mb-3">Review Highlights</h4>
          <div className="space-y-3">
            {mockReviews.map((review) => (
              <div key={review.author} className="bg-neutral-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-neutral-900">{review.author}</span>
                  <RatingStars rating={review.rating} size="sm" />
                </div>
                <p className="text-sm text-neutral-600">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        <Button variant={isSelected ? 'secondary' : 'primary'} size="lg" className="w-full" onClick={onSelect}>
          <Check className="w-4 h-4 mr-2" />
          {isSelected ? 'Selected' : 'Select Hotel'}
        </Button>
      </div>
    </Modal>
  );
};

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
