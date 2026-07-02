import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  Car,
  MapPin,
  Plane,
  Plus,
  Train,
  UtensilsCrossed,
} from 'lucide-react';
import { getTripFromStorageOrMock } from '../hooks/useTrip';
import { useServiceTrip } from '../hooks/useServiceTrips';
import { getHotelsByTripId } from '../data/hotels';
import { getItineraryByTripId } from '../data/itinerary';
import { mockLocationSuggestions } from '../data/locationSuggestions';
import { getPlacesByTripId } from '../data/places';
import {
  getAuthenticatedUserId,
  itineraryService,
  lodgingService,
  savedPlaceService,
} from '../services/travelDataService';
import TripGoogleMap, { type TripMapMarker } from '../components/map/TripGoogleMap';
import {
  mapLodgingOptionRowToHotel,
  mapSavedPlaceRowToPlace,
} from '../services/tripMappers';
import RatingStars from '../components/ui/RatingStars';
import MapFallbackView from '../components/map/MapFallbackView';
import MapFiltersPanel from '../components/map/MapFiltersPanel';
import MapRouteSelector from '../components/map/MapRouteSelector';
import {
  detailOffsets,
  formatStopDates,
  getStopPosition,
  placeCategoryMap,
  singleStopPositions,
  type CategoryFilter,
  type MapPinData,
  type StopSelection,
} from '../components/map/mapPageDisplay';
import type {
  Hotel,
  ItineraryDay,
  ItineraryItem,
  Place,
  TransportSegment,
  TripStop,
} from '../types';

const mergeHotels = (baseHotels: Hotel[], savedHotels: Hotel[]) => {
  const hotelsById = new Map(baseHotels.map((hotel) => [hotel.id, hotel]));

  for (const savedHotel of savedHotels) {
    const existing = hotelsById.get(savedHotel.id);
    hotelsById.set(
      savedHotel.id,
      existing
        ? { ...existing, isSelected: existing.isSelected || savedHotel.isSelected }
        : savedHotel,
    );
  }

  return [...hotelsById.values()];
};

const mergePlaces = (basePlaces: Place[], savedPlaces: Place[]) => {
  const placesById = new Map(basePlaces.map((place) => [place.id, place]));

  for (const savedPlace of savedPlaces) {
    const existing = placesById.get(savedPlace.id);
    placesById.set(
      savedPlace.id,
      existing
        ? { ...existing, isSaved: existing.isSaved || savedPlace.isSaved }
        : savedPlace,
    );
  }

  return [...placesById.values()];
};

const getItemStopId = <T extends { stopId?: string }>(item: T, primaryStopId: string) =>
  item.stopId || primaryStopId;

const getTransportStopId = (segment: TransportSegment, primaryStopId: string) =>
  segment.fromStopId || segment.toStopId || primaryStopId;

const getTransportLabel = (segment: TransportSegment, stops: TripStop[]) => {
  const from = stops.find((stop) => stop.id === segment.fromStopId)?.name || segment.departureLocation;
  const to = stops.find((stop) => stop.id === segment.toStopId)?.name || segment.arrivalLocation;
  return `${from} to ${to}`;
};

const hasCoordinates = (
  value?: { latitude?: number; longitude?: number },
): value is { latitude: number; longitude: number } =>
  typeof value?.latitude === 'number' &&
  Number.isFinite(value.latitude) &&
  typeof value.longitude === 'number' &&
  Number.isFinite(value.longitude);

const makeTripMapMarker = (
  marker: Omit<TripMapMarker, 'latitude' | 'longitude'>,
  location?: { latitude?: number; longitude?: number },
): TripMapMarker | null =>
  hasCoordinates(location)
    ? {
        ...marker,
        latitude: location.latitude,
        longitude: location.longitude,
      }
    : null;

