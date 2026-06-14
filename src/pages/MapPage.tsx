import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  Car,
  Filter,
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
import { getPlacesByTripId } from '../data/places';
import {
  getAuthenticatedUserId,
  itineraryService,
  lodgingService,
  savedPlaceService,
} from '../services/travelDataService';
import {
  getHotelIdFromLodgingOption,
  getPlaceIdFromSavedPlace,
} from '../services/tripMappers';
import RatingStars from '../components/ui/RatingStars';
import type {
  Hotel,
  ItineraryDay,
  ItineraryItem,
  Place,
  PlaceCategory,
  TransportSegment,
  TripStop,
} from '../types';
import type {
  LodgingOptionRow,
  SavedPlaceRow,
} from '../services/supabaseTypes';

type CategoryFilter = 'Hotels' | 'Food' | 'Activities' | 'Itinerary' | 'Transport';
type StopSelection = 'all' | string;
type MapPinKind = 'hotel' | 'food' | 'activity' | 'itinerary' | 'transport';

interface MapPinData {
  id: string;
  kind: MapPinKind;
  label: string;
  stopId: string;
  left: string;
  top: string;
}

const categoryIcons: Record<CategoryFilter, React.ReactNode> = {
  Hotels: <Building2 className="w-4 h-4" />,
  Food: <UtensilsCrossed className="w-4 h-4" />,
  Activities: <MapPin className="w-4 h-4" />,
  Itinerary: <CalendarDays className="w-4 h-4" />,
  Transport: <Plane className="w-4 h-4" />,
};

const placeCategoryMap: Record<PlaceCategory, CategoryFilter> = {
  Restaurants: 'Food',
  Cafes: 'Food',
  Museums: 'Activities',
  Outdoor: 'Activities',
  Nightlife: 'Activities',
  Shopping: 'Activities',
  Tours: 'Activities',
  Landmarks: 'Activities',
  'Hidden Gems': 'Activities',
};

const isPlaceCategory = (category?: string | null): category is PlaceCategory =>
  Boolean(category && category in placeCategoryMap);

const getSavedPlaceCategory = (row: SavedPlaceRow): PlaceCategory =>
  isPlaceCategory(row.category) ? row.category : 'Hidden Gems';

const mapLodgingOptionToHotel = (
  row: LodgingOptionRow,
  tripId: string,
): Hotel => ({
  id: getHotelIdFromLodgingOption(row),
  tripId,
  stopId: row.stop_id ?? undefined,
  name: row.name,
  image: '',
  rating: 0,
  reviewCount: 0,
  pricePerNight: row.price_per_night ?? 0,
  totalCost: row.total_cost ?? 0,
  amenities: [],
  neighborhood: row.neighborhood ?? row.address ?? 'Saved lodging',
  distanceToCenter: '',
  description: row.notes ?? '',
  isSelected: row.is_selected || row.is_saved,
});

const mapSavedPlaceToPlace = (row: SavedPlaceRow, tripId: string): Place => ({
  id: getPlaceIdFromSavedPlace(row),
  tripId,
  stopId: row.stop_id ?? undefined,
  name: row.name,
  image: '',
  category: getSavedPlaceCategory(row),
  rating: 0,
  reviewCount: 0,
  priceRange: '',
  location: row.address ?? 'Saved place',
  reviewSnippet: row.notes ?? '',
  tags: [getSavedPlaceCategory(row)],
  description: row.notes ?? undefined,
  isSaved: row.is_saved,
});

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

const stopPositions = [
  { left: '18%', top: '58%' },
  { left: '38%', top: '38%' },
  { left: '60%', top: '56%' },
  { left: '80%', top: '32%' },
  { left: '72%', top: '72%' },
  { left: '28%', top: '26%' },
];

const detailOffsets = [
  { x: -7, y: -12 },
  { x: 9, y: -10 },
  { x: -10, y: 11 },
  { x: 11, y: 12 },
  { x: 0, y: 17 },
];

const singleStopPositions = [
  { left: '48%', top: '44%' },
  { left: '30%', top: '36%' },
  { left: '66%', top: '35%' },
  { left: '28%', top: '64%' },
  { left: '62%', top: '65%' },
  { left: '80%', top: '18%' },
];

const getStopPosition = (index: number) => stopPositions[index % stopPositions.length];

