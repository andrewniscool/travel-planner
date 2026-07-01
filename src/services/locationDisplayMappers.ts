import type {
  Hotel,
  ItineraryItemType,
  LocationRef,
  Place,
  PlaceCategory,
  TimeOfDay,
} from '../types';

export const GOOGLE_PLACE_IMAGE =
  'https://images.pexels.com/photos/2422461/pexels-photo-2422461.jpeg?auto=compress&cs=tinysrgb&w=600';
export const GOOGLE_HOTEL_IMAGE =
  'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=600';

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getPersistedLocationRefId = (location?: LocationRef | null) =>
  location?.id && UUID_PATTERN.test(location.id) ? location.id : null;

export const getCategoryFromGoogleTypes = (
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

export const mapLocationRefToPlace = (
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

export const mapLocationRefToHotel = (
  tripId: string,
  stopId: string | undefined,
  location: LocationRef,
): Hotel => ({
  id: location.googlePlaceId ? `google-${location.googlePlaceId}` : location.id,
  tripId,
  stopId,
  name: location.displayName ?? location.name,
  image: location.photoUrls?.[0] ?? GOOGLE_HOTEL_IMAGE,
  rating: location.rating ?? 0,
  reviewCount: location.reviewCount ?? 0,
  pricePerNight: 0,
  totalCost: 0,
  amenities: location.placeTypes?.slice(0, 4).map((type) => type.replace(/_/g, ' ')) ?? [],
  neighborhood: location.formattedAddress ?? location.name,
  locationRef: location,
  distanceToCenter: 'Google Places result',
  description: location.formattedAddress
    ? `Lodging option found near ${location.formattedAddress}.`
    : 'Lodging option found through Google Places.',
});

export const getPlaceItineraryType = (place: Place): ItineraryItemType => {
  if (place.category === 'Restaurants' || place.category === 'Cafes') {
    return 'restaurant';
  }

  return 'activity';
};

export const getPlaceItineraryTimeOfDay = (place: Place): TimeOfDay => {
  if (place.category === 'Restaurants') return 'evening';
  if (place.category === 'Cafes') return 'morning';
  return 'afternoon';
};
