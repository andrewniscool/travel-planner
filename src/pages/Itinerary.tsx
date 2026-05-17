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
import { getBudgetByTripId } from '../data/budget';
import { getItineraryByTripId } from '../data/itinerary';
import { getPlacesByTripId } from '../data/places';
import { getPrimaryStop, getTripDisplayName, isMultiStopTrip } from '../data/trips';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  budgetService,
  getAuthenticatedUserId,
  itineraryService,
} from '../services/travelDataService';
import { getSupabaseClient } from '../services/supabaseClient';
import Modal from '../components/ui/Modal';
import type {
  BudgetCategory,
  BudgetExpense,
  ItineraryDay,
  ItineraryItem,
  ItineraryItemType,
  TimeOfDay,
  Place,
  TripStop,
} from '../types';
import type { ItineraryItemInsert, ItineraryItemRow, ItineraryItemUpdate } from '../services/supabaseTypes';

const LOCAL_REMOVED_ITINERARY_ITEMS_KEY = 'travel-builder:removed-itinerary-items';
const LOCAL_ITINERARY_DAYS_KEY = 'travel-builder:itinerary-days';
const LOCAL_BUDGET_EXPENSES_KEY = 'travel-builder:budget-expenses';
const LOCAL_ITINERARY_BUDGET_LINKS_KEY = 'travel-builder:itinerary-budget-expense-links';
const ITINERARY_EXPENSE_PREFIX = 'itinerary-expense';

type ItineraryModalMode = 'add' | 'edit';

interface ItineraryItemFormState {
  time: string;
  name: string;
  type: ItineraryItemType;
  location: string;
  estimatedCost: string;
  notes: string;
  budgetCategory: string;
}

interface ItineraryModalState {
  mode: ItineraryModalMode;
  dayNumber: number;
  timeOfDay: TimeOfDay;
  itemId?: string;
}

type ItineraryFormErrors = Partial<Record<keyof ItineraryItemFormState, string>>;

const itineraryItemTypes: { value: ItineraryItemType; label: string }[] = [
  { value: 'flight', label: 'Flight' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'activity', label: 'Activity' },
  { value: 'free-time', label: 'Free time' },
  { value: 'transport', label: 'Transport' },
];

const emptyItineraryForm = (): ItineraryItemFormState => ({
  time: '',
  name: '',
  type: 'activity',
  location: '',
  estimatedCost: '',
  notes: '',
  budgetCategory: '',
});

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

const loadStoredItineraryDays = (tripId: string): ItineraryDay[] | null => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(LOCAL_ITINERARY_DAYS_KEY) ?? '{}',
    ) as Record<string, ItineraryDay[]>;
    return stored[tripId] ?? null;
  } catch {
    return null;
  }
};

const persistStoredItineraryDays = (tripId: string, days: ItineraryDay[]) => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(LOCAL_ITINERARY_DAYS_KEY) ?? '{}',
    ) as Record<string, ItineraryDay[]>;
    window.localStorage.setItem(
      LOCAL_ITINERARY_DAYS_KEY,
      JSON.stringify({ ...stored, [tripId]: days }),
    );
  } catch {
    window.localStorage.setItem(
      LOCAL_ITINERARY_DAYS_KEY,
      JSON.stringify({ [tripId]: days }),
    );
  }
};

const loadStoredExpenses = (tripId: string): BudgetExpense[] => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(LOCAL_BUDGET_EXPENSES_KEY) ?? '{}',
    ) as Record<string, BudgetExpense[]>;
    return stored[tripId] ?? [];
  } catch {
    return [];
  }
};

const persistStoredExpenses = (tripId: string, expenses: BudgetExpense[]) => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(LOCAL_BUDGET_EXPENSES_KEY) ?? '{}',
    ) as Record<string, BudgetExpense[]>;
    window.localStorage.setItem(
      LOCAL_BUDGET_EXPENSES_KEY,
      JSON.stringify({ ...stored, [tripId]: expenses }),
    );
  } catch {
    window.localStorage.setItem(
      LOCAL_BUDGET_EXPENSES_KEY,
      JSON.stringify({ [tripId]: expenses }),
    );
  }
};

const loadItineraryBudgetLinks = (tripId: string): Record<string, string> => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(LOCAL_ITINERARY_BUDGET_LINKS_KEY) ?? '{}',
    ) as Record<string, Record<string, string>>;
    return stored[tripId] ?? {};
  } catch {
    return {};
  }
};

const persistItineraryBudgetLinks = (
  tripId: string,
  links: Record<string, string>,
) => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(LOCAL_ITINERARY_BUDGET_LINKS_KEY) ?? '{}',
    ) as Record<string, Record<string, string>>;
    window.localStorage.setItem(
      LOCAL_ITINERARY_BUDGET_LINKS_KEY,
      JSON.stringify({ ...stored, [tripId]: links }),
    );
  } catch {
    window.localStorage.setItem(
      LOCAL_ITINERARY_BUDGET_LINKS_KEY,
      JSON.stringify({ [tripId]: links }),
    );
  }
};