const formatStopDates = (stop: TripStop) => {
  const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = new Date(`${stop.startDate}T00:00:00`).toLocaleDateString('en-US', dateOptions);
  const end = new Date(`${stop.endDate}T00:00:00`).toLocaleDateString('en-US', dateOptions);
  return `${start} - ${end}`;
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

const getPinClasses = (kind: MapPinKind) => {
  switch (kind) {
    case 'hotel':
      return 'bg-primary-600';
    case 'food':
      return 'bg-accent-600';
    case 'activity':
      return 'bg-success-500';
    case 'itinerary':
      return 'bg-warning-500';
    case 'transport':
      return 'bg-error-500';
    default:
      return 'bg-neutral-600';
  }
};

const getPinIcon = (kind: MapPinKind) => {
  switch (kind) {
    case 'hotel':
      return <Building2 className="w-4 h-4" />;
    case 'food':
      return <UtensilsCrossed className="w-4 h-4" />;
    case 'transport':
      return <Plane className="w-4 h-4" />;
    case 'itinerary':
      return <CalendarDays className="w-4 h-4" />;
    default:
      return <MapPin className="w-4 h-4" />;
  }
};

const MapPinMarker: React.FC<MapPinData> = ({ kind, left, top, label }) => (
  <div className="absolute group cursor-pointer" style={{ left, top }}>
    <div
      className={[
        'flex items-center justify-center w-9 h-9 rounded-full shadow-lg text-white',
        'transition-transform duration-200 group-hover:scale-110',
        getPinClasses(kind),
      ].join(' ')}
    >
      {getPinIcon(kind)}
    </div>
    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-neutral-700 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm">
      {label}
    </span>
  </div>
);

const StopMarker: React.FC<{
  stop: TripStop;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ stop, index, isSelected, onSelect }) => {
  const position = getStopPosition(index);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="absolute group text-left"
      style={{ left: position.left, top: position.top }}
    >
      <div
        className={[
          'flex items-center justify-center w-14 h-14 rounded-full shadow-lg border-2 transition-transform duration-200 group-hover:scale-105',
          isSelected ? 'bg-primary-600 border-white text-white' : 'bg-white border-primary-200 text-primary-600',
        ].join(' ')}
      >
        <span className="text-base font-bold">{stop.order}</span>
      </div>
      <div className="absolute left-1/2 top-16 -translate-x-1/2 min-w-max rounded-xl bg-white/95 px-3 py-1.5 shadow-sm border border-neutral-100">
        <p className="text-xs font-semibold text-neutral-800">{stop.name}</p>
        <p className="text-[11px] text-neutral-400">{formatStopDates(stop)}</p>
      </div>
    </button>
  );
};

const PanelItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  meta: string;
  actionLabel?: string;
  rating?: number;
}> = ({ icon, title, meta, actionLabel = 'View details', rating }) => (
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
    <button className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors duration-150">
      <Plus className="w-3 h-3" />
      {actionLabel}
    </button>
  </div>
);

