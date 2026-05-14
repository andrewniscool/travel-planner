import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Sun,
  Sunrise,
  Moon,
  MapPin,
  DollarSign,
  GripVertical,
  X,
  Pencil,
  Plus,
  Plane,
  Building2,
  UtensilsCrossed,
  Coffee,
  Car,
  Calendar,
  Bookmark,
} from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getItineraryByTripId } from '../data/itinerary';
import { getPlacesByTripId } from '../data/places';
import { getPrimaryStop, getTripDisplayName, isMultiStopTrip } from '../data/trips';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  getAuthenticatedUserId,
  itineraryService,
} from '../services/travelDataService';
import Modal from '../components/ui/Modal';
import type {
  ItineraryDay,
  ItineraryItem,
  ItineraryItemType,
  TimeOfDay,
  Place,
  TripStop,
} from '../types';

const LOCAL_REMOVED_ITINERARY_ITEMS_KEY = 'travel-builder:removed-itinerary-items';

const loadRemovedItems = (tripId: string) => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(LOCAL_REMOVED_ITINERARY_ITEMS_KEY) ?? '{}',
    ) as Record<string, string[]>;
    return new Set(stored[tripId] ?? []);
  } catch {
    return new Set<string>();
  }
};

const persistRemovedItems = (tripId: string, itemIds: Set<string>) => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(LOCAL_REMOVED_ITINERARY_ITEMS_KEY) ?? '{}',
    ) as Record<string, string[]>;
    window.localStorage.setItem(
      LOCAL_REMOVED_ITINERARY_ITEMS_KEY,
      JSON.stringify({ ...stored, [tripId]: [...itemIds] }),
    );
  } catch {
    window.localStorage.setItem(
      LOCAL_REMOVED_ITINERARY_ITEMS_KEY,
      JSON.stringify({ [tripId]: [...itemIds] }),
    );
  }
};

const typeIconMap: Record<ItineraryItemType, React.ReactNode> = {
  flight: <Plane className="w-4 h-4" />,
  hotel: <Building2 className="w-4 h-4" />,
  restaurant: <UtensilsCrossed className="w-4 h-4" />,
  activity: <MapPin className="w-4 h-4" />,
  'free-time': <Coffee className="w-4 h-4" />,
  transport: <Car className="w-4 h-4" />,
};

const typeColorMap: Record<ItineraryItemType, string> = {
  flight: 'bg-blue-100 text-blue-600',
  hotel: 'bg-purple-100 text-purple-600',
  restaurant: 'bg-orange-100 text-orange-600',
  activity: 'bg-emerald-100 text-emerald-600',
  'free-time': 'bg-amber-100 text-amber-600',
  transport: 'bg-cyan-100 text-cyan-600',
};

