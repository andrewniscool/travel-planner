import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MapPin, Calendar, Bookmark, Plus, Plane, Building2, StickyNote, CheckSquare, Pencil, Trash2, Wallet, ArrowRight, AlertCircle, BedDouble } from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getBudgetByTripId } from '../data/budget';
import { getItineraryByTripId } from '../data/itinerary';
import { getPlacesByTripId } from '../data/places';
import { getHotelsByTripId } from '../data/hotels';
import { getNotesByTripId, getChecklistByTripId } from '../data/notes';
import { getPrimaryStop, getTripDisplayName, isMultiStopTrip } from '../data/trips';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  budgetService,
  getAuthenticatedUserId,
  itineraryService,
  locationRefService,
  lodgingService,
  notesService,
  savedPlaceService,
  transportService,
} from '../services/travelDataService';
import {
  getPersistedLocationRefId,
  getPlaceItineraryTimeOfDay,
  getPlaceItineraryType,
  mapLocationRefToHotel,
} from '../services/locationDisplayMappers';
import {
  mapLocationRefRowToLocationRef,
  mapLodgingOptionRowToHotel,
  mapSavedPlaceRowToPlace,
  mapTransportSegmentRowToTransportSegment,
} from '../services/tripMappers';
import { loadTripScopedValue, persistTripScopedValue } from '../utils/tripStorage';
import { formatBudgetAmount, getBudgetCategoryKey } from '../utils/budget';
import DaySection from '../components/itinerary/DaySection';
import ItineraryItemModal, {
  type ItineraryFormErrors,
  type ItineraryItemFormState,
  type ItineraryModalMode,
} from '../components/itinerary/ItineraryItemModal';
import SavedPlacesModal from '../components/itinerary/SavedPlacesModal';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import PlanBookingModal, { type PlanStayDraft, type PlanTransportDraft } from '../components/plan/PlanBookingModal';
import LocalTransportRow from '../components/plan/LocalTransportRow';
import TransportTransitionCard from '../components/plan/TransportTransitionCard';
import TravelSummary from '../components/plan/TravelSummary';
import { calculateDuration, makeManualLocationRef } from '../utils/transportSegments';
import {
  getMissingStopConnections,
  isMajorTransport,
  sortPlanTransport,
} from '../utils/planTransport';
import { buildPlanTimelineEntries, groupPlanTimelineByDate } from '../utils/planTimeline';
import type {
  BudgetExpense,
  ItineraryDay,
  ItineraryItem,
  TimeOfDay,
  Place,
  LocationRef,
  Hotel,
  Note,
  ChecklistItem,
  TransportSegment,
  Trip,
} from '../types';
import type { ItineraryItemInsert, ItineraryItemUpdate } from '../services/supabaseTypes';

const LOCAL_REMOVED_ITINERARY_ITEMS_KEY = 'travel-builder:removed-itinerary-items';
const LOCAL_ITINERARY_DAYS_KEY = 'travel-builder:itinerary-days';
const LOCAL_BUDGET_EXPENSES_KEY = 'travel-builder:budget-expenses';
const LOCAL_ITINERARY_BUDGET_LINKS_KEY = 'travel-builder:itinerary-budget-expense-links';
const LOCAL_TRAVEL_SEGMENTS_KEY = 'travel-builder:travel-segments';
const LOCAL_SELECTED_HOTELS_KEY = 'travel-builder:selected-hotels';
const LOCAL_NOTES_KEY = 'travel-builder:notes';
const LOCAL_CHECKLIST_KEY = 'travel-builder:checklist';
const LOCAL_PLAN_HOTELS_KEY = 'travel-builder:plan-hotels';
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

const emptyTransportDraft = (): PlanTransportDraft => ({
  mode: 'flight', role: 'arrival', provider: '', from: null, to: null,
  departure: '', arrival: '', price: '', confirmationCode: '', fromStopId: '', toStopId: '',
  bookingUrl: '', notes: '', isPrimary: false,
});

const emptyStayDraft = (): PlanStayDraft => ({
  location: null, stopId: '', checkIn: '', checkOut: '', pricePerNight: '', totalCost: '',
  confirmationCode: '', bookingUrl: '', notes: '',
});

interface PlanPulseRailProps {
  tripId: string;
  currency?: Trip['budgetCurrency'];
  allocated: number;
  planned: number;
  transportCount: number;
  stayCount: number;
  missingConnections: number;
  unscheduledCount: number;
  taskCount: number;
  completedTasks: number;
}

