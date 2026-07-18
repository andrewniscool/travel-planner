import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Calendar, Bookmark } from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getBudgetByTripId } from '../data/budget';
import { getItineraryByTripId } from '../data/itinerary';
import { getPlacesByTripId } from '../data/places';
import { getPrimaryStop, getTripDisplayName, isMultiStopTrip } from '../data/trips';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  budgetService,
  getAuthenticatedUserId,
  itineraryService,
  locationRefService,
  savedPlaceService,
} from '../services/travelDataService';
import {
  getPersistedLocationRefId,
  getPlaceItineraryTimeOfDay,
  getPlaceItineraryType,
} from '../services/locationDisplayMappers';
import { mapLocationRefRowToLocationRef, mapSavedPlaceRowToPlace } from '../services/tripMappers';
import { loadTripScopedValue, persistTripScopedValue } from '../utils/tripStorage';
import { getBudgetCategoryKey } from '../utils/budget';
import DaySection from '../components/itinerary/DaySection';
import ItineraryItemModal, {
  type ItineraryFormErrors,
  type ItineraryItemFormState,
  type ItineraryModalMode,
} from '../components/itinerary/ItineraryItemModal';
import SavedPlacesModal from '../components/itinerary/SavedPlacesModal';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import type {
  BudgetExpense,
  ItineraryDay,
  ItineraryItem,
  TimeOfDay,
  Place,
  LocationRef,
} from '../types';
import type { ItineraryItemInsert, ItineraryItemUpdate } from '../services/supabaseTypes';

const LOCAL_REMOVED_ITINERARY_ITEMS_KEY = 'travel-builder:removed-itinerary-items';
const LOCAL_ITINERARY_DAYS_KEY = 'travel-builder:itinerary-days';
const LOCAL_BUDGET_EXPENSES_KEY = 'travel-builder:budget-expenses';
const LOCAL_ITINERARY_BUDGET_LINKS_KEY = 'travel-builder:itinerary-budget-expense-links';
const ITINERARY_EXPENSE_PREFIX = 'itinerary-expense';

interface ItineraryModalState {
  mode: ItineraryModalMode;
  dayNumber: number;
  timeOfDay: TimeOfDay;
  itemId?: string;
}

const emptyItineraryForm = (): ItineraryItemFormState => ({
  time: '',
  name: '',
  type: 'activity',
  location: '',
  estimatedCost: '',
  notes: '',
  budgetCategory: '',
  locationRef: null,
});

const loadRemovedItems = (tripId: string) => {
  return new Set(loadTripScopedValue(LOCAL_REMOVED_ITINERARY_ITEMS_KEY, tripId, []));
};

const persistRemovedItems = (tripId: string, itemIds: Set<string>) => {
  persistTripScopedValue(LOCAL_REMOVED_ITINERARY_ITEMS_KEY, tripId, [...itemIds]);
};

const loadStoredItineraryDays = (tripId: string): ItineraryDay[] | null => {
  return loadTripScopedValue<ItineraryDay[] | null>(LOCAL_ITINERARY_DAYS_KEY, tripId, null);
};

const persistStoredItineraryDays = (tripId: string, days: ItineraryDay[]) => {
  persistTripScopedValue(LOCAL_ITINERARY_DAYS_KEY, tripId, days);
};

const loadStoredExpenses = (tripId: string): BudgetExpense[] => {
  return loadTripScopedValue(LOCAL_BUDGET_EXPENSES_KEY, tripId, []);
};

const persistStoredExpenses = (tripId: string, expenses: BudgetExpense[]) => {
  persistTripScopedValue(LOCAL_BUDGET_EXPENSES_KEY, tripId, expenses);
};

const loadItineraryBudgetLinks = (tripId: string): Record<string, string> => {
  return loadTripScopedValue(LOCAL_ITINERARY_BUDGET_LINKS_KEY, tripId, {});
};

const persistItineraryBudgetLinks = (tripId: string, links: Record<string, string>) => {
  persistTripScopedValue(LOCAL_ITINERARY_BUDGET_LINKS_KEY, tripId, links);
};

const getItineraryExpenseId = (itemId: string) => `${ITINERARY_EXPENSE_PREFIX}-${itemId}`;