const timeOfDayConfig: Record<TimeOfDay, { label: string; icon: React.ReactNode; color: string }> = {
  morning: {
    label: 'Morning',
    icon: <Sunrise className="w-4 h-4" />,
    color: 'text-amber-500',
  },
  afternoon: {
    label: 'Afternoon',
    icon: <Sun className="w-4 h-4" />,
    color: 'text-orange-500',
  },
  evening: {
    label: 'Evening',
    icon: <Moon className="w-4 h-4" />,
    color: 'text-indigo-500',
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Inline ItineraryItem component
const ItineraryItemRow: React.FC<{
  item: ItineraryItem;
  onRemove: (id: string) => void;
}> = ({ item, onRemove }) => {
  const iconBg = typeColorMap[item.type] || 'bg-neutral-100 text-neutral-600';

  return (
    <div className="group flex items-start gap-3 p-3 rounded-xl bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all duration-150">
      {/* Grip Handle */}
      <div className="flex items-center pt-1 text-neutral-300 cursor-grab">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Type Icon */}
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${iconBg}`}>
        {typeIconMap[item.type] || <MapPin className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-primary-600">{item.time}</span>
          <span className="text-sm font-semibold text-neutral-900 truncate">
            {item.name}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {item.location}
          </span>
          {item.estimatedCost > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />${item.estimatedCost}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{item.notes}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// Inline DaySection component
const DaySection: React.FC<{
  day: ItineraryDay;
  stop?: TripStop;
  showStopLabel: boolean;
  isTravelDay: boolean;
  itemsMap: Record<string, ItineraryItem[]>;
  onRemoveItem: (itemId: string) => void;
}> = ({ day, stop, showStopLabel, isTravelDay, itemsMap, onRemoveItem }) => {
  const timeSections: TimeOfDay[] = ['morning', 'afternoon', 'evening'];

  return (
    <div className="space-y-4">
      {/* Day Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white font-bold text-lg shadow-md">
          {day.dayNumber}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-neutral-900">Day {day.dayNumber}</h3>
            {showStopLabel && stop && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
                <MapPin className="w-3 h-3" />
                {stop.name}
              </span>
            )}
            {isTravelDay && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-600">
                <Car className="w-3 h-3" />
                Travel day
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500">
            {formatDate(day.date)}
            {showStopLabel && stop?.country ? ` · ${stop.country}` : ''}
          </p>
        </div>
      </div>

      {/* Time Sections */}
      <div className="ml-6 pl-6 border-l-2 border-neutral-100 space-y-5">
        {timeSections.map((timeOfDay) => {
          const config = timeOfDayConfig[timeOfDay];
          const sectionKey = `${day.dayNumber}-${timeOfDay}`;
          const items = itemsMap[sectionKey] || [];

          return (
            <div key={timeOfDay} className="space-y-2.5">
              {/* Section Header */}
              <div className="flex items-center gap-2">
                <span className={config.color}>{config.icon}</span>
                <h4 className="text-sm font-semibold text-neutral-700">{config.label}</h4>
                {items.length > 0 && (
                  <span className="text-xs text-neutral-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {/* Items */}
              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((item) => (
                    <ItineraryItemRow
                      key={item.id}
                      item={item}
                      onRemove={onRemoveItem}
                    />
                  ))}
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
                  <p className="text-sm text-neutral-400">No activities planned</p>
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Itinerary: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const fallbackTrip = useTrip();
  const {
    trip: serviceTrip,
    error: serviceTripError,
    source: tripSource,
  } = useServiceTrip(tripId);
  const trip = serviceTrip ?? fallbackTrip;
  const fallbackItineraryData = useMemo(
    () => (trip ? getItineraryByTripId(trip.id) : []),
    [trip],
  );
  const [itineraryData, setItineraryData] = useState<ItineraryDay[]>(
    fallbackItineraryData,
  );
  const [itinerarySource, setItinerarySource] = useState<'supabase' | 'fallback'>('fallback');
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const savedPlaces = useMemo(
    () => (trip ? getPlacesByTripId(trip.id).filter((p) => p.isSaved) : []),
    [trip]
  );
  const orderedStops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.order - b.order) : []),
    [trip]
  );
  const primaryStop = trip ? getPrimaryStop(trip) : undefined;
  const isMultiStop = trip ? isMultiStopTrip(trip) : false;

  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const [showSavedPlacesModal, setShowSavedPlacesModal] = useState(false);

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;

    setRemovedItems(loadRemovedItems(trip.id));
    setItineraryData(fallbackItineraryData);
    setItinerarySource('fallback');
    setItineraryError(null);

    async function loadSupabaseItinerary() {
      if (!trip || tripSource !== 'supabase') return;

      try {
        const userId = await getAuthenticatedUserId();
        if (!userId) return;

        const days = await itineraryService.listItineraryDays(trip.id);
        if (cancelled) return;

        if (days.length > 0) {
          setItineraryData(days);
          setItinerarySource('supabase');
        }
      } catch {
        if (cancelled) return;
        setItineraryError('Supabase itinerary could not be loaded. Showing local itinerary instead.');
      }
    }

    void loadSupabaseItinerary();

    return () => {
      cancelled = true;
    };
  }, [fallbackItineraryData, trip, tripSource]);

  const getStopForDay = useCallback(
    (day: ItineraryDay) =>
      orderedStops.find((stop) => stop.id === day.stopId) ?? primaryStop,
    [orderedStops, primaryStop]
  );

  // Build a map of items keyed by "dayNumber-timeOfDay"
  const itemsMap = useMemo(() => {
    const map: Record<string, ItineraryItem[]> = {};
    for (const day of itineraryData) {
      const dayStop = getStopForDay(day);
      for (const timeOfDay of ['morning', 'afternoon', 'evening'] as TimeOfDay[]) {
        const key = `${day.dayNumber}-${timeOfDay}`;
        const items = day[timeOfDay]
          .filter((item) => !removedItems.has(item.id))
          .map((item) => ({
            ...item,
            stopId: item.stopId ?? day.stopId ?? dayStop?.id,
          }));
        map[key] = items;
      }
    }
    return map;
  }, [getStopForDay, itineraryData, removedItems]);

  const handleRemoveItem = async (itemId: string) => {
    if (!trip) return;

    const nextRemovedItems = new Set([...removedItems, itemId]);
    setRemovedItems(nextRemovedItems);
    persistRemovedItems(trip.id, nextRemovedItems);

    if (itinerarySource !== 'supabase') return;

    try {
      await itineraryService.deleteItineraryItem(itemId);
      setItineraryError(null);
    } catch {
      setItinerarySource('fallback');
      setItineraryError('Supabase itinerary delete failed. Removed the item locally instead.');
    }
  };

  const handleAddSavedPlace = (place: Place) => {
    // Placeholder: would add to itinerary
    alert(`Added "${place.name}" to your itinerary!`);
  };

  if (itineraryData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Itinerary</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Plan your day-by-day schedule
          </p>
          {(serviceTripError || itineraryError) && (
            <p className="text-sm text-warning-700 mt-2">
              {itineraryError || 'Supabase trip data could not be loaded. Showing local itinerary instead.'}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-1">No itinerary yet</h3>
          <p className="text-sm text-neutral-500 max-w-sm">
            Start building your day-by-day itinerary by adding places and activities.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Itinerary</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {itineraryData.length} day{itineraryData.length !== 1 ? 's' : ''} for {trip ? getTripDisplayName(trip) : 'your trip'}
          </p>
          {(serviceTripError || itineraryError) && (
            <p className="text-sm text-warning-700 mt-2">
              {itineraryError || 'Supabase trip data could not be loaded. Showing local itinerary instead.'}
            </p>
          )}
        </div>

        {savedPlaces.length > 0 && (
          <button
            onClick={() => setShowSavedPlacesModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            Add from Saved Places
          </button>
        )}
      </div>

      {/* Day-by-Day Layout */}
      <div className="space-y-10">
        {itineraryData.map((day, index) => {
          const stop = getStopForDay(day);
          const previousStop = index > 0 ? getStopForDay(itineraryData[index - 1]) : undefined;
          const showTransition = isMultiStop && stop && stop.id !== previousStop?.id;
          const dayItems = [
            ...day.morning,
            ...day.afternoon,
            ...day.evening,
          ];
          const isTravelDay = dayItems.some((item) => item.type === 'transport' || item.type === 'flight');

          return (
            <div key={day.dayNumber} className="space-y-4">
              {showTransition && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-neutral-200" />
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-sm font-medium text-neutral-700 shadow-sm">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    {stop.name}
                  </div>
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>
              )}
              <DaySection
                day={day}
                stop={stop}
                showStopLabel={isMultiStop}
                isTravelDay={isTravelDay}
                itemsMap={itemsMap}
                onRemoveItem={handleRemoveItem}
              />
            </div>
          );
        })}
      </div>

      {/* Saved Places Modal */}
      <Modal
        isOpen={showSavedPlacesModal}
        onClose={() => setShowSavedPlacesModal(false)}
        title="Add from Saved Places"
        size="md"
      >
        <div className="space-y-3">
          {savedPlaces.length > 0 ? (
            savedPlaces.map((place) => (
              <div
                key={place.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {place.name}
                  </p>
                  <p className="text-xs text-neutral-500">{place.category} - {place.location}</p>
                </div>
                <button
                  onClick={() => handleAddSavedPlace(place)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Bookmark className="w-8 h-8 text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500">No saved places yet</p>
              <p className="text-xs text-neutral-400 mt-1">
                Save places from the Explore page to add them here
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Itinerary;