const PlanPulseRail: React.FC<PlanPulseRailProps> = ({
  tripId,
  currency,
  allocated,
  planned,
  transportCount,
  stayCount,
  missingConnections,
  unscheduledCount,
  taskCount,
  completedTasks,
}) => {
  const budgetPercent = allocated > 0 ? (planned / allocated) * 100 : 0;
  const progressColor = budgetPercent >= 100 ? 'error' : budgetPercent >= 80 ? 'warning' : 'primary';

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <Card hover={false} className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Wallet className="h-4.5 w-4.5" /></span>
            <div><p className="text-xs text-app-text-muted">Trip pulse</p><h2 className="font-semibold text-app-text-strong">Budget</h2></div>
          </div>
          <Link to={`/trip/${tripId}/budget`} className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-primary-700" aria-label="Open budget"><ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-5">
          <p className="text-2xl font-semibold text-app-text-strong">{formatBudgetAmount(planned, currency)}</p>
          <p className="mt-0.5 text-xs text-app-text-muted">planned of {formatBudgetAmount(allocated, currency)}</p>
          <ProgressBar className="mt-3" value={budgetPercent} size="sm" color={progressColor} />
          <div className="mt-2 flex justify-between text-xs text-app-text-subtle"><span>{Math.round(budgetPercent)}% planned</span><span>{formatBudgetAmount(Math.max(allocated - planned, 0), currency)} left</span></div>
        </div>
      </Card>

      <Card hover={false} className="p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold text-app-text-strong">Bookings</h2><Link to={`/trip/${tripId}/bookings`} className="text-xs font-medium text-primary-700 hover:text-primary-800">View all</Link></div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-app-surface-muted p-3"><Plane className="h-4 w-4 text-accent-700" /><p className="mt-2 text-lg font-semibold text-app-text-strong">{transportCount}</p><p className="text-xs text-app-text-muted">travel legs</p></div>
          <div className="rounded-xl bg-app-surface-muted p-3"><BedDouble className="h-4 w-4 text-primary-700" /><p className="mt-2 text-lg font-semibold text-app-text-strong">{stayCount}</p><p className="text-xs text-app-text-muted">stays</p></div>
        </div>
      </Card>

      <Card hover={false} className="p-5">
        <h2 className="font-semibold text-app-text-strong">Still to sort</h2>
        <div className="mt-4 space-y-3 text-sm">
          <a href="#unscheduled" className="flex items-center justify-between gap-3 rounded-lg text-app-text-muted hover:text-app-text"><span>Unscheduled ideas</span><span className="rounded-full bg-app-surface-muted px-2 py-0.5 text-xs font-semibold text-app-text">{unscheduledCount}</span></a>
          <div className="flex items-center justify-between gap-3"><span className="text-app-text-muted">Tasks completed</span><span className="text-xs font-semibold text-app-text">{completedTasks}/{taskCount}</span></div>
          {missingConnections > 0 ? <div className="flex items-start gap-2 rounded-xl border border-warning-200 bg-warning-50 p-3 text-xs text-warning-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{missingConnections} route connection{missingConnections === 1 ? '' : 's'} still need transportation.</span></div> : <div className="flex items-center gap-2 text-xs text-success-700"><CheckSquare className="h-4 w-4" />All route connections covered</div>}
        </div>
      </Card>
    </aside>
  );
};

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