const findItineraryExpense = (
  expenses: BudgetExpense[],
  item: ItineraryItem,
  expenseLinks: Record<string, string>,
) => {
  const linkedExpenseId = expenseLinks[item.id] ?? getItineraryExpenseId(item.id);
  return expenses.find((expense) => expense.id === linkedExpenseId);
};

const getDaySection = (
  days: ItineraryDay[],
  itemId: string,
): { dayNumber: number; timeOfDay: TimeOfDay; item: ItineraryItem } | null => {
  for (const day of days) {
    for (const timeOfDay of ['morning', 'afternoon', 'evening'] as TimeOfDay[]) {
      const item = day[timeOfDay].find((currentItem) => currentItem.id === itemId);
      if (item) return { dayNumber: day.dayNumber, timeOfDay, item };
    }
  }

  return null;
};

const Itinerary: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const fallbackTrip = useTrip();
  const { trip: serviceTrip, error: serviceTripError, source: tripSource } = useServiceTrip(tripId);
  const trip = serviceTrip ?? fallbackTrip;
  const fallbackItineraryData = useMemo(() => (trip ? getItineraryByTripId(trip.id) : []), [trip]);
  const [itineraryData, setItineraryData] = useState<ItineraryDay[]>(fallbackItineraryData);
  const [itinerarySource, setItinerarySource] = useState<'supabase' | 'fallback'>('fallback');
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const savedPlaces = useMemo(
    () => (trip ? getPlacesByTripId(trip.id).filter((p) => p.isSaved) : []),
    [trip],
  );
  const [serviceSavedPlaces, setServiceSavedPlaces] = useState<Place[]>([]);
  const availableSavedPlaces = useMemo(() => {
    const placesById = new Map<string, Place>();
    [...savedPlaces, ...serviceSavedPlaces].forEach((place) => {
      placesById.set(place.id, place);
    });
    return [...placesById.values()];
  }, [savedPlaces, serviceSavedPlaces]);
  const budgetCategories = useMemo(
    () => (trip ? (getBudgetByTripId(trip.id)?.categories ?? []) : []),
    [trip],
  );
  const orderedStops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.order - b.order) : []),
    [trip],
  );
  const primaryStop = trip ? getPrimaryStop(trip) : undefined;
  const isMultiStop = trip ? isMultiStopTrip(trip) : false;

  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const [showSavedPlacesModal, setShowSavedPlacesModal] = useState(false);
  const [itemModal, setItemModal] = useState<ItineraryModalState | null>(null);
  const [itemForm, setItemForm] = useState<ItineraryItemFormState>(emptyItineraryForm);
  const [itemFormErrors, setItemFormErrors] = useState<ItineraryFormErrors>({});
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [budgetExpenses, setBudgetExpenses] = useState<BudgetExpense[]>(() =>
    trip ? loadStoredExpenses(trip.id) : [],
  );
  const [budgetExpenseLinks, setBudgetExpenseLinks] = useState<Record<string, string>>(() =>
    trip ? loadItineraryBudgetLinks(trip.id) : {},
  );

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;
    const storedItineraryData = loadStoredItineraryDays(trip.id);

    setRemovedItems(loadRemovedItems(trip.id));
    setItineraryData(storedItineraryData ?? fallbackItineraryData);
    setBudgetExpenses(loadStoredExpenses(trip.id));
    setBudgetExpenseLinks(loadItineraryBudgetLinks(trip.id));
    setServiceSavedPlaces([]);
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

        const [expenses, savedPlaceRows] = await Promise.all([
          budgetService.listBudgetExpenses(trip.id),
          savedPlaceService.listSavedPlaces(trip.id),
        ]);
        if (cancelled) return;
        setBudgetExpenses(expenses);
        setServiceSavedPlaces(
          savedPlaceRows
            .filter((row) => row.is_saved)
            .map((row) => mapSavedPlaceRowToPlace(row, trip.id)),
        );
        persistStoredExpenses(trip.id, expenses);
      } catch {
        if (cancelled) return;
        setItineraryError(
          'Supabase itinerary could not be loaded. Showing local itinerary instead.',
        );
      }
    }

    void loadSupabaseItinerary();

    return () => {
      cancelled = true;
    };
  }, [fallbackItineraryData, trip, tripSource]);

  const getStopForDay = useCallback(
    (day: ItineraryDay) => orderedStops.find((stop) => stop.id === day.stopId) ?? primaryStop,
    [orderedStops, primaryStop],
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

  const updateLocalItineraryData = (nextDays: ItineraryDay[]) => {
    if (!trip) return;
    setItineraryData(nextDays);
    persistStoredItineraryDays(trip.id, nextDays);
  };

  const updateLocalBudgetExpenses = (nextExpenses: BudgetExpense[]) => {
    if (!trip) return;
    setBudgetExpenses(nextExpenses);
    persistStoredExpenses(trip.id, nextExpenses);
  };

  const updateBudgetExpenseLinks = (nextLinks: Record<string, string>) => {
    if (!trip) return;
    setBudgetExpenseLinks(nextLinks);
    persistItineraryBudgetLinks(trip.id, nextLinks);
  };

  const getBudgetCategoryByKey = (categoryKey: string) =>
    budgetCategories.find((category) => getBudgetCategoryKey(category) === categoryKey);

  const openAddItemModal = (dayNumber: number, timeOfDay: TimeOfDay) => {
    setItemModal({ mode: 'add', dayNumber, timeOfDay });
    setItemForm(emptyItineraryForm());
    setItemFormErrors({});
  };

  const openEditItemModal = (item: ItineraryItem) => {
    const section = getDaySection(itineraryData, item.id);
    if (!section) return;

    const linkedExpense = findItineraryExpense(budgetExpenses, item, budgetExpenseLinks);
    const linkedCategory = linkedExpense
      ? budgetCategories.find(
          (category) =>
            category.name === linkedExpense.category &&
            (category.stopId ?? '') === (linkedExpense.stopId ?? ''),
        )
      : undefined;

    setItemModal({
      mode: 'edit',
      dayNumber: section.dayNumber,
      timeOfDay: section.timeOfDay,
      itemId: item.id,
    });
    setItemForm({
      time: item.time,
      name: item.name,
      type: item.type,
      location: item.location,
      estimatedCost: item.estimatedCost > 0 ? String(item.estimatedCost) : '',
      notes: item.notes,
      budgetCategory: linkedCategory ? getBudgetCategoryKey(linkedCategory) : '',
      locationRef: item.locationRef ?? null,
    });
    setItemFormErrors({});
  };

  const closeItemModal = () => {
    setItemModal(null);
    setItemForm(emptyItineraryForm());
    setItemFormErrors({});
  };

  const handleItemFormChange = (field: keyof ItineraryItemFormState, value: string) => {
    setItemForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setItemFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const handleItemLocationChange = (location: LocationRef | null) => {
    setItemForm((currentForm) => ({
      ...currentForm,
      locationRef: location,
      location: location?.formattedAddress ?? location?.name ?? '',
    }));
    setItemFormErrors((currentErrors) => ({
      ...currentErrors,
      location: undefined,
    }));
  };

  const validateItemForm = () => {
    const errors: ItineraryFormErrors = {};
    const cost = itemForm.estimatedCost.trim() === '' ? 0 : Number(itemForm.estimatedCost);

    if (!itemForm.time) errors.time = 'Time is required.';
    if (!itemForm.name.trim()) errors.name = 'Name is required.';
    if (!itemForm.location.trim()) errors.location = 'Location is required.';
    if (!Number.isFinite(cost) || cost < 0) {
      errors.estimatedCost = 'Enter a valid cost.';
    }
    if (cost > 0 && !itemForm.budgetCategory) {
      errors.budgetCategory = 'Choose a budget category for paid items.';
    }
    if (cost > 0 && itemForm.budgetCategory && !getBudgetCategoryByKey(itemForm.budgetCategory)) {
      errors.budgetCategory = 'Choose an existing budget category.';
    }

    setItemFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveItineraryItemToSupabase = async (
    item: ItineraryItem,
    day: ItineraryDay,
    timeOfDay: TimeOfDay,
    orderIndex: number,
    mode: ItineraryModalMode,
  ) => {
    if (!trip) return item;

    const userId = await getAuthenticatedUserId();
    const locationRef =
      userId && item.locationRef?.googlePlaceId
        ? mapLocationRefRowToLocationRef(
            await locationRefService.upsertGoogleLocationRef(userId, item.locationRef),
          )
        : item.locationRef;

    const payload: ItineraryItemInsert | ItineraryItemUpdate = {
      trip_id: trip.id,
      stop_id: item.stopId ?? day.stopId ?? null,
      location_ref_id: getPersistedLocationRefId(locationRef),
      title: item.name,
      item_type: item.type,
      date: day.date,
      start_time: item.time || null,
      time_of_day: timeOfDay,
      location_text: locationRef?.formattedAddress ?? item.location ?? null,
      estimated_cost: item.estimatedCost,
      notes: item.notes || null,
      order_index: orderIndex,
    };

    if (mode === 'edit' && itemModal?.itemId) {
      const savedItem = await itineraryService.updateItineraryItem(
        itemModal.itemId,
        payload as ItineraryItemUpdate,
      );
      return {
        ...savedItem,
        locationRef: savedItem.locationRef ?? locationRef ?? undefined,
      };
    }

    const savedItem = await itineraryService.createItineraryItem(payload as ItineraryItemInsert);
    return {
      ...savedItem,
      locationRef: savedItem.locationRef ?? locationRef ?? undefined,
    };
  };

  const saveItineraryBudgetExpense = async (
    item: ItineraryItem,
    day: ItineraryDay,
    categoryKey: string,
    existingExpenseOverride?: BudgetExpense,
  ) => {
    if (!trip) return;

    const category = getBudgetCategoryByKey(categoryKey);
    const existingExpense =
      existingExpenseOverride ?? findItineraryExpense(budgetExpenses, item, budgetExpenseLinks);
    const nextExpenses = existingExpense
      ? budgetExpenses.filter((expense) => expense.id !== existingExpense.id)
      : budgetExpenses;

    if (item.estimatedCost <= 0 || !category) {
      if (existingExpense) {
        const nextLinks = { ...budgetExpenseLinks };
        delete nextLinks[item.id];
        if (itinerarySource === 'supabase') {
          try {
            await budgetService.deleteBudgetExpense(existingExpense.id);
          } catch {
            setItinerarySource('fallback');
            setItineraryError(
              'Supabase budget update failed. Saved budget changes locally instead.',
            );
          }
        }
        updateLocalBudgetExpenses(nextExpenses);
        updateBudgetExpenseLinks(nextLinks);
      }
      return;
    }

    const expense: BudgetExpense = {
      id: existingExpense?.id ?? getItineraryExpenseId(item.id),
      tripId: trip.id,
      category: category.name,
      stopId: category.stopId,
      title: item.name,
      amount: item.estimatedCost,
      date: day.date,
      notes: item.notes || undefined,
    };

    if (itinerarySource === 'supabase') {
      try {
        const savedExpense = existingExpense
          ? await budgetService.updateBudgetExpense(expense)
          : await budgetService.createBudgetExpense(expense);
        updateLocalBudgetExpenses([savedExpense, ...nextExpenses]);
        updateBudgetExpenseLinks({
          ...budgetExpenseLinks,
          [item.id]: savedExpense.id,
        });
        return;
      } catch {
        setItinerarySource('fallback');
        setItineraryError('Supabase budget update failed. Saved budget changes locally instead.');
      }
    }

    updateLocalBudgetExpenses([expense, ...nextExpenses]);
    updateBudgetExpenseLinks({
      ...budgetExpenseLinks,
      [item.id]: expense.id,
    });
  };

  const handleSaveItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trip || !itemModal || !validateItemForm()) return;

    const day = itineraryData.find((currentDay) => currentDay.dayNumber === itemModal.dayNumber);
    if (!day) return;

    const cost = itemForm.estimatedCost.trim() === '' ? 0 : Number(itemForm.estimatedCost);
    const existingItem =
      itemModal.mode === 'edit' && itemModal.itemId
        ? getDaySection(itineraryData, itemModal.itemId)?.item
        : null;
    const existingExpense = existingItem
      ? findItineraryExpense(budgetExpenses, existingItem, budgetExpenseLinks)
      : undefined;
    const localItem: ItineraryItem = {
      id: existingItem?.id ?? `itinerary-${trip.id}-${Date.now()}`,
      stopId: existingItem?.stopId ?? day.stopId ?? getStopForDay(day)?.id,
      time: itemForm.time,
      name: itemForm.name.trim(),
      type: itemForm.type,
      location: itemForm.location.trim(),
      locationRef: itemForm.locationRef ?? undefined,
      estimatedCost: cost,
      notes: itemForm.notes.trim(),
    };
    const sectionItems = day[itemModal.timeOfDay];
    const orderIndex =
      itemModal.mode === 'edit' && itemModal.itemId
        ? Math.max(
            sectionItems.findIndex((item) => item.id === itemModal.itemId),
            0,
          )
        : sectionItems.length;

    const applySavedItem = (savedItem: ItineraryItem) => {
      const nextDays = itineraryData.map((currentDay) => {
        if (currentDay.dayNumber !== itemModal.dayNumber) return currentDay;
        const currentItems = currentDay[itemModal.timeOfDay];
        const nextItems =
          itemModal.mode === 'edit' && itemModal.itemId
            ? currentItems.map((item) => (item.id === itemModal.itemId ? savedItem : item))
            : [...currentItems, savedItem];

        return {
          ...currentDay,
          [itemModal.timeOfDay]: nextItems,
        };
      });
      updateLocalItineraryData(nextDays);
      return nextDays.find((currentDay) => currentDay.dayNumber === itemModal.dayNumber) ?? day;
    };

    setIsSavingItem(true);

    try {
      const userId = await getAuthenticatedUserId();
      let savedItem = localItem;

      if (userId && itinerarySource === 'supabase') {
        savedItem = await saveItineraryItemToSupabase(
          localItem,
          day,
          itemModal.timeOfDay,
          orderIndex,
          itemModal.mode,
        );
      } else if (!userId) {
        setItineraryError('Saved locally. Sign-in is not connected yet.');
      }

      const savedDay = applySavedItem(savedItem);
      await saveItineraryBudgetExpense(
        savedItem,
        savedDay,
        itemForm.budgetCategory,
        existingExpense,
      );
      closeItemModal();
    } catch {
      const savedDay = applySavedItem(localItem);
      setItinerarySource('fallback');
      setItineraryError('Supabase itinerary save failed. Saved the item locally instead.');
      await saveItineraryBudgetExpense(
        localItem,
        savedDay,
        itemForm.budgetCategory,
        existingExpense,
      );
      closeItemModal();
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!trip) return;

    const nextRemovedItems = new Set([...removedItems, itemId]);
    setRemovedItems(nextRemovedItems);
    persistRemovedItems(trip.id, nextRemovedItems);

    const itemSection = getDaySection(itineraryData, itemId);
    const linkedExpense = itemSection
      ? findItineraryExpense(budgetExpenses, itemSection.item, budgetExpenseLinks)
      : undefined;
    if (linkedExpense) {
      updateLocalBudgetExpenses(
        budgetExpenses.filter((expense) => expense.id !== linkedExpense.id),
      );
      const nextLinks = { ...budgetExpenseLinks };
      delete nextLinks[itemId];
      updateBudgetExpenseLinks(nextLinks);
    }

    if (itinerarySource !== 'supabase') return;

    try {
      await itineraryService.deleteItineraryItem(itemId);
      if (linkedExpense) {
        await budgetService.deleteBudgetExpense(linkedExpense.id);
      }
      setItineraryError(null);
    } catch {
      setItinerarySource('fallback');
      setItineraryError('Supabase itinerary delete failed. Removed the item locally instead.');
    }
  };

  const handleAddSavedPlace = async (place: Place) => {
    if (!trip) return;

    const targetDay =
      itineraryData.find((day) => day.stopId && day.stopId === place.stopId) ?? itineraryData[0];
    if (!targetDay) return;

    const timeOfDay = getPlaceItineraryTimeOfDay(place);
    const sectionItems = targetDay[timeOfDay];
    const localItem: ItineraryItem = {
      id: `itinerary-${trip.id}-${Date.now()}`,
      stopId: place.stopId ?? targetDay.stopId ?? getStopForDay(targetDay)?.id,
      time: '',
      name: place.locationRef?.displayName || place.name,
      type: getPlaceItineraryType(place),
      location: place.locationRef?.formattedAddress ?? place.location,
      locationRef: place.locationRef,
      estimatedCost: 0,
      notes: place.description || place.reviewSnippet || 'Added from saved places.',
    };

    const applyItem = (item: ItineraryItem) => {
      updateLocalItineraryData(
        itineraryData.map((day) =>
          day.dayNumber === targetDay.dayNumber
            ? { ...day, [timeOfDay]: [...day[timeOfDay], item] }
            : day,
        ),
      );
    };

    try {
      const userId = await getAuthenticatedUserId();
      if (userId && itinerarySource === 'supabase') {
        const savedItem = await saveItineraryItemToSupabase(
          localItem,
          targetDay,
          timeOfDay,
          sectionItems.length,
          'add',
        );
        applyItem(savedItem);
      } else {
        applyItem(localItem);
        setItineraryError('Saved locally. Sign-in is not connected yet.');
      }
      setShowSavedPlacesModal(false);
    } catch {
      applyItem(localItem);
      setItinerarySource('fallback');
      setItineraryError('Supabase itinerary save failed. Saved the item locally instead.');
      setShowSavedPlacesModal(false);
    }
  };

  if (itineraryData.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-semibold text-app-text-strong sm:text-[1.75rem]">
            Itinerary
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">Plan your day-by-day schedule</p>
        </div>
        {(serviceTripError || itineraryError) && (
          <div className="rounded-xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
            {itineraryError ||
              'Supabase trip data could not be loaded. Showing local itinerary instead.'}
          </div>
        )}
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="No itinerary yet"
          description="Start building your day-by-day itinerary by adding places and activities."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-app-text-strong sm:text-[1.75rem]">
            Itinerary
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">
            {itineraryData.length} day{itineraryData.length !== 1 ? 's' : ''} for{' '}
            {trip ? getTripDisplayName(trip) : 'your trip'}
          </p>
        </div>

        {availableSavedPlaces.length > 0 && (
          <Button variant="primary" size="md" onClick={() => setShowSavedPlacesModal(true)}>
            <Bookmark className="mr-2 h-4 w-4" />
            Add from Saved Places
          </Button>
        )}
      </div>

      {(serviceTripError || itineraryError) && (
        <div className="rounded-xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          {itineraryError ||
            'Supabase trip data could not be loaded. Showing local itinerary instead.'}
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        {itineraryData.length >= 4 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            {itineraryData.map((day) => (
              <a
                key={day.dayNumber}
                href={`#day-${day.dayNumber}`}
                className="whitespace-nowrap rounded-full bg-app-surface-muted px-3 py-1.5 text-xs font-medium text-app-text-muted transition-colors hover:bg-neutral-200 hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
              >
                Day {day.dayNumber}
              </a>
            ))}
          </div>
        )}

        {/* Day-by-Day Layout */}
        <div className="space-y-10">
          {itineraryData.map((day, index) => {
            const stop = getStopForDay(day);
            const previousStop = index > 0 ? getStopForDay(itineraryData[index - 1]) : undefined;
            const showTransition = isMultiStop && stop && stop.id !== previousStop?.id;
            const dayItems = [...day.morning, ...day.afternoon, ...day.evening];
            const isTravelDay = dayItems.some(
              (item) => item.type === 'transport' || item.type === 'flight',
            );

            return (
              <div
                key={day.dayNumber}
                id={`day-${day.dayNumber}`}
                className="scroll-mt-20 space-y-4"
              >
                {showTransition && (
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-app-border-muted" />
                    <div className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-sm font-medium text-app-text shadow-card">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      {stop.name}
                    </div>
                    <div className="h-px flex-1 bg-app-border-muted" />
                  </div>
                )}
                <DaySection
                  day={day}
                  stop={stop}
                  showStopLabel={isMultiStop}
                  isTravelDay={isTravelDay}
                  itemsMap={itemsMap}
                  onAddItem={openAddItemModal}
                  onEditItem={openEditItemModal}
                  onRemoveItem={handleRemoveItem}
                />
              </div>
            );
          })}
        </div>
      </div>

      <ItineraryItemModal
        isOpen={Boolean(itemModal)}
        mode={itemModal?.mode ?? 'add'}
        form={itemForm}
        errors={itemFormErrors}
        budgetCategories={budgetCategories}
        isSaving={isSavingItem}
        onClose={closeItemModal}
        onChange={handleItemFormChange}
        onLocationChange={handleItemLocationChange}
        onSubmit={handleSaveItem}
      />

      <SavedPlacesModal
        isOpen={showSavedPlacesModal}
        places={availableSavedPlaces}
        onClose={() => setShowSavedPlacesModal(false)}
        onAddPlace={handleAddSavedPlace}
      />
    </div>
  );
};

export default Itinerary;