const getStopMapLocation = (stop: TripStop) => {
  if (hasCoordinates(stop)) return stop;
  if (hasCoordinates(stop.locationRef)) return stop.locationRef;

  const normalizedStopName = stop.name.trim().toLowerCase();
  return mockLocationSuggestions.find((suggestion) => {
    const suggestionName = suggestion.name.trim().toLowerCase();
    return (
      suggestion.placeTypes?.includes('locality') &&
      (suggestionName === normalizedStopName ||
        suggestionName.startsWith(`${normalizedStopName},`))
    );
  });
};

const PanelItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  meta: string;
  actionLabel?: string;
  rating?: number;
  onAction?: () => void;
}> = ({ icon, title, meta, actionLabel = 'View details', rating, onAction }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors duration-150">
    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-50 text-primary-600 shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-neutral-800 truncate">{title}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{meta}</p>
      {rating && (
        <div className="mt-1.5">
          <RatingStars rating={rating} size="sm" />
        </div>
      )}
    </div>
    <button
      type="button"
      onClick={onAction}
      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors duration-150"
    >
      <Plus className="w-3 h-3" />
      {actionLabel}
    </button>
  </div>
);

const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();
  const fallbackTrip = tripId ? getTripFromStorageOrMock(tripId) : undefined;
  const {
    trip: serviceTrip,
    isLoading: isLoadingServiceTrip,
    error: serviceTripError,
    source: tripSource,
  } = useServiceTrip(tripId);
  const trip = serviceTrip ?? fallbackTrip;
  const [activeFilters, setActiveFilters] = useState<Set<CategoryFilter>>(
    new Set(['Hotels', 'Food', 'Activities', 'Itinerary', 'Transport'])
  );
  const [selectedStopId, setSelectedStopId] = useState<StopSelection>('all');
  const [serviceHotels, setServiceHotels] = useState<Hotel[]>([]);
  const [servicePlaces, setServicePlaces] = useState<Place[]>([]);
  const [serviceItineraryDays, setServiceItineraryDays] = useState<
    ItineraryDay[]
  >([]);
  const [mapDataSource, setMapDataSource] = useState<'supabase' | 'fallback'>('fallback');
  const [mapDataError, setMapDataError] = useState<string | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  const orderedStops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.order - b.order) : []),
    [trip]
  );
  const primaryStop = orderedStops[0];
  const isMultiStop = orderedStops.length > 1;
  const effectiveSelection = isMultiStop ? selectedStopId : primaryStop?.id;

  const fallbackHotels = useMemo(() => (trip ? getHotelsByTripId(trip.id) : []), [trip]);
  const fallbackPlaces = useMemo(() => (trip ? getPlacesByTripId(trip.id) : []), [trip]);
  const fallbackItineraryDays = useMemo(() => (trip ? getItineraryByTripId(trip.id) : []), [trip]);
  const hotels = useMemo(
    () => mergeHotels(fallbackHotels, serviceHotels),
    [fallbackHotels, serviceHotels],
  );
  const places = useMemo(
    () => mergePlaces(fallbackPlaces, servicePlaces),
    [fallbackPlaces, servicePlaces],
  );
  const itineraryDays =
    mapDataSource === 'supabase' && serviceItineraryDays.length > 0
      ? serviceItineraryDays
      : fallbackItineraryDays;
  const itineraryItems = useMemo(
    () => itineraryDays.flatMap((day) => [...day.morning, ...day.afternoon, ...day.evening].map((item) => ({ ...item, stopId: item.stopId || day.stopId }))),
    [itineraryDays]
  );

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;

    setServiceHotels([]);
    setServicePlaces([]);
    setServiceItineraryDays([]);
    setMapDataSource('fallback');
    setMapDataError(null);

    async function loadSupabaseMapData() {
      if (!trip || tripSource !== 'supabase') return;

      try {
        const userId = await getAuthenticatedUserId();
        if (!userId) return;

        const [lodgingRows, savedPlaceRows, supabaseItineraryDays] =
          await Promise.all([
            lodgingService.listLodgingOptions(trip.id),
            savedPlaceService.listSavedPlaces(trip.id),
            itineraryService.listItineraryDays(trip.id),
          ]);

        if (cancelled) return;

        setServiceHotels(
          lodgingRows
            .filter((row) => row.is_selected || row.is_saved)
            .map((row) => mapLodgingOptionRowToHotel(row, trip.id)),
        );
        setServicePlaces(
          savedPlaceRows
            .filter((row) => row.is_saved)
            .map((row) => mapSavedPlaceRowToPlace(row, trip.id)),
        );
        setServiceItineraryDays(supabaseItineraryDays);
        setMapDataSource('supabase');
      } catch {
        if (cancelled) return;
        setMapDataError('Supabase map data could not be loaded. Showing local map data instead.');
      }
    }

    void loadSupabaseMapData();

    return () => {
      cancelled = true;
    };
  }, [trip, tripSource]);

  const selectedStop = orderedStops.find((stop) => stop.id === effectiveSelection) || primaryStop;
  const routeLinePoints = orderedStops
    .map((_, index) => {
      const position = getStopPosition(index);
      return `${parseFloat(position.left)},${parseFloat(position.top)}`;
    })
    .join(' ');

  const toggleFilter = (category: CategoryFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const getStopHotels = (stopId: string) =>
    hotels.filter((hotel) => getItemStopId(hotel, primaryStop?.id ?? '') === stopId);

  const getStopPlaces = (stopId: string) =>
    places.filter((place) => getItemStopId(place, primaryStop?.id ?? '') === stopId);

  const getStopItineraryItems = (stopId: string) =>
    itineraryItems.filter((item) => getItemStopId(item, primaryStop?.id ?? '') === stopId);

  const getStopTransport = (stopId: string) =>
    (trip?.transportSegments ?? []).filter((segment) => {
      if (segment.fromStopId || segment.toStopId) {
        return segment.fromStopId === stopId || segment.toStopId === stopId;
      }
      return primaryStop?.id === stopId;
    });

  const selectedHotels = selectedStop ? getStopHotels(selectedStop.id) : [];
  const selectedPlaces = selectedStop ? getStopPlaces(selectedStop.id) : [];
  const selectedItineraryItems = selectedStop ? getStopItineraryItems(selectedStop.id) : [];
  const selectedTransport = selectedStop ? getStopTransport(selectedStop.id) : [];
  const selectedLodging = selectedHotels.find((hotel) => hotel.isSelected) || selectedHotels[0];
  const normalizedMapSearch = mapSearchQuery.trim().toLowerCase();
  const matchesMapSearch = (...values: Array<string | undefined>) =>
    !normalizedMapSearch ||
    values.some((value) => value?.toLowerCase().includes(normalizedMapSearch));

  const visiblePins = (() => {
    if (!primaryStop) return [];
    const pinStops = effectiveSelection === 'all' ? orderedStops : orderedStops.filter((stop) => stop.id === effectiveSelection);
    const pins: MapPinData[] = [];

    pinStops.forEach((stop, stopIndex) => {
      const base = isMultiStop ? getStopPosition(stopIndex) : { left: '50%', top: '48%' };
      const baseLeft = parseFloat(base.left);
      const baseTop = parseFloat(base.top);
      const makePosition = (index: number) => {
        if (!isMultiStop && effectiveSelection !== 'all') return singleStopPositions[index % singleStopPositions.length];
        const offset = detailOffsets[index % detailOffsets.length];
        return {
          left: `${Math.max(8, Math.min(88, baseLeft + offset.x))}%`,
          top: `${Math.max(12, Math.min(82, baseTop + offset.y))}%`,
        };
      };

      let pinIndex = 0;
      if (activeFilters.has('Hotels')) {
        getStopHotels(stop.id).slice(0, 1).forEach((hotel) => {
          if (!matchesMapSearch(hotel.name, hotel.neighborhood, hotel.locationRef?.formattedAddress)) return;
          pins.push({ id: hotel.id, kind: 'hotel', label: hotel.name, stopId: stop.id, ...makePosition(pinIndex++) });
        });
      }
      getStopPlaces(stop.id).slice(0, 4).forEach((place) => {
        const category = placeCategoryMap[place.category] || 'Activities';
        if (!activeFilters.has(category)) return;
        if (!matchesMapSearch(place.name, place.category, place.location, place.locationRef?.formattedAddress)) return;
        pins.push({
          id: place.id,
          kind: category === 'Food' ? 'food' : 'activity',
          label: place.name,
          stopId: stop.id,
          ...makePosition(pinIndex++),
        });
      });
      if (activeFilters.has('Itinerary')) {
        getStopItineraryItems(stop.id).slice(0, 2).forEach((item) => {
          if (!matchesMapSearch(item.name, item.location, item.type)) return;
          pins.push({ id: item.id, kind: 'itinerary', label: item.name, stopId: stop.id, ...makePosition(pinIndex++) });
        });
      }
      if (activeFilters.has('Transport')) {
        getStopTransport(stop.id).slice(0, 2).forEach((segment) => {
          if (!matchesMapSearch(segment.provider, segment.departureLocation, segment.arrivalLocation, segment.mode)) return;
          pins.push({
            id: segment.id,
            kind: 'transport',
            label: getTransportLabel(segment, orderedStops),
            stopId: getTransportStopId(segment, primaryStop.id),
            ...makePosition(pinIndex++),
          });
        });
      }
    });

    return pins;
  })();

  const googleMapMarkers = (() => {
    if (!primaryStop) return [];
    const pinStops =
      effectiveSelection === 'all'
        ? orderedStops
        : orderedStops.filter((stop) => stop.id === effectiveSelection);
    const markers: TripMapMarker[] = [];

    pinStops.forEach((stop) => {
      if (matchesMapSearch(stop.name, stop.country)) {
        const stopMarker = makeTripMapMarker(
          {
            id: `stop-${stop.id}`,
            kind: 'stop',
            label: stop.name,
          },
          getStopMapLocation(stop),
        );
        if (stopMarker) markers.push(stopMarker);
      }

      if (activeFilters.has('Hotels')) {
        getStopHotels(stop.id).forEach((hotel) => {
          if (!matchesMapSearch(hotel.name, hotel.neighborhood, hotel.locationRef?.formattedAddress)) return;
          const marker = makeTripMapMarker(
            {
              id: `hotel-${hotel.id}`,
              kind: 'hotel',
              label: hotel.name,
            },
            hotel.locationRef,
          );
          if (marker) markers.push(marker);
        });
      }

      getStopPlaces(stop.id).forEach((place) => {
        const category = placeCategoryMap[place.category] || 'Activities';
        if (!activeFilters.has(category)) return;
        if (!matchesMapSearch(place.name, place.category, place.location, place.locationRef?.formattedAddress)) return;

        const marker = makeTripMapMarker(
          {
            id: `place-${place.id}`,
            kind: category === 'Food' ? 'food' : 'activity',
            label: place.name,
          },
          place.locationRef,
        );
        if (marker) markers.push(marker);
      });

      if (activeFilters.has('Itinerary')) {
        getStopItineraryItems(stop.id).forEach((item) => {
          if (!matchesMapSearch(item.name, item.location, item.type)) return;
          const marker = makeTripMapMarker(
            {
              id: `itinerary-${item.id}`,
              kind: 'itinerary',
              label: item.name,
            },
            item.locationRef,
          );
          if (marker) markers.push(marker);
        });
      }

      if (activeFilters.has('Transport')) {
        getStopTransport(stop.id).forEach((segment) => {
          if (!matchesMapSearch(segment.provider, segment.departureLocation, segment.arrivalLocation, segment.mode)) return;
          const fromMarker = makeTripMapMarker(
            {
              id: `transport-from-${segment.id}`,
              kind: 'transport',
              label: segment.departureLocation,
            },
            segment.fromLocation,
          );
          const toMarker = makeTripMapMarker(
            {
              id: `transport-to-${segment.id}`,
              kind: 'transport',
              label: segment.arrivalLocation,
            },
            segment.toLocation,
          );
          if (fromMarker) markers.push(fromMarker);
          if (toMarker) markers.push(toMarker);
        });
      }
    });

    const seen = new Set<string>();
    return markers.filter((marker) => {
      const key = `${marker.id}:${marker.latitude}:${marker.longitude}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const mapTitle =
    isMultiStop && effectiveSelection === 'all'
      ? 'Whole-trip route view'
      : `${selectedStop?.name ?? trip?.destination ?? 'Trip'} place view`;
  const tripBasePath = trip ? `/trip/${trip.id}` : '';

  if (!trip || !primaryStop) {
    if (isLoadingServiceTrip) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-neutral-500">Loading trip map...</p>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">
          {serviceTripError
            ? 'Unable to load this trip map.'
            : 'Trip not found'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:h-[calc(100vh-8rem)] lg:min-h-[640px] lg:overflow-hidden">
      {(serviceTripError || mapDataError) && (
        <p className="mb-4 text-sm text-warning-700">
          {mapDataError || 'Supabase trip data could not be loaded. Showing local map data instead.'}
        </p>
      )}

      {isMultiStop && (
        <MapRouteSelector
          stops={orderedStops}
          selectedStopId={selectedStopId}
          onSelectStop={setSelectedStopId}
        />
      )}

      <div className="grid flex-1 grid-cols-1 gap-6 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-h-[420px] lg:min-h-0">
          <TripGoogleMap
            markers={googleMapMarkers}
            selectedLabel={mapTitle}
            className="lg:h-full"
            onUnavailable={(
              <MapFallbackView
                mapTitle={mapTitle}
                isMultiStop={isMultiStop}
                routeLinePoints={routeLinePoints}
                orderedStops={orderedStops}
                primaryStop={primaryStop}
                effectiveSelection={effectiveSelection}
                visiblePins={visiblePins}
                onSelectStop={setSelectedStopId}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-4 lg:min-h-0">
          <MapFiltersPanel
            activeFilters={activeFilters}
            searchQuery={mapSearchQuery}
            onSearchChange={setMapSearchQuery}
            onToggleFilter={toggleFilter}
          />

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-card lg:min-h-0">
            <div className="px-4 py-3 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-700">
                {isMultiStop && effectiveSelection === 'all' ? 'All Stops' : `${selectedStop?.name ?? trip.destination} Places`}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-5">
              {isMultiStop && effectiveSelection === 'all' ? (
                orderedStops.map((stop) => {
                  const lodging = getStopHotels(stop.id).find((hotel) => hotel.isSelected) || getStopHotels(stop.id)[0];
                  const showLodging = lodging && matchesMapSearch(lodging.name, lodging.neighborhood, lodging.locationRef?.formattedAddress);
                  const topPlaces = getStopPlaces(stop.id)
                    .filter((place) => matchesMapSearch(place.name, place.category, place.location, place.locationRef?.formattedAddress))
                    .slice(0, 2);
                  const stopTransport = getStopTransport(stop.id)
                    .filter((segment) => matchesMapSearch(segment.provider, segment.departureLocation, segment.arrivalLocation, segment.mode))
                    .slice(0, 1);
                  return (
                    <div key={stop.id}>
                      <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        {stop.order}. {stop.name} · {formatStopDates(stop)}
                      </h4>
                      <div className="space-y-2">
                        {showLodging && (
                          <PanelItem
                            icon={<Building2 className="w-4 h-4" />}
                            title={lodging.name}
                            meta={lodging.neighborhood}
                            rating={lodging.rating}
                            actionLabel="Hotels"
                            onAction={() => navigate(`${tripBasePath}/hotels`)}
                          />
                        )}
                        {topPlaces.map((place) => (
                          <PanelItem
                            key={place.id}
                            icon={placeCategoryMap[place.category] === 'Food' ? <UtensilsCrossed className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                            title={place.name}
                            meta={`${place.category} · ${place.location}`}
                            rating={place.rating}
                            actionLabel="Explore"
                            onAction={() => navigate(`${tripBasePath}/explore`)}
                          />
                        ))}
                        {stopTransport.map((segment) => (
                          <PanelItem
                            key={segment.id}
                            icon={segment.mode === 'train' ? <Train className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                            title={segment.provider || getTransportLabel(segment, orderedStops)}
                            meta={`${segment.departureLocation} to ${segment.arrivalLocation}`}
                            actionLabel="Travel"
                            onAction={() => navigate(`${tripBasePath}/flights`)}
                          />
                        ))}
                        {!showLodging && topPlaces.length === 0 && stopTransport.length === 0 && (
                          <p className="text-sm text-neutral-400">No mapped items yet.</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  {activeFilters.has('Hotels') && selectedLodging && (
                    matchesMapSearch(selectedLodging.name, selectedLodging.neighborhood, selectedLodging.locationRef?.formattedAddress) && (
                      <PanelItem
                        icon={<Building2 className="w-4 h-4" />}
                        title={selectedLodging.name}
                        meta={selectedLodging.neighborhood}
                        rating={selectedLodging.rating}
                        actionLabel="Hotels"
                        onAction={() => navigate(`${tripBasePath}/hotels`)}
                      />
                    )
                  )}
                  {selectedPlaces
                    .filter((place) => activeFilters.has(placeCategoryMap[place.category] || 'Activities'))
                    .filter((place) => matchesMapSearch(place.name, place.category, place.location, place.locationRef?.formattedAddress))
                    .map((place: Place) => (
                      <PanelItem
                        key={place.id}
                        icon={placeCategoryMap[place.category] === 'Food' ? <UtensilsCrossed className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        title={place.name}
                        meta={`${place.category} · ${place.location}`}
                        rating={place.rating}
                        actionLabel="Explore"
                        onAction={() => navigate(`${tripBasePath}/explore`)}
                      />
                    ))}
                  {activeFilters.has('Itinerary') &&
                    selectedItineraryItems
                      .filter((item) => matchesMapSearch(item.name, item.location, item.type))
                      .slice(0, 6)
                      .map((item: ItineraryItem) => (
                      <PanelItem
                        key={item.id}
                        icon={<CalendarDays className="w-4 h-4" />}
                        title={item.name}
                        meta={`${item.time} · ${item.location}`}
                        actionLabel="Itinerary"
                        onAction={() => navigate(`${tripBasePath}/itinerary`)}
                      />
                    ))}
                  {activeFilters.has('Transport') &&
                    selectedTransport
                      .filter((segment) => matchesMapSearch(segment.provider, segment.departureLocation, segment.arrivalLocation, segment.mode))
                      .map((segment) => (
                      <PanelItem
                        key={segment.id}
                        icon={segment.mode === 'train' ? <Train className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                        title={segment.provider || getTransportLabel(segment, orderedStops)}
                        meta={`${segment.departureLocation} to ${segment.arrivalLocation}`}
                        actionLabel="Travel"
                        onAction={() => navigate(`${tripBasePath}/flights`)}
                      />
                    ))}
                  {!selectedLodging &&
                    selectedPlaces.length === 0 &&
                    selectedItineraryItems.length === 0 &&
                    selectedTransport.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mb-3">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-neutral-600">No mapped items</p>
                        <p className="text-xs text-neutral-400 mt-1">Saved places and itinerary items for this stop will appear here.</p>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
