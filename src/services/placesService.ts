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
  cacheQuery?: string;
  cacheLocationName?: string;
  category?: string;
  requirePhotoUrls?: boolean;
}

interface PlacesPhotoOptions extends PlacesRequestBase {
  maxWidthPx?: number;
  maxHeightPx?: number;
  photoLimit?: number;
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
    widthPx?: number;
    heightPx?: number;
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

interface GooglePlacePhotoResponse {
  photoUri?: string;
}

interface PlacesCacheEntry<T> {
  expiresAt: number;
  value: T;
}

const PLACES_CACHE_TTL_MS = 15 * 60 * 1000;
const PLACES_CACHE_STORAGE_KEY = 'travel-builder:google-places-cache:v1';
const textSearchCache = new Map<string, PlacesCacheEntry<LocationRef[]>>();
const detailsCache = new Map<string, PlacesCacheEntry<LocationRef>>();

function getPlaceIdFromResourceName(resourceName?: string) {
  return resourceName?.startsWith('places/') ? resourceName.slice('places/'.length) : resourceName;
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

function normalizeCacheText(value?: string) {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
  return normalized || 'default';
}

function normalizeLocationBias(locationBias?: PlacesLocationBias) {
  if (locationBias?.circle) {
    const { center, radius } = locationBias.circle;
    return `circle:${center.latitude.toFixed(4)},${center.longitude.toFixed(4)},${Math.round(radius)}`;
  }
  if (locationBias?.rectangle) {
    const { low, high } = locationBias.rectangle;
    return `rectangle:${low.latitude.toFixed(4)},${low.longitude.toFixed(4)},${high.latitude.toFixed(4)},${high.longitude.toFixed(4)}`;
  }
  return 'none';
}

function getTextSearchCacheKey(textQuery: string, options: TextSearchPlacesOptions) {
  return [
    'textSearch',
    `query:${normalizeCacheText(options.cacheQuery ?? textQuery)}`,
    `request:${normalizeCacheText(textQuery)}`,
    `location:${normalizeCacheText(options.cacheLocationName)}`,
    `bias:${normalizeLocationBias(options.locationBias)}`,
    `type:${normalizeCacheText(options.includedPrimaryTypes?.join(','))}`,
    `category:${normalizeCacheText(options.category)}`,
    `max:${options.maxResultCount ?? 'default'}`,
    `lang:${options.languageCode ?? 'default'}`,
    `region:${options.regionCode ?? 'default'}`,
  ].join('|');
}

function getDetailsCacheKey(placeId: string, options: PlacesPhotoOptions) {
  return [
    'details',
    `place:${normalizeCacheText(placeId)}`,
    `photos:${options.photoLimit ?? 1}`,
    `width:${options.maxWidthPx ?? 800}`,
    `height:${options.maxHeightPx ?? 600}`,
    `lang:${options.languageCode ?? 'default'}`,
    `region:${options.regionCode ?? 'default'}`,
  ].join('|');
}

function readPersistedCache<T>(key: string): PlacesCacheEntry<T> | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const stored = window.localStorage.getItem(PLACES_CACHE_STORAGE_KEY);
    if (!stored) return undefined;
    const cache = JSON.parse(stored) as Record<string, PlacesCacheEntry<T>>;
    const entry = cache[key];
    if (!entry || entry.expiresAt <= Date.now()) return undefined;
    return entry;
  } catch {
    return undefined;
  }
}

function deletePersistedCache(key: string) {
  if (typeof window === 'undefined') return;

  try {
    const stored = window.localStorage.getItem(PLACES_CACHE_STORAGE_KEY);
    if (!stored) return;
    const cache = JSON.parse(stored) as Record<string, unknown>;
    delete cache[key];
    window.localStorage.setItem(PLACES_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage cleanup failures; stale in-memory entries are still removed.
  }
}

function writePersistedCache<T>(key: string, entry: PlacesCacheEntry<T>) {
  if (typeof window === 'undefined') return;

  try {
    const stored = window.localStorage.getItem(PLACES_CACHE_STORAGE_KEY);
    const cache = stored ? (JSON.parse(stored) as Record<string, PlacesCacheEntry<T>>) : {};
    const now = Date.now();
    const nextCache = Object.fromEntries(
      Object.entries({ ...cache, [key]: entry }).filter(
        ([, cachedEntry]) => cachedEntry.expiresAt > now,
      ),
    );
    window.localStorage.setItem(PLACES_CACHE_STORAGE_KEY, JSON.stringify(nextCache));
  } catch {
    // The in-memory cache is still active if storage is full or unavailable.
  }
}

function readCache<T>(cache: Map<string, PlacesCacheEntry<T>>, key: string): T | undefined {
  const memoryEntry = cache.get(key);
  if (memoryEntry) {
    if (memoryEntry.expiresAt > Date.now()) return memoryEntry.value;
    cache.delete(key);
  }

  const persistedEntry = readPersistedCache<T>(key);
  if (!persistedEntry) return undefined;
  cache.set(key, persistedEntry);
  return persistedEntry.value;
}

function writeCache<T>(cache: Map<string, PlacesCacheEntry<T>>, key: string, value: T) {
  const entry = {
    expiresAt: Date.now() + PLACES_CACHE_TTL_MS,
    value,
  };
  cache.set(key, entry);
  writePersistedCache(key, entry);
}

function googleResultsNeedPhotos(results: LocationRef[]) {
  const googleResults = results.filter((location) => location.source === 'google');
  return (
    googleResults.length > 0 &&
    googleResults.every((location) => (location.photoUrls?.length ?? 0) === 0)
  );
}

function readTextSearchCache(textQuery: string, options: TextSearchPlacesOptions = {}) {
  const cacheKey = getTextSearchCacheKey(textQuery, options);
  const cachedResults = readCache(textSearchCache, cacheKey);
  if (!cachedResults) return undefined;

  if (options.requirePhotoUrls && googleResultsNeedPhotos(cachedResults)) {
    textSearchCache.delete(cacheKey);
    deletePersistedCache(cacheKey);
    return undefined;
  }

  return cachedResults;
}

export function clearPlacesServiceCacheForTesting() {
  textSearchCache.clear();
  detailsCache.clear();
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(PLACES_CACHE_STORAGE_KEY);
  }
}