const MapPage: React.FC = () => {
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
            .map((row) => mapLodgingOptionToHotel(row, trip.id)),
        );
        setServicePlaces(
          savedPlaceRows
            .filter((row) => row.is_saved)
            .map((row) => mapSavedPlaceToPlace(row, trip.id)),
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
          pins.push({ id: hotel.id, kind: 'hotel', label: hotel.name, stopId: stop.id, ...makePosition(pinIndex++) });
        });
      }
      getStopPlaces(stop.id).slice(0, 4).forEach((place) => {
        const category = placeCategoryMap[place.category] || 'Activities';
        if (!activeFilters.has(category)) return;
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
          pins.push({ id: item.id, kind: 'itinerary', label: item.name, stopId: stop.id, ...makePosition(pinIndex++) });
        });
      }
      if (activeFilters.has('Transport')) {
        getStopTransport(stop.id).slice(0, 2).forEach((segment) => {
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
    <div className="space-y-6">
      {(serviceTripError || mapDataError) && (
        <p className="text-sm text-warning-700">
          {mapDataError || 'Supabase trip data could not be loaded. Showing local map data instead.'}
        </p>
      )}

      {isMultiStop && (
        <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-4">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Trip Route</p>
          <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-neutral-900">
            {orderedStops.map((stop, index) => (
              <React.Fragment key={stop.id}>
                <span>{stop.name}</span>
                {index < orderedStops.length - 1 && <span className="text-neutral-300">→</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={() => setSelectedStopId('all')}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedStopId === 'all' ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              ].join(' ')}
            >
              All Stops
            </button>
            {orderedStops.map((stop) => (
              <button
                key={stop.id}
                type="button"
                onClick={() => setSelectedStopId(stop.id)}
                className={[
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedStopId === stop.id ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                ].join(' ')}
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs">
                  {stop.order}
                </span>
                {stop.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="lg:w-[70%] w-full">
          <div className="relative w-full h-[440px] lg:h-full min-h-[440px] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100">
            <div className="absolute top-4 left-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
              <MapPin className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-neutral-600">
                {isMultiStop && effectiveSelection === 'all'
                  ? 'Whole-trip route view'
                  : `${selectedStop?.name ?? trip.destination} place view`}
              </span>
            </div>

            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 bottom-0 left-[20%] w-px bg-primary-400" />
              <div className="absolute top-0 bottom-0 left-[40%] w-px bg-primary-400" />
              <div className="absolute top-0 bottom-0 left-[60%] w-px bg-primary-400" />
              <div className="absolute top-0 bottom-0 left-[80%] w-px bg-primary-400" />
              <div className="absolute left-0 right-0 top-[25%] h-px bg-primary-400" />
              <div className="absolute left-0 right-0 top-[50%] h-px bg-primary-400" />
              <div className="absolute left-0 right-0 top-[75%] h-px bg-primary-400" />
            </div>

            {isMultiStop && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  points={routeLinePoints}
                  fill="none"
                  stroke="rgba(37, 99, 235, 0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {isMultiStop
              ? orderedStops.map((stop, index) => (
                  <StopMarker
                    key={stop.id}
                    stop={stop}
                    index={index}
                    isSelected={effectiveSelection === 'all' || effectiveSelection === stop.id}
                    onSelect={() => setSelectedStopId(stop.id)}
                  />
                ))
              : (
                <StopMarker
                  stop={primaryStop}
                  index={0}
                  isSelected
                  onSelect={() => setSelectedStopId(primaryStop.id)}
                />
              )}

            {visiblePins.map((pin) => (
              <MapPinMarker key={`${pin.kind}-${pin.id}`} {...pin} />
            ))}

            {visiblePins.length === 0 && (
              <div className="absolute left-1/2 bottom-6 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-sm border border-neutral-100 text-center">
                <p className="text-sm font-medium text-neutral-700">No pins in this view</p>
                <p className="text-xs text-neutral-400 mt-0.5">Add hotels, places, itinerary items, or travel details for this stop.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-[30%] w-full flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-700">Filter Pins</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(categoryIcons) as CategoryFilter[]).map((category) => (
                <button
                  key={category}
                  onClick={() => toggleFilter(category)}
                  className={[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                    activeFilters.has(category)
                      ? 'bg-primary-50 text-primary-600 border border-primary-200'
                      : 'bg-neutral-50 text-neutral-400 border border-neutral-200',
                  ].join(' ')}
                >
                  {categoryIcons[category]}
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-700">
                {isMultiStop && effectiveSelection === 'all' ? 'All Stops' : `${selectedStop?.name ?? trip.destination} Places`}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-5">
              {isMultiStop && effectiveSelection === 'all' ? (
                orderedStops.map((stop) => {
                  const lodging = getStopHotels(stop.id).find((hotel) => hotel.isSelected) || getStopHotels(stop.id)[0];
                  const topPlaces = getStopPlaces(stop.id).slice(0, 2);
                  const stopTransport = getStopTransport(stop.id).slice(0, 1);
                  return (
                    <div key={stop.id}>
                      <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        {stop.order}. {stop.name} · {formatStopDates(stop)}
                      </h4>
                      <div className="space-y-2">
                        {lodging && (
                          <PanelItem
                            icon={<Building2 className="w-4 h-4" />}
                            title={lodging.name}
                            meta={lodging.neighborhood}
                            rating={lodging.rating}
                          />
                        )}
                        {topPlaces.map((place) => (
                          <PanelItem
                            key={place.id}
                            icon={placeCategoryMap[place.category] === 'Food' ? <UtensilsCrossed className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                            title={place.name}
                            meta={`${place.category} · ${place.location}`}
                            rating={place.rating}
                          />
                        ))}
                        {stopTransport.map((segment) => (
                          <PanelItem
                            key={segment.id}
                            icon={segment.mode === 'train' ? <Train className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                            title={segment.provider || getTransportLabel(segment, orderedStops)}
                            meta={`${segment.departureLocation} to ${segment.arrivalLocation}`}
                            actionLabel="View"
                          />
                        ))}
                        {!lodging && topPlaces.length === 0 && stopTransport.length === 0 && (
                          <p className="text-sm text-neutral-400">No mapped items yet.</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  {activeFilters.has('Hotels') && selectedLodging && (
                    <PanelItem
                      icon={<Building2 className="w-4 h-4" />}
                      title={selectedLodging.name}
                      meta={selectedLodging.neighborhood}
                      rating={selectedLodging.rating}
                    />
                  )}
                  {selectedPlaces
                    .filter((place) => activeFilters.has(placeCategoryMap[place.category] || 'Activities'))
                    .map((place: Place) => (
                      <PanelItem
                        key={place.id}
                        icon={placeCategoryMap[place.category] === 'Food' ? <UtensilsCrossed className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        title={place.name}
                        meta={`${place.category} · ${place.location}`}
                        rating={place.rating}
                        actionLabel="Add"
                      />
                    ))}
                  {activeFilters.has('Itinerary') &&
                    selectedItineraryItems.slice(0, 6).map((item: ItineraryItem) => (
                      <PanelItem
                        key={item.id}
                        icon={<CalendarDays className="w-4 h-4" />}
                        title={item.name}
                        meta={`${item.time} · ${item.location}`}
                        actionLabel="View"
                      />
                    ))}
                  {activeFilters.has('Transport') &&
                    selectedTransport.map((segment) => (
                      <PanelItem
                        key={segment.id}
                        icon={segment.mode === 'train' ? <Train className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                        title={segment.provider || getTransportLabel(segment, orderedStops)}
                        meta={`${segment.departureLocation} to ${segment.arrivalLocation}`}
                        actionLabel="View"
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
