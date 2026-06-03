import { getSupabaseClient } from './supabaseClient';
import type { LocationRef } from '../types';

export interface PlaceAutocompleteSuggestion {
  placeId: string;
  resourceName: string;
  text: string;
  mainText?: string;
  secondaryText?: string;
  types: string[];
}

export interface PlacesLocationBias {
  circle?: {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
  };
  rectangle?: {
    low: {
      latitude: number;
      longitude: number;
    };
    high: {
      latitude: number;
      longitude: number;
    };
  };
}

interface PlacesRequestBase {
  sessionToken?: string;
  languageCode?: string;
  regionCode?: string;
}

export interface AutocompletePlacesOptions extends PlacesRequestBase {
  includedPrimaryTypes?: string[];
  locationBias?: PlacesLocationBias;
}

export interface TextSearchPlacesOptions extends PlacesRequestBase {
  includedPrimaryTypes?: string[];
  locationBias?: PlacesLocationBias;
  maxResultCount?: number;
}

interface GoogleLocalizedText {
  text?: string;
  languageCode?: string;
}

interface GooglePlacePrediction {
  place?: string;
  placeId?: string;
  text?: GoogleLocalizedText;
  structuredFormat?: {
    mainText?: GoogleLocalizedText;
    secondaryText?: GoogleLocalizedText;
  };
  types?: string[];
}

interface GoogleAutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: GooglePlacePrediction;
  }>;
}

interface GoogleMoney {
  currencyCode?: string;
  units?: string;
  nanos?: number;
}

interface GooglePriceRange {
  startPrice?: GoogleMoney;
  endPrice?: GoogleMoney;
}

export interface GooglePlace {
  id?: string;
  name?: string;
  displayName?: GoogleLocalizedText;
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  types?: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: Array<{
    name?: string;
  }>;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  priceLevel?: string;
  priceRange?: GooglePriceRange;
  googleMapsUri?: string;
  businessStatus?: string;
}

interface GoogleTextSearchResponse {
  places?: GooglePlace[];
}

function getPlaceIdFromResourceName(resourceName?: string) {
  return resourceName?.startsWith('places/')
    ? resourceName.slice('places/'.length)
    : resourceName;
}

function formatGoogleMoney(money?: GoogleMoney) {
  if (!money?.currencyCode) return null;

  const units = Number(money.units ?? 0);
  const nanos = Number(money.nanos ?? 0);
  const amount = units + nanos / 1_000_000_000;

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: money.currencyCode,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatPriceRange(priceRange?: GooglePriceRange) {
  const startPrice = formatGoogleMoney(priceRange?.startPrice);
  const endPrice = formatGoogleMoney(priceRange?.endPrice);

  if (startPrice && endPrice) return `${startPrice}-${endPrice}`;
  return startPrice ?? endPrice ?? undefined;
}

function invokePlacesFunction<T>(body: Record<string, unknown>) {
  return getSupabaseClient().functions.invoke<T>('places', { body });
}

export function mapGooglePlaceToLocationRef(place: GooglePlace): LocationRef {
  const googlePlaceId = place.id ?? getPlaceIdFromResourceName(place.name);
  const displayName = place.displayName?.text ?? googlePlaceId ?? 'Google Place';

  return {
    id: googlePlaceId ? `google-${googlePlaceId}` : `google-${displayName}`,
    googlePlaceId,
    name: displayName,
    displayName,
    formattedAddress: place.formattedAddress,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    placeTypes: place.types ?? (place.primaryType ? [place.primaryType] : []),
    rating: place.rating,
    reviewCount: place.userRatingCount,
    photoUrls: [],
    websiteUri: place.websiteUri,
    nationalPhoneNumber: place.nationalPhoneNumber,
    internationalPhoneNumber: place.internationalPhoneNumber,
    regularOpeningHours: place.regularOpeningHours?.weekdayDescriptions,
    priceLevel: place.priceLevel,
    priceRange: formatPriceRange(place.priceRange),
    googleMapsUri: place.googleMapsUri,
    businessStatus: place.businessStatus,
    source: 'google',
  };
}

export const placesService = {
  async autocomplete(
    input: string,
    options: AutocompletePlacesOptions = {},
  ): Promise<PlaceAutocompleteSuggestion[]> {
    const { data, error } =
      await invokePlacesFunction<GoogleAutocompleteResponse>({
        action: 'autocomplete',
        input,
        ...options,
      });

    if (error) throw error;

    return (data?.suggestions ?? [])
      .map((suggestion) => suggestion.placePrediction)
      .filter((prediction): prediction is GooglePlacePrediction =>
        Boolean(prediction?.placeId && prediction?.place),
      )
      .map((prediction) => ({
        placeId: prediction.placeId ?? '',
        resourceName: prediction.place ?? '',
        text: prediction.text?.text ?? prediction.structuredFormat?.mainText?.text ?? '',
        mainText: prediction.structuredFormat?.mainText?.text,
        secondaryText: prediction.structuredFormat?.secondaryText?.text,
        types: prediction.types ?? [],
      }));
  },

  async getDetails(
    placeId: string,
    options: PlacesRequestBase = {},
  ): Promise<LocationRef> {
    const { data, error } = await invokePlacesFunction<GooglePlace>({
      action: 'details',
      placeId,
      ...options,
    });

    if (error) throw error;
    if (!data) throw new Error('Google Places details response was empty.');

    return mapGooglePlaceToLocationRef(data);
  },

  async textSearch(
    textQuery: string,
    options: TextSearchPlacesOptions = {},
  ): Promise<LocationRef[]> {
    const { data, error } = await invokePlacesFunction<GoogleTextSearchResponse>({
      action: 'textSearch',
      textQuery,
      ...options,
    });

    if (error) throw error;

    return (data?.places ?? []).map(mapGooglePlaceToLocationRef);
  },
};