function getGooglePlacePhotoNames(place: GooglePlace) {
  return (place.photos ?? [])
    .map((photo) => photo.name)
    .filter((name): name is string => Boolean(name));
}

async function getPhotoUrl(photoName: string, options: PlacesPhotoOptions = {}) {
  const { data, error } = await invokePlacesFunction<GooglePlacePhotoResponse>({
    action: 'photo',
    photoName,
    maxWidthPx: options.maxWidthPx ?? 800,
    maxHeightPx: options.maxHeightPx ?? 600,
    languageCode: options.languageCode,
    regionCode: options.regionCode,
  });

  if (error) throw error;
  return data?.photoUri;
}

async function resolveFirstPhotoUrl(place: GooglePlace, options: PlacesPhotoOptions = {}) {
  const firstPhotoName = getGooglePlacePhotoNames(place)[0];
  if (!firstPhotoName) return undefined;

  return getPhotoUrl(firstPhotoName, options).catch(() => undefined);
}

async function resolvePhotoUrls(place: GooglePlace, options: PlacesPhotoOptions = {}) {
  const photoLimit = Math.max(1, Math.min(options.photoLimit ?? 1, 10));
  const photoNames = getGooglePlacePhotoNames(place).slice(0, photoLimit);
  if (photoNames.length === 0) return [];

  const photoUrls = await Promise.all(
    photoNames.map((photoName) => getPhotoUrl(photoName, options).catch(() => undefined)),
  );

  return photoUrls.filter((photoUrl): photoUrl is string => Boolean(photoUrl));
}

export function mapGooglePlaceToLocationRef(
  place: GooglePlace,
  photoUrls: string[] = [],
): LocationRef {
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
    photoUrls,
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
    const { data, error } = await invokePlacesFunction<GoogleAutocompleteResponse>({
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

  async getDetails(placeId: string, options: PlacesPhotoOptions = {}): Promise<LocationRef> {
    const cacheKey = getDetailsCacheKey(placeId, options);
    const cachedDetails = readCache(detailsCache, cacheKey);
    if (cachedDetails) return cachedDetails;

    const { data, error } = await invokePlacesFunction<GooglePlace>({
      action: 'details',
      placeId,
      sessionToken: options.sessionToken,
      languageCode: options.languageCode,
      regionCode: options.regionCode,
    });

    if (error) throw error;
    if (!data) throw new Error('Google Places details response was empty.');

    const photoUrls = await resolvePhotoUrls(data, options);
    const locationRef = mapGooglePlaceToLocationRef(data, photoUrls);
    writeCache(detailsCache, cacheKey, locationRef);
    return locationRef;
  },

  async textSearch(
    textQuery: string,
    options: TextSearchPlacesOptions = {},
  ): Promise<LocationRef[]> {
    const cachedResults = readTextSearchCache(textQuery, options);
    if (cachedResults) return cachedResults;
    const cacheKey = getTextSearchCacheKey(textQuery, options);

    const { data, error } = await invokePlacesFunction<GoogleTextSearchResponse>({
      action: 'textSearch',
      textQuery,
      sessionToken: options.sessionToken,
      languageCode: options.languageCode,
      regionCode: options.regionCode,
      includedPrimaryTypes: options.includedPrimaryTypes,
      locationBias: options.locationBias,
      maxResultCount: options.maxResultCount,
    });

    if (error) throw error;

    const places = data?.places ?? [];
    const photoUrls = await Promise.all(
      places.map((place) => resolveFirstPhotoUrl(place, options)),
    );

    const results = places.map((place, index) =>
      mapGooglePlaceToLocationRef(place, photoUrls[index] ? [photoUrls[index]] : []),
    );
    writeCache(textSearchCache, cacheKey, results);
    return results;
  },

  getCachedTextSearch(
    textQuery: string,
    options: TextSearchPlacesOptions = {},
  ): LocationRef[] | undefined {
    return readTextSearchCache(textQuery, options);
  },

  hasUsableDefaultTextSearchCache(textQuery: string, options: TextSearchPlacesOptions = {}) {
    return Boolean(readTextSearchCache(textQuery, { ...options, cacheQuery: '' }));
  },
};