const getItineraryExpenseId = (itemId: string) =>
  `${ITINERARY_EXPENSE_PREFIX}-${itemId}`;

const getBudgetCategoryKey = (category: Pick<BudgetCategory, 'name' | 'stopId'>) =>
  `${category.stopId ?? 'trip'}:${category.name}`;

const findItineraryExpense = (
  expenses: BudgetExpense[],
  item: ItineraryItem,
  expenseLinks: Record<string, string>,
) => {
  const linkedExpenseId = expenseLinks[item.id] ?? getItineraryExpenseId(item.id);
  return expenses.find((expense) => expense.id === linkedExpenseId);
};

const mapItineraryRowToItem = (row: ItineraryItemRow): ItineraryItem => ({
  id: row.id,
  stopId: row.stop_id ?? undefined,
  time: row.start_time?.slice(0, 5) ?? '',
  name: row.title,
  type: itineraryItemTypes.some((type) => type.value === row.item_type)
    ? (row.item_type as ItineraryItemType)
    : 'activity',
  location: row.location_text ?? '',
  estimatedCost: row.estimated_cost ?? 0,
  notes: row.notes ?? '',
});

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
  onEdit: (item: ItineraryItem) => void;
  onRemove: (id: string) => void;
}> = ({ item, onEdit, onRemove }) => {
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
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
        >
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
  onAddItem: (dayNumber: number, timeOfDay: TimeOfDay) => void;
  onEditItem: (item: ItineraryItem) => void;
  onRemoveItem: (itemId: string) => void;
}> = ({
  day,
  stop,
  showStopLabel,
  isTravelDay,
  itemsMap,
  onAddItem,
  onEditItem,
  onRemoveItem,
}) => {
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
                      onEdit={onEditItem}
                      onRemove={onRemoveItem}
                    />
                  ))}
                  <button
                    onClick={() => onAddItem(day.dayNumber, timeOfDay)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
                  <p className="text-sm text-neutral-400">No activities planned</p>
                  <button
                    onClick={() => onAddItem(day.dayNumber, timeOfDay)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                  >
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

const ItineraryItemModal: React.FC<{
  isOpen: boolean;
  mode: ItineraryModalMode;
  form: ItineraryItemFormState;
  errors: ItineraryFormErrors;
  budgetCategories: BudgetCategory[];
  isSaving: boolean;
  onClose: () => void;
  onChange: (field: keyof ItineraryItemFormState, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}> = ({
  isOpen,
  mode,
  form,
  errors,
  budgetCategories,
  isSaving,
  onClose,
  onChange,
  onSubmit,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const title = mode === 'add' ? 'Add itinerary item' : 'Edit itinerary item';
  const buttonText = mode === 'add' ? 'Add item' : 'Save changes';

  return (
    <div
      className="fixed inset-0 z-50 bg-white/25 backdrop-blur-[2px] animate-fade-in"
      onClick={onClose}
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-neutral-100 animate-slide-up"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(event) => onChange('time', event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.time && (
                  <p className="text-xs text-error-500 mt-1">{errors.time}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(event) => onChange('type', event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {itineraryItemTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Name
              </label>
              <input
                value={form.name}
                onChange={(event) => onChange('name', event.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.name && (
                <p className="text-xs text-error-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Location
              </label>
              <input
                value={form.location}
                onChange={(event) => onChange('location', event.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.location && (
                <p className="text-xs text-error-500 mt-1">{errors.location}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Estimated cost
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.estimatedCost}
                  onChange={(event) => onChange('estimatedCost', event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.estimatedCost && (
                  <p className="text-xs text-error-500 mt-1">{errors.estimatedCost}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Budget category
                </label>
                <select
                  value={form.budgetCategory}
                  onChange={(event) => onChange('budgetCategory', event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Optional</option>
                  {budgetCategories.map((category) => (
                    <option
                      key={getBudgetCategoryKey(category)}
                      value={getBudgetCategoryKey(category)}
                    >
                      {category.stopId ? `${category.name} (${category.stopId})` : category.name}
                    </option>
                  ))}
                </select>
                {errors.budgetCategory && (
                  <p className="text-xs text-error-500 mt-1">{errors.budgetCategory}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(event) => onChange('notes', event.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : buttonText}
            </button>
          </div>
        </form>
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
  const budgetCategories = useMemo(
    () => (trip ? getBudgetByTripId(trip.id)?.categories ?? [] : []),
    [trip],
  );
  const orderedStops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.order - b.order) : []),
    [trip]
  );
  const primaryStop = trip ? getPrimaryStop(trip) : undefined;
  const isMultiStop = trip ? isMultiStopTrip(trip) : false;

  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const [showSavedPlacesModal, setShowSavedPlacesModal] = useState(false);
  const [itemModal, setItemModal] = useState<ItineraryModalState | null>(null);
  const [itemForm, setItemForm] = useState<ItineraryItemFormState>(
    emptyItineraryForm,
  );
  const [itemFormErrors, setItemFormErrors] = useState<ItineraryFormErrors>({});
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [budgetExpenses, setBudgetExpenses] = useState<BudgetExpense[]>(() =>
    trip ? loadStoredExpenses(trip.id) : [],
  );
  const [budgetExpenseLinks, setBudgetExpenseLinks] = useState<Record<string, string>>(
    () => (trip ? loadItineraryBudgetLinks(trip.id) : {}),
  );

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;
    const storedItineraryData = loadStoredItineraryDays(trip.id);

    setRemovedItems(loadRemovedItems(trip.id));
    setItineraryData(storedItineraryData ?? fallbackItineraryData);
    setBudgetExpenses(loadStoredExpenses(trip.id));
    setBudgetExpenseLinks(loadItineraryBudgetLinks(trip.id));
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

        const expenses = await budgetService.listBudgetExpenses(trip.id);
        if (cancelled) return;
        setBudgetExpenses(expenses);
        persistStoredExpenses(trip.id, expenses);
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
    budgetCategories.find(
      (category) => getBudgetCategoryKey(category) === categoryKey,
    );

  const openAddItemModal = (dayNumber: number, timeOfDay: TimeOfDay) => {
    setItemModal({ mode: 'add', dayNumber, timeOfDay });
    setItemForm(emptyItineraryForm());
    setItemFormErrors({});
  };

  const openEditItemModal = (item: ItineraryItem) => {
    const section = getDaySection(itineraryData, item.id);
    if (!section) return;

    const linkedExpense = findItineraryExpense(
      budgetExpenses,
      item,
      budgetExpenseLinks,
    );
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
    });
    setItemFormErrors({});
  };

  const closeItemModal = () => {
    setItemModal(null);
    setItemForm(emptyItineraryForm());
    setItemFormErrors({});
  };

  const handleItemFormChange = (
    field: keyof ItineraryItemFormState,
    value: string,
  ) => {
    setItemForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setItemFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const validateItemForm = () => {
    const errors: ItineraryFormErrors = {};
    const cost =
      itemForm.estimatedCost.trim() === '' ? 0 : Number(itemForm.estimatedCost);

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

    const payload: ItineraryItemInsert | ItineraryItemUpdate = {
      trip_id: trip.id,
      stop_id: item.stopId ?? day.stopId ?? null,
      title: item.name,
      item_type: item.type,
      date: day.date,
      start_time: item.time || null,
      time_of_day: timeOfDay,
      location_text: item.location || null,
      estimated_cost: item.estimatedCost,
      notes: item.notes || null,
      order_index: orderIndex,
    };

    const query = mode === 'edit' && itemModal?.itemId
      ? getSupabaseClient()
          .from('itinerary_items')
          .update(payload)
          .eq('id', itemModal.itemId)
          .select()
          .single()
      : getSupabaseClient()
          .from('itinerary_items')
          .insert(payload as ItineraryItemInsert)
          .select()
          .single();
    const { data, error } = await query;

    if (error) throw error;
    return mapItineraryRowToItem(data as ItineraryItemRow);
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
      existingExpenseOverride ??
      findItineraryExpense(budgetExpenses, item, budgetExpenseLinks);
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
            setItineraryError('Supabase budget update failed. Saved budget changes locally instead.');
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

    const day = itineraryData.find(
      (currentDay) => currentDay.dayNumber === itemModal.dayNumber,
    );
    if (!day) return;

    const cost =
      itemForm.estimatedCost.trim() === '' ? 0 : Number(itemForm.estimatedCost);
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
      estimatedCost: cost,
      notes: itemForm.notes.trim(),
    };
    const sectionItems = day[itemModal.timeOfDay];
    const orderIndex =
      itemModal.mode === 'edit' && itemModal.itemId
        ? Math.max(sectionItems.findIndex((item) => item.id === itemModal.itemId), 0)
        : sectionItems.length;

    const applySavedItem = (savedItem: ItineraryItem) => {
      const nextDays = itineraryData.map((currentDay) => {
        if (currentDay.dayNumber !== itemModal.dayNumber) return currentDay;
        const currentItems = currentDay[itemModal.timeOfDay];
        const nextItems =
          itemModal.mode === 'edit' && itemModal.itemId
            ? currentItems.map((item) =>
                item.id === itemModal.itemId ? savedItem : item,
              )
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
                onAddItem={openAddItemModal}
                onEditItem={openEditItemModal}
                onRemoveItem={handleRemoveItem}
              />
            </div>
          );
        })}
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
        onSubmit={handleSaveItem}
      />

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