const dedupeHotels = (hotels: Hotel[]) => {
  const byIdentity = new Map<string, Hotel>();
  hotels.forEach((hotel) => {
    const identity = hotel.locationRef?.googlePlaceId || hotel.id;
    byIdentity.set(identity, { ...byIdentity.get(identity), ...hotel });
  });
  return [...byIdentity.values()];
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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const initialItemFormRef = useRef<ItineraryItemFormState>(emptyItineraryForm());
  const [itemFormErrors, setItemFormErrors] = useState<ItineraryFormErrors>({});
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [budgetExpenses, setBudgetExpenses] = useState<BudgetExpense[]>(() =>
    trip ? loadStoredExpenses(trip.id) : [],
  );
  const [budgetExpenseLinks, setBudgetExpenseLinks] = useState<Record<string, string>>(() =>
    trip ? loadItineraryBudgetLinks(trip.id) : {},
  );
  const [planTransport, setPlanTransport] = useState<TransportSegment[]>([]);
  const [planHotels, setPlanHotels] = useState<Hotel[]>([]);
  const [planNotes, setPlanNotes] = useState<Note[]>([]);
  const [planChecklist, setPlanChecklist] = useState<ChecklistItem[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [quickEntryKind, setQuickEntryKind] = useState<'note' | 'task' | null>(null);
  const [quickEntryTitle, setQuickEntryTitle] = useState('');
  const [quickEntryBody, setQuickEntryBody] = useState('');
  const [isSavingQuickEntry, setIsSavingQuickEntry] = useState(false);
  const [editingQuickEntryId, setEditingQuickEntryId] = useState<string | null>(null);
  const [bookingKind, setBookingKind] = useState<'transport' | 'stay' | null>(null);
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);
  const [editingStayId, setEditingStayId] = useState<string | null>(null);
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [transportDraft, setTransportDraft] = useState<PlanTransportDraft>(emptyTransportDraft);
  const [stayDraft, setStayDraft] = useState<PlanStayDraft>(emptyStayDraft);

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

  useEffect(() => {
    if (!trip) return;
    const currentTrip = trip;
    let cancelled = false;
    const fallbackSegments = loadTripScopedValue(
      LOCAL_TRAVEL_SEGMENTS_KEY,
      trip.id,
      trip.transportSegments,
    );
    const fallbackHotels = dedupeHotels([
      ...getHotelsByTripId(trip.id),
      ...loadTripScopedValue<Hotel[]>(LOCAL_PLAN_HOTELS_KEY, trip.id, []),
    ]);
    const selectedHotelIds = new Set(
      loadTripScopedValue(
        LOCAL_SELECTED_HOTELS_KEY,
        trip.id,
        fallbackHotels.filter((hotel) => hotel.isSelected).map((hotel) => hotel.id),
      ),
    );
    const fallbackNotes = loadTripScopedValue(
      LOCAL_NOTES_KEY,
      trip.id,
      getNotesByTripId(trip.id),
    );
    const fallbackChecklist = loadTripScopedValue(
      LOCAL_CHECKLIST_KEY,
      trip.id,
      getChecklistByTripId(trip.id),
    );

    setPlanTransport(fallbackSegments);
    setPlanHotels(fallbackHotels.filter((hotel) => selectedHotelIds.has(hotel.id)));
    setPlanNotes(fallbackNotes);
    setPlanChecklist(fallbackChecklist);

    async function loadSupportingPlanData() {
      if (tripSource !== 'supabase') return;
      try {
        const userId = await getAuthenticatedUserId();
        if (!userId) return;
        const [transportRows, lodgingRows, notes, checklist] = await Promise.all([
          transportService.listTransportSegments(currentTrip.id),
          lodgingService.listLodgingOptions(currentTrip.id),
          notesService.listNotes(currentTrip.id),
          notesService.listChecklistItems(currentTrip.id),
        ]);
        if (cancelled) return;
        setPlanTransport(
          transportRows.map((row) =>
            mapTransportSegmentRowToTransportSegment(row, [], fallbackSegments),
          ),
        );
        setPlanHotels(
          lodgingRows
            .filter((row) => row.is_selected)
            .map((row) => mapLodgingOptionRowToHotel(row, currentTrip.id)),
        );
        setPlanNotes(notes);
        setPlanChecklist(checklist);
      } catch {
        if (!cancelled) {
          setItineraryError('Some Plan items could not be loaded. Showing locally saved data.');
        }
      }
    }

    void loadSupportingPlanData();
    return () => {
      cancelled = true;
    };
  }, [trip, tripSource]);

  const getStopForDay = useCallback(
    (day: ItineraryDay) => orderedStops.find((stop) => stop.id === day.stopId) ?? primaryStop,
    [orderedStops, primaryStop],
  );

  const openTypedItem = useCallback((type: ItineraryItem['type']) => {
    const firstDay = itineraryData[0];
    if (!firstDay) return;
    setShowAddMenu(false);
    if (type === 'flight' || type === 'transport') {
      setEditingTransportId(null);
      setEditingStayId(null);
      setTransportDraft({ ...emptyTransportDraft(), mode: type === 'flight' ? 'flight' : 'car', departure: `${firstDay.date}T09:00`, arrival: `${firstDay.date}T11:00`, toStopId: firstDay.stopId ?? orderedStops[0]?.id ?? '' });
      setBookingKind('transport');
      return;
    }
    if (type === 'hotel') {
      const stop = orderedStops.find((candidate) => candidate.id === firstDay.stopId) ?? orderedStops[0];
      setEditingStayId(null);
      setStayDraft({ ...emptyStayDraft(), stopId: stop?.id ?? '', checkIn: stop?.startDate ?? firstDay.date, checkOut: stop?.endDate ?? '' });
      setBookingKind('stay');
      return;
    }
    const initialForm = { ...emptyItineraryForm(), type };
    setItemModal({ mode: 'add', dayNumber: firstDay.dayNumber, timeOfDay: 'morning' });
    setItemForm(initialForm);
    initialItemFormRef.current = initialForm;
    setItemFormErrors({});
  }, [itineraryData, orderedStops]);

  const closeBookingModal = () => {
    if (isSavingBooking) return;
    setBookingKind(null);
    setEditingTransportId(null);
    setEditingStayId(null);
  };

  const openTransportConnection = (fromStopId: string, toStopId: string) => {
    const fromStop = orderedStops.find((stop) => stop.id === fromStopId);
    const toStop = orderedStops.find((stop) => stop.id === toStopId);
    setEditingTransportId(null);
    setEditingStayId(null);
    setTransportDraft({
      mode: 'train', role: 'between-stops', provider: '',
      from: fromStop?.locationRef ?? (fromStop ? makeManualLocationRef(fromStop.name) : null),
      to: toStop?.locationRef ?? (toStop ? makeManualLocationRef(toStop.name) : null),
      departure: fromStop?.endDate ? `${fromStop.endDate}T09:00` : '',
      arrival: toStop?.startDate ? `${toStop.startDate}T11:00` : '',
      price: '', confirmationCode: '', fromStopId, toStopId,
      bookingUrl: '', notes: '', isPrimary: true,
    });
    setBookingKind('transport');
  };

  const editPlanTransport = (segment: TransportSegment) => {
    setEditingTransportId(segment.id);
    setEditingStayId(null);
    setTransportDraft({
      mode: segment.mode, role: segment.role || 'between-stops', provider: segment.provider || '',
      from: segment.fromLocation || makeManualLocationRef(segment.departureLocation),
      to: segment.toLocation || makeManualLocationRef(segment.arrivalLocation),
      departure: segment.departureDateTime?.slice(0, 16) || '',
      arrival: segment.arrivalDateTime?.slice(0, 16) || '',
      price: typeof segment.price === 'number' ? String(segment.price) : '',
      confirmationCode: segment.confirmationCode || '',
      fromStopId: segment.fromStopId || '', toStopId: segment.toStopId || '',
      bookingUrl: segment.bookingUrl || '', notes: segment.notes || '', isPrimary: Boolean(segment.isPrimary),
    });
    setBookingKind('transport');
  };

  const deletePlanTransport = async (segment: TransportSegment) => {
    if (!trip || !window.confirm(`Delete travel from ${segment.departureLocation} to ${segment.arrivalLocation}?`)) return;
    const next = planTransport.filter((current) => current.id !== segment.id);
    setPlanTransport(next);
    persistTripScopedValue(LOCAL_TRAVEL_SEGMENTS_KEY, trip.id, next);
    if (tripSource === 'supabase' && /^[0-9a-f-]{36}$/i.test(segment.id)) {
      try { await transportService.deleteTransportSegment(segment.id); } catch { setItineraryError('Transportation removed locally because the online delete failed.'); }
    }
  };

  const editPlanStay = (hotel: Hotel) => {
    setEditingStayId(hotel.id);
    setEditingTransportId(null);
    setStayDraft({
      location: hotel.locationRef || makeManualLocationRef(hotel.name),
      stopId: hotel.stopId || '',
      checkIn: hotel.checkIn || '',
      checkOut: hotel.checkOut || '',
      pricePerNight: hotel.pricePerNight > 0 ? String(hotel.pricePerNight) : '',
      totalCost: hotel.totalCost > 0 ? String(hotel.totalCost) : '',
      confirmationCode: hotel.confirmationCode || '',
      bookingUrl: hotel.bookingUrl || '',
      notes: hotel.description || '',
    });
    setBookingKind('stay');
  };

  const deletePlanStay = async (hotel: Hotel) => {
    if (!trip || !window.confirm(`Remove ${hotel.name} from this plan?`)) return;
    const next = planHotels.filter((current) => current.id !== hotel.id);
    setPlanHotels(next);
    persistTripScopedValue(LOCAL_PLAN_HOTELS_KEY, trip.id, next);
    persistTripScopedValue(LOCAL_SELECTED_HOTELS_KEY, trip.id, next.map((current) => current.id));
    if (tripSource === 'supabase') {
      try {
        await lodgingService.upsertHotelSelection(trip.id, hotel, false);
      } catch {
        setItineraryError('Stay removed locally because the online update failed.');
      }
    }
  };

  const saveBooking = async () => {
    if (!trip || !bookingKind) return;
    setIsSavingBooking(true);
    try {
      if (bookingKind === 'transport') {
        if (!transportDraft.from || !transportDraft.to || !transportDraft.departure || !transportDraft.arrival) {
          setItineraryError('Add the route, departure, and arrival before saving transportation.');
          return;
        }
        let from = transportDraft.from;
        let to = transportDraft.to;
        const userId = await getAuthenticatedUserId();
        if (userId) {
          if (from.googlePlaceId) from = mapLocationRefRowToLocationRef(await locationRefService.upsertGoogleLocationRef(userId, from));
          if (to.googlePlaceId) to = mapLocationRefRowToLocationRef(await locationRefService.upsertGoogleLocationRef(userId, to));
        }
        const segment: TransportSegment = {
          id: editingTransportId || `transport-${trip.id}-${Date.now()}`, tripId: trip.id, mode: transportDraft.mode,
          role: transportDraft.role, fromStopId: transportDraft.fromStopId || undefined, toStopId: transportDraft.toStopId || undefined,
          provider: transportDraft.provider.trim() || undefined, fromLocation: from, toLocation: to,
          departureLocation: from.formattedAddress || from.name, arrivalLocation: to.formattedAddress || to.name,
          departureDateTime: transportDraft.departure, arrivalDateTime: transportDraft.arrival,
          duration: calculateDuration(transportDraft.departure, transportDraft.arrival),
          price: transportDraft.price ? Number(transportDraft.price) : undefined,
          currency: trip.budgetCurrency || 'USD', confirmationCode: transportDraft.confirmationCode.trim() || undefined,
          bookingUrl: transportDraft.bookingUrl.trim() || undefined,
          notes: transportDraft.notes.trim() || undefined,
          isPrimary: transportDraft.isPrimary,
        };
        const saved = userId && tripSource === 'supabase'
          ? mapTransportSegmentRowToTransportSegment(editingTransportId ? await transportService.updateTravelSegment(segment) : await transportService.createTravelSegment(trip.id, segment), [], [segment])
          : segment;
        const next = editingTransportId
          ? planTransport.map((current) => current.id === editingTransportId ? saved : current)
          : [...planTransport, saved];
        setPlanTransport(next);
        persistTripScopedValue(LOCAL_TRAVEL_SEGMENTS_KEY, trip.id, next);
      } else {
        if (!stayDraft.location || !stayDraft.stopId || !stayDraft.checkIn || !stayDraft.checkOut) {
          setItineraryError('Choose an accommodation, trip stop, check-in, and check-out before saving.');
          return;
        }
        if (stayDraft.checkOut <= stayDraft.checkIn) {
          setItineraryError('Check-out must be after check-in.');
          return;
        }
        let location = stayDraft.location;
        const userId = await getAuthenticatedUserId();
        if (userId && location.googlePlaceId) location = mapLocationRefRowToLocationRef(await locationRefService.upsertGoogleLocationRef(userId, location));
        const baseHotel = mapLocationRefToHotel(trip.id, stayDraft.stopId, location);
        const existingHotel = editingStayId
          ? planHotels.find((current) => current.id === editingStayId)
          : undefined;
        const hotel: Hotel = {
          ...baseHotel,
          ...existingHotel,
          id: existingHotel?.id ?? baseHotel.id,
          stopId: stayDraft.stopId,
          locationRef: location,
          name: location.displayName || location.name,
          checkIn: stayDraft.checkIn,
          checkOut: stayDraft.checkOut,
          pricePerNight: stayDraft.pricePerNight ? Number(stayDraft.pricePerNight) : 0,
          totalCost: stayDraft.totalCost ? Number(stayDraft.totalCost) : 0,
          confirmationCode: stayDraft.confirmationCode.trim() || undefined,
          bookingUrl: stayDraft.bookingUrl.trim() || undefined,
          description: stayDraft.notes.trim(),
          isSelected: true,
        };
        if (userId && tripSource === 'supabase') await lodgingService.upsertHotelSelection(trip.id, hotel, true);
        const next = [...planHotels.filter((current) => current.id !== hotel.id), hotel];
        setPlanHotels(next);
        persistTripScopedValue(LOCAL_PLAN_HOTELS_KEY, trip.id, next);
        persistTripScopedValue(LOCAL_SELECTED_HOTELS_KEY, trip.id, next.map((current) => current.id));
      }
      setBookingKind(null);
      setEditingTransportId(null);
      setEditingStayId(null);
      setItineraryError(null);
    } catch {
      setItineraryError('The booking could not be saved online. Try again.');
    } finally {
      setIsSavingBooking(false);
    }
  };

  const saveQuickEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trip || !quickEntryKind || !quickEntryTitle.trim()) return;
    setIsSavingQuickEntry(true);

    if (quickEntryKind === 'note') {
      const existingNote = editingQuickEntryId
        ? planNotes.find((note) => note.id === editingQuickEntryId)
        : undefined;
      const note: Note = {
        id: existingNote?.id ?? `note-${trip.id}-${Date.now()}`,
        tripId: trip.id,
        title: quickEntryTitle.trim(),
        content: quickEntryBody.trim(),
        createdAt: existingNote?.createdAt ?? new Date().toISOString(),
      };
      try {
        const saved = tripSource === 'supabase'
          ? existingNote ? await notesService.updateNote(note) : await notesService.createNote(note)
          : note;
        const next = existingNote
          ? planNotes.map((current) => current.id === existingNote.id ? saved : current)
          : [saved, ...planNotes];
        setPlanNotes(next);
        persistTripScopedValue(LOCAL_NOTES_KEY, trip.id, next);
      } catch {
        const next = existingNote
          ? planNotes.map((current) => current.id === existingNote.id ? note : current)
          : [note, ...planNotes];
        setPlanNotes(next);
        persistTripScopedValue(LOCAL_NOTES_KEY, trip.id, next);
        setItineraryError('Note saved locally because the online save failed.');
      }
    } else {
      const task: ChecklistItem = {
        id: `check-${trip.id}-${Date.now()}`,
        tripId: trip.id,
        text: quickEntryTitle.trim(),
        checked: false,
        category: 'reminders',
      };
      try {
        const saved = tripSource === 'supabase'
          ? await notesService.createChecklistItem(task, planChecklist.length)
          : task;
        const next = [...planChecklist, saved];
        setPlanChecklist(next);
        persistTripScopedValue(LOCAL_CHECKLIST_KEY, trip.id, next);
      } catch {
        const next = [...planChecklist, task];
        setPlanChecklist(next);
        persistTripScopedValue(LOCAL_CHECKLIST_KEY, trip.id, next);
        setItineraryError('Task saved locally because the online save failed.');
      }
    }

    setQuickEntryKind(null);
    setEditingQuickEntryId(null);
    setQuickEntryTitle('');
    setQuickEntryBody('');
    setIsSavingQuickEntry(false);
  };

  const togglePlanTask = async (item: ChecklistItem) => {
    if (!trip) return;
    const updated = { ...item, checked: !item.checked };
    const next = planChecklist.map((current) => current.id === item.id ? updated : current);
    setPlanChecklist(next);
    persistTripScopedValue(LOCAL_CHECKLIST_KEY, trip.id, next);
    if (tripSource === 'supabase' && /^[0-9a-f-]{36}$/i.test(item.id)) {
      try { await notesService.updateChecklistItem(updated); } catch { setItineraryError('Task updated locally because the online save failed.'); }
    }
  };

  const deletePlanTask = async (item: ChecklistItem) => {
    if (!trip) return;
    const next = planChecklist.filter((current) => current.id !== item.id);
    setPlanChecklist(next);
    persistTripScopedValue(LOCAL_CHECKLIST_KEY, trip.id, next);
    if (tripSource === 'supabase' && /^[0-9a-f-]{36}$/i.test(item.id)) {
      try { await notesService.deleteChecklistItem(item.id); } catch { setItineraryError('Task removed locally because the online delete failed.'); }
    }
  };

  const deletePlanNote = async (note: Note) => {
    if (!trip) return;
    const next = planNotes.filter((current) => current.id !== note.id);
    setPlanNotes(next);
    persistTripScopedValue(LOCAL_NOTES_KEY, trip.id, next);
    if (tripSource === 'supabase' && /^[0-9a-f-]{36}$/i.test(note.id)) {
      try { await notesService.deleteNote(note.id); } catch { setItineraryError('Note removed locally because the online delete failed.'); }
    }
  };

  const displayItineraryData = useMemo(() => itineraryData.map((day) => {
    const dayStop = getStopForDay(day);
    const withStop = (items: ItineraryItem[]) => items
      .filter((item) => !removedItems.has(item.id))
      .map((item) => ({ ...item, stopId: item.stopId ?? day.stopId ?? dayStop?.id }));
    return {
      ...day,
      morning: withStop(day.morning),
      afternoon: withStop(day.afternoon),
      evening: withStop(day.evening),
    };
  }), [getStopForDay, itineraryData, removedItems]);

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

  const openAddItemModal = (
    dayNumber: number,
    timeOfDay: TimeOfDay,
    type: ItineraryItem['type'] = 'activity',
  ) => {
    const initialForm = { ...emptyItineraryForm(), type };
    setItemModal({ mode: 'add', dayNumber, timeOfDay });
    setItemForm(initialForm);
    initialItemFormRef.current = initialForm;
    setItemFormErrors({});
  };

  useEffect(() => {
    const addIntent = searchParams.get('add');
    const firstDay = itineraryData[0];
    if (!addIntent || itemModal || quickEntryKind) return;

    if (addIntent === 'note') {
      setQuickEntryKind('note');
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('add');
      setSearchParams(nextParams, { replace: true });
      return;
    }
    if (!firstDay) return;

    const typeByIntent: Partial<Record<string, ItineraryItem['type']>> = {
      transport: 'transport',
      stay: 'hotel',
      place: 'activity',
      restaurant: 'restaurant',
    };
    const type = typeByIntent[addIntent];
    if (!type) return;
    openTypedItem(type);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('add');
    setSearchParams(nextParams, { replace: true });
  }, [itemModal, itineraryData, openTypedItem, quickEntryKind, searchParams, setSearchParams]);

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
    const initialForm: ItineraryItemFormState = {
      time: item.time,
      name: item.name,
      type: item.type,
      location: item.location,
      estimatedCost: item.estimatedCost > 0 ? String(item.estimatedCost) : '',
      notes: item.notes,
      budgetCategory: linkedCategory ? getBudgetCategoryKey(linkedCategory) : '',
      locationRef: item.locationRef ?? null,
    };
    setItemForm(initialForm);
    initialItemFormRef.current = initialForm;
    setItemFormErrors({});
  };

  const closeItemModal = () => {
    setItemModal(null);
    setItemForm(emptyItineraryForm());
    setItemFormErrors({});
  };

  const requestCloseItemModal = () => {
    if (isSavingItem) return;
    const isDirty = JSON.stringify(itemForm) !== JSON.stringify(initialItemFormRef.current);
    if (isDirty && !window.confirm('Discard your unsaved itinerary changes?')) return;
    closeItemModal();
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

  const majorTransport = sortPlanTransport(planTransport.filter(isMajorTransport));
  const missingConnections = getMissingStopConnections(majorTransport, orderedStops);
  const timelineEntries = buildPlanTimelineEntries(
    displayItineraryData,
    planTransport,
    planHotels,
    (stopId) => orderedStops.find((stop) => stop.id === stopId)?.startDate,
  );
  const timelineByDate = groupPlanTimelineByDate(timelineEntries);
  const firstPlanDate = itineraryData[0]?.date || '';
  const lastPlanDate = itineraryData[itineraryData.length - 1]?.date || '';
  const preTripTravel = timelineEntries.filter((entry) => entry.kind === 'transport' && entry.date < firstPlanDate);
  const postTripTravel = timelineEntries.filter((entry) => entry.kind === 'transport' && entry.date > lastPlanDate);
  const unscheduledTransport = planTransport.filter((segment) => !segment.departureDateTime && !segment.arrivalDateTime);
  const allocatedBudget = budgetCategories.reduce((sum, category) => sum + category.allocated, 0);
  const itineraryPlannedCost = displayItineraryData.reduce(
    (total, day) => total + [...day.morning, ...day.afternoon, ...day.evening].reduce((sum, item) => sum + (item.estimatedCost || 0), 0),
    0,
  );
  const plannedCost = itineraryPlannedCost
    + planTransport.reduce((sum, segment) => sum + (segment.price || 0), 0)
    + planHotels.reduce((sum, hotel) => sum + (hotel.totalCost || 0), 0);
  const unscheduledCount = planNotes.length + planChecklist.filter((item) => !item.checked).length + availableSavedPlaces.length + unscheduledTransport.length;
  const completedTaskCount = planChecklist.filter((item) => item.checked).length;

  const renderOutsideTravel = (segment: TransportSegment) => isMajorTransport(segment)
    ? <TransportTransitionCard key={segment.id} segment={segment} onEdit={editPlanTransport} onDelete={(item) => void deletePlanTransport(item)} />
    : <LocalTransportRow key={segment.id} segment={segment} onEdit={editPlanTransport} onDelete={(item) => void deletePlanTransport(item)} />;

  if (itineraryData.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-semibold text-app-text-strong sm:text-[1.75rem]">
            Plan
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">Everything for your trip, in one timeline.</p>
        </div>
        {(serviceTripError || itineraryError) && (
          <div className="rounded-xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
            {itineraryError ||
              'Supabase trip data could not be loaded. Showing local itinerary instead.'}
          </div>
        )}
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="No plan yet"
          description="Add trip dates first, then build your timeline."
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
            Plan
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">
            {itineraryData.length} day{itineraryData.length !== 1 ? 's' : ''} for{' '}
            {trip ? getTripDisplayName(trip) : 'your trip'} · travel, stays, places, and notes
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setShowAddMenu((open) => !open)}>
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>

      {showAddMenu && (
        <Card hover={false} className="p-4">
          <p className="mb-3 text-sm font-semibold text-app-text-strong">What would you like to add?</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => openTypedItem('flight')}><Plane className="mr-2 h-4 w-4" />Flight or transport</Button>
            <Button variant="outline" size="sm" onClick={() => openTypedItem('hotel')}><Building2 className="mr-2 h-4 w-4" />Stay</Button>
            <Button variant="outline" size="sm" onClick={() => openTypedItem('activity')}><MapPin className="mr-2 h-4 w-4" />Activity</Button>
            <Button variant="outline" size="sm" onClick={() => openTypedItem('restaurant')}>Restaurant</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowAddMenu(false); setQuickEntryKind('note'); }}><StickyNote className="mr-2 h-4 w-4" />Note</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowAddMenu(false); setQuickEntryKind('task'); }}><CheckSquare className="mr-2 h-4 w-4" />Task</Button>
          </div>
        </Card>
      )}

      {(serviceTripError || itineraryError) && (
        <div className="rounded-xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          {itineraryError ||
            'Supabase trip data could not be loaded. Showing local itinerary instead.'}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <TravelSummary
            segments={majorTransport}
            missing={missingConnections}
            onAdd={() => openTypedItem('flight')}
          />
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
          {preTripTravel.length > 0 && <section className="space-y-3"><p className="text-xs font-semibold uppercase tracking-eyebrow text-app-text-subtle">Before day one</p>{preTripTravel.map((entry) => entry.kind === 'transport' ? renderOutsideTravel(entry.segment) : null)}</section>}
          {itineraryData.map((day, index) => {
            const stop = getStopForDay(day);
            const previousStop = index > 0 ? getStopForDay(itineraryData[index - 1]) : undefined;
            const nextDayStop = index < itineraryData.length - 1
              ? getStopForDay(itineraryData[index + 1])
              : undefined;
            const startsChapter = index === 0 || (isMultiStop && stop?.id !== previousStop?.id);
            const endsChapter = index === itineraryData.length - 1 || stop?.id !== nextDayStop?.id;
            const nextConfiguredStop = stop
              ? orderedStops[orderedStops.findIndex((candidate) => candidate.id === stop.id) + 1]
              : undefined;
            const entries = timelineByDate.get(day.date) || [];
            const isTravelDay = entries.some(
              (entry) => entry.kind === 'transport' || entry.kind === 'travel-arrival' ||
                (entry.kind === 'itinerary' && (entry.item.type === 'transport' || entry.item.type === 'flight')),
            );
            const hasNextConnection = stop && nextConfiguredStop
              ? majorTransport.some((segment) => segment.fromStopId === stop.id && segment.toStopId === nextConfiguredStop.id)
              : false;

            return (
              <div
                key={day.dayNumber}
                id={`day-${day.dayNumber}`}
                className="scroll-mt-20 space-y-4"
              >
                {startsChapter && stop && <div className="rounded-2xl bg-primary-50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-eyebrow text-primary-700">Now in</p><div className="mt-1 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary-600" /><h2 className="text-xl font-semibold text-app-text-strong">{stop.name}{stop.country ? `, ${stop.country}` : ''}</h2></div><p className="mt-1 text-sm text-app-text-muted">{stop.startDate} – {stop.endDate}</p></div>}
                <DaySection
                  day={day}
                  stop={stop}
                  showStopLabel={isMultiStop}
                  isTravelDay={isTravelDay}
                  currency={trip?.budgetCurrency}
                  entries={entries}
                  onAddItem={openAddItemModal}
                  onEditItem={openEditItemModal}
                  onRemoveItem={handleRemoveItem}
                  onEditTransport={editPlanTransport}
                  onDeleteTransport={(segment) => void deletePlanTransport(segment)}
                  onEditStay={editPlanStay}
                  onDeleteStay={(hotel) => void deletePlanStay(hotel)}
                />
                {endsChapter && nextConfiguredStop && !hasNextConnection && <Card hover={false} className="border-dashed border-warning-300 bg-warning-50/50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-app-text-strong">How are you getting from {stop?.name} to {nextConfiguredStop.name}?</p><p className="mt-1 text-sm text-app-text-muted">Add this connection before continuing the plan in {nextConfiguredStop.name}.</p></div><Button size="sm" variant="outline" onClick={() => openTransportConnection(stop?.id || '', nextConfiguredStop.id)}><Plus className="mr-1.5 h-4 w-4" />Add travel</Button></div></Card>}
              </div>
            );
          })}
          {postTripTravel.length > 0 && <section className="space-y-3"><p className="text-xs font-semibold uppercase tracking-eyebrow text-app-text-subtle">After the final day</p>{postTripTravel.map((entry) => entry.kind === 'transport' ? renderOutsideTravel(entry.segment) : null)}</section>}
        </div>

        <section id="unscheduled" className="scroll-mt-20 space-y-3">
          <div><h2 className="text-lg font-semibold text-app-text-strong">Unscheduled</h2><p className="text-sm text-app-text-muted">Notes, tasks, and saved ideas that do not have a time yet.</p></div>
          {planNotes.length === 0 && planChecklist.length === 0 && availableSavedPlaces.length === 0 && unscheduledTransport.length === 0 ? (
            <Card hover={false} className="border-dashed p-5 text-sm text-app-text-subtle">Nothing waiting to be scheduled.</Card>
          ) : (
            <div className="space-y-2">
              {unscheduledTransport.map(renderOutsideTravel)}
              {planChecklist.map((item) => <Card key={`task-${item.id}`} hover={false} className="flex items-center gap-3 p-3"><button type="button" onClick={() => void togglePlanTask(item)} aria-label={item.checked ? `Mark ${item.text} incomplete` : `Mark ${item.text} complete`}><CheckSquare className={`h-4 w-4 ${item.checked ? 'text-success-600' : 'text-app-text-subtle'}`} /></button><span className={`min-w-0 flex-1 text-sm ${item.checked ? 'text-app-text-subtle line-through' : 'text-app-text'}`}>{item.text}</span><button type="button" onClick={() => void deletePlanTask(item)} className="rounded-lg p-1.5 text-app-text-subtle hover:bg-error-50 hover:text-error-600" aria-label={`Delete ${item.text}`}><Trash2 className="h-3.5 w-3.5" /></button></Card>)}
              {planNotes.map((note) => <Card key={`note-${note.id}`} hover={false} className="p-3"><div className="flex gap-3"><StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-app-text-strong">{note.title}</p>{note.content && <p className="mt-1 text-sm text-app-text-muted">{note.content}</p>}</div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => { setEditingQuickEntryId(note.id); setQuickEntryTitle(note.title); setQuickEntryBody(note.content); setQuickEntryKind('note'); }} className="rounded-lg p-1.5 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label={`Edit ${note.title}`}><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => void deletePlanNote(note)} className="rounded-lg p-1.5 text-app-text-subtle hover:bg-error-50 hover:text-error-600" aria-label={`Delete ${note.title}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div></Card>)}
              {availableSavedPlaces.length > 0 && <Button variant="outline" size="sm" onClick={() => setShowSavedPlacesModal(true)}><Bookmark className="mr-2 h-4 w-4" />Schedule a saved place ({availableSavedPlaces.length})</Button>}
            </div>
          )}
        </section>
        </div>

        {trip && (
          <PlanPulseRail
            tripId={trip.id}
            currency={trip.budgetCurrency}
            allocated={allocatedBudget || trip.budget}
            planned={plannedCost}
            transportCount={planTransport.length}
            stayCount={planHotels.length}
            missingConnections={missingConnections.length}
            unscheduledCount={unscheduledCount}
            taskCount={planChecklist.length}
            completedTasks={completedTaskCount}
          />
        )}
      </div>

      <ItineraryItemModal
        isOpen={Boolean(itemModal)}
        mode={itemModal?.mode ?? 'add'}
        form={itemForm}
        errors={itemFormErrors}
        budgetCategories={budgetCategories}
        isSaving={isSavingItem}
        dayNumber={itemModal?.dayNumber}
        timeOfDay={itemModal?.timeOfDay}
        currency={trip?.budgetCurrency}
        stopNames={Object.fromEntries(orderedStops.map((stop) => [stop.id, stop.name]))}
        onClose={requestCloseItemModal}
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

      <PlanBookingModal
        kind={bookingKind}
        transport={transportDraft}
        stay={stayDraft}
        stops={orderedStops}
        currency={trip?.budgetCurrency}
        saving={isSavingBooking}
        onTransportChange={setTransportDraft}
        onStayChange={setStayDraft}
        onClose={closeBookingModal}
        onSave={() => void saveBooking()}
        editing={Boolean(editingTransportId || editingStayId)}
      />

      <Modal
        isOpen={quickEntryKind !== null}
        onClose={() => { if (!isSavingQuickEntry) { setQuickEntryKind(null); setEditingQuickEntryId(null); setQuickEntryTitle(''); setQuickEntryBody(''); } }}
        title={editingQuickEntryId ? 'Edit note' : quickEntryKind === 'task' ? 'Add task' : 'Add note'}
        description="This will appear under Unscheduled until you place it on the timeline."
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => { setQuickEntryKind(null); setEditingQuickEntryId(null); setQuickEntryTitle(''); setQuickEntryBody(''); }} disabled={isSavingQuickEntry}>Cancel</Button><Button type="submit" form="quick-plan-entry" disabled={isSavingQuickEntry || !quickEntryTitle.trim()}>{isSavingQuickEntry ? 'Saving…' : editingQuickEntryId ? 'Save changes' : 'Add'}</Button></div>}
      >
        <form id="quick-plan-entry" className="space-y-4" onSubmit={saveQuickEntry}>
          <Input label={quickEntryKind === 'task' ? 'Task' : 'Title'} value={quickEntryTitle} onChange={(event) => setQuickEntryTitle(event.target.value)} autoFocus />
          {quickEntryKind === 'note' && <label className="block"><span className="mb-1.5 block text-sm font-medium text-app-text-muted">Details</span><textarea rows={5} value={quickEntryBody} onChange={(event) => setQuickEntryBody(event.target.value)} className="w-full resize-none rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-app-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></label>}
        </form>
      </Modal>
    </div>
  );
};

export default Itinerary;
