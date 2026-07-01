import type {
  TransportMode,
  TransportRole,
  TransportSegment,
  BudgetCurrency,
  BudgetCategory,
  ChecklistItem,
  Hotel,
  BudgetExpense,
  ItineraryDay,
  ItineraryItem,
  ItineraryItemType,
  LocationRef,
  Note,
  Place,
  TimeOfDay,
  Trip,
  TripStatus,
  TripStop,
  TripVibe,
} from '../types';
import type {
  BudgetExpenseInsert,
  BudgetExpenseRow,
  BudgetExpenseUpdate,
  BudgetCategoryInsert,
  BudgetCategoryRow,
  BudgetCategoryUpdate,
  ChecklistItemInsert,
  ChecklistItemRow,
  ChecklistItemUpdate,
  LodgingOptionInsert,
  LodgingOptionRow,
  LodgingOptionUpdate,
  LocationRefRow,
  ItineraryItemRow,
  SavedPlaceInsert,
  SavedPlaceRow,
  SavedPlaceUpdate,
  TransportSegmentRow,
  TransportSegmentInsert,
  TripNoteInsert,
  TripNoteRow,
  TripNoteUpdate,
  TripInsert,
  TripRow,
  TripStopInsert,
  TripStopRow,
  TripUpdate,
  TransportSegmentUpdate,
} from './supabaseTypes';
import type {
  ItineraryItemWithLocationRef,
  LodgingOptionWithLocationRef,
  SavedPlaceWithLocationRef,
  TransportSegmentWithLocationRefs,
  TripStopWithLocationRef,
  TripWithRelations,
} from './travelDataService';
import {
  GOOGLE_HOTEL_IMAGE,
  GOOGLE_PLACE_IMAGE,
} from './locationDisplayMappers';

const DEFAULT_TRIP_VIBE: TripVibe = 'Cultural';
const DEFAULT_TRIP_STATUS: TripStatus = 'planning';
const DEFAULT_BUDGET_CURRENCY: BudgetCurrency = 'USD';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getStatusFromDates(startDate?: string, endDate?: string): TripStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (endDate && new Date(`${endDate}T00:00:00`) < today) return 'past';
  if (startDate && new Date(`${startDate}T00:00:00`) > today) return 'upcoming';

  return DEFAULT_TRIP_STATUS;
}

function isTransportMode(mode: string): mode is TransportMode {
  return ['flight', 'train', 'bus', 'car', 'ferry', 'walk', 'other'].includes(
    mode,
  );
}

function isTransportRole(role: string): role is TransportRole {
  return ['arrival', 'departure', 'between-stops', 'local'].includes(role);
}

function isTripVibe(vibe: string): vibe is TripVibe {
  return [
    'Relaxing',
    'Adventure',
    'Food-focused',
    'Romantic',
    'Family',
    'Budget-friendly',
    'Luxury',
    'Cultural',
  ].includes(vibe);
}

function isTripStatus(status: string): status is TripStatus {
  return ['upcoming', 'planning', 'booked', 'past'].includes(status);
}

function isBudgetCurrency(currency: string): currency is BudgetCurrency {
  return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'].includes(currency);
}

function isItineraryItemType(type: string): type is ItineraryItemType {
  return [
    'flight',
    'hotel',
    'restaurant',
    'activity',
    'free-time',
    'transport',
  ].includes(type);
}

function isPlaceCategory(category: string): category is Place['category'] {
  return [
    'Restaurants',
    'Cafes',
    'Museums',
    'Outdoor',
    'Nightlife',
    'Shopping',
    'Tours',
    'Landmarks',
    'Hidden Gems',
  ].includes(category);
}

function isChecklistCategory(
  category: string,
): category is ChecklistItem['category'] {
  return ['packing', 'documents', 'reminders'].includes(category);
}

function getTimeOfDayFromTime(time?: string | null): TimeOfDay {
  if (!time) return 'morning';
  const hour = Number(time.slice(0, 2));
  if (Number.isNaN(hour)) return 'morning';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function normalizeTimeOfDay(
  timeOfDay?: string | null,
  time?: string | null,
): TimeOfDay {
  if (
    timeOfDay === 'morning' ||
    timeOfDay === 'afternoon' ||
    timeOfDay === 'evening'
  ) {
    return timeOfDay;
  }

  return getTimeOfDayFromTime(time);
}

function getPersistedLocationRefId(location?: LocationRef) {
  return location?.id && UUID_PATTERN.test(location.id) ? location.id : null;
}

export function mapLocationRefRowToLocationRef(row: LocationRefRow): LocationRef {
  return {
    id: row.id,
    googlePlaceId: row.google_place_id ?? undefined,
    name: row.display_name ?? row.name,
    displayName: row.display_name ?? undefined,
    formattedAddress: row.formatted_address ?? undefined,
    latitude: row.lat ?? undefined,
    longitude: row.lng ?? undefined,
    placeTypes: row.place_types,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    photoUrls: row.photo_urls,
    websiteUri: row.website_uri ?? undefined,
    nationalPhoneNumber: row.national_phone_number ?? undefined,
    internationalPhoneNumber: row.international_phone_number ?? undefined,
    regularOpeningHours: row.regular_opening_hours,
    priceLevel: row.price_level ?? undefined,
    priceRange: row.price_range ?? undefined,
    googleMapsUri: row.google_maps_uri ?? undefined,
    businessStatus: row.business_status ?? undefined,
    source:
      row.source === 'google' || row.source === 'mock' ? row.source : 'manual',
  };
}

function findPreviousStop(
  row: TripStopRow | TripStopWithLocationRef,
  previousStops: TripStop[],
) {
  return previousStops.find(
    (stop) => stop.id === row.id || stop.order === row.order_index,
  );
}

function getStopLocationRef(row: TripStopRow | TripStopWithLocationRef) {
  if ('location_refs' in row && row.location_refs) {
    return mapLocationRefRowToLocationRef(row.location_refs);
  }

  return undefined;
}

function mapStop(
  row: TripStopRow | TripStopWithLocationRef,
  previousStops: TripStop[],
) {
  const previousStop = findPreviousStop(row, previousStops);
  const locationRef = getStopLocationRef(row) ?? previousStop?.locationRef;

  return {
    id: row.id,
    tripId: row.trip_id,
    name: locationRef?.name ?? row.name,
    country: row.country ?? undefined,
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    order: row.order_index,
    image: row.image ?? previousStop?.image,
    latitude: row.latitude ?? locationRef?.latitude ?? previousStop?.latitude,
    longitude: row.longitude ?? locationRef?.longitude ?? previousStop?.longitude,
    notes: row.notes ?? previousStop?.notes,
    locationRef,
  };
}

function mapTransportSegment(
  row: TransportSegmentRow | TransportSegmentWithLocationRefs,
  stops: TripStopRow[],
  previousSegments: TransportSegment[] = [],
): TransportSegment {
  const fromStop = stops.find((stop) => stop.id === row.from_stop_id);
  const toStop = stops.find((stop) => stop.id === row.to_stop_id);
  const previousSegment = previousSegments.find((segment) => segment.id === row.id);
  const role = row.role && isTransportRole(row.role) ? row.role : undefined;
  const fromLocation =
    'from_location_ref' in row && row.from_location_ref
      ? mapLocationRefRowToLocationRef(row.from_location_ref)
      : previousSegment?.fromLocation;
  const toLocation =
    'to_location_ref' in row && row.to_location_ref
      ? mapLocationRefRowToLocationRef(row.to_location_ref)
      : previousSegment?.toLocation;

  return {
    id: row.id,
    tripId: row.trip_id,
    fromStopId: row.from_stop_id ?? undefined,
    toStopId: row.to_stop_id ?? undefined,
    mode: isTransportMode(row.mode) ? row.mode : 'other',
    role,
    isPrimary: row.is_primary,
    provider: row.provider ?? undefined,
    fromLocation,
    toLocation,
    departureLocation: row.from_text ?? fromLocation?.name ?? fromStop?.name ?? '',
    arrivalLocation: row.to_text ?? toLocation?.name ?? toStop?.name ?? '',
    departureDateTime: row.departure_time ?? undefined,
    arrivalDateTime: row.arrival_time ?? undefined,
    duration: previousSegment?.duration,
    price: row.cost ?? undefined,
    currency: previousSegment?.currency,
    bookingUrl: row.booking_url ?? undefined,
    confirmationCode: row.confirmation_code ?? undefined,
    isSelected: previousSegment?.isSelected,
    notes: row.notes ?? undefined,
  };
}

export function mapTripRowToTrip(
  row: TripRow,
  tripStops: Array<TripStopRow | TripStopWithLocationRef> = [],
  transportSegments: Array<TransportSegmentRow | TransportSegmentWithLocationRefs> = [],
  previousTrip?: Trip,
): Trip {
  const orderedStops = [...tripStops].sort(
    (a, b) => a.order_index - b.order_index,
  );
  const stops = orderedStops.map((stop) =>
    mapStop(stop, previousTrip?.stops ?? []),
  );
  const primaryStop = stops[0];
  const startDate = row.start_date ?? primaryStop?.startDate ?? '';
  const endDate = row.end_date ?? primaryStop?.endDate ?? '';
  const destination = row.destination ?? primaryStop?.name ?? row.title;
  const country = row.country ?? primaryStop?.country ?? '';

  return {
    id: row.id,
    title: row.title,
    destination,
    country,
    startDate,
    endDate,
    travelers: row.travelers,
    budget: row.budget,
    budgetCurrency: isBudgetCurrency(row.budget_currency)
      ? row.budget_currency
      : previousTrip?.budgetCurrency ?? DEFAULT_BUDGET_CURRENCY,
    vibe: isTripVibe(row.vibe)
      ? row.vibe
      : previousTrip?.vibe ?? DEFAULT_TRIP_VIBE,
    status: isTripStatus(row.status)
      ? row.status
      : previousTrip?.status ?? getStatusFromDates(startDate, endDate),
    notes: row.description ?? '',
    image: row.cover_image ?? previousTrip?.image ?? '',
    planningProgress: row.planning_progress,
    stops,
    transportSegments: transportSegments.map((segment) =>
      mapTransportSegment(segment, orderedStops, previousTrip?.transportSegments),
    ),
  };
}

export function mapTripWithRelationsToTrip(
  row: TripWithRelations,
  previousTrip?: Trip,
): Trip {
  return mapTripRowToTrip(
    row,
    row.trip_stops,
    row.transport_segments,
    previousTrip,
  );
}

export function mapTripToTripInsert(userId: string, trip: Trip): TripInsert {
  return {
    user_id: userId,
    title: trip.title,
    destination: trip.destination,
    country: trip.country,
    start_date: trip.startDate || null,
    end_date: trip.endDate || null,
    travelers: trip.travelers,
    budget: trip.budget,
    budget_currency: trip.budgetCurrency ?? DEFAULT_BUDGET_CURRENCY,
    vibe: trip.vibe,
    status: trip.status,
    planning_progress: trip.planningProgress,
    description: trip.notes || null,
    cover_image: trip.image || null,
  };
}

export function mapTripToTripUpdate(trip: Trip): TripUpdate {
  return {
    title: trip.title,
    destination: trip.destination,
    country: trip.country,
    start_date: trip.startDate || null,
    end_date: trip.endDate || null,
    travelers: trip.travelers,
    budget: trip.budget,
    budget_currency: trip.budgetCurrency ?? DEFAULT_BUDGET_CURRENCY,
    vibe: trip.vibe,
    status: trip.status,
    planning_progress: trip.planningProgress,
    description: trip.notes || null,
    cover_image: trip.image || null,
  };
}

export function mapTripStopToTripStopInsert(
  tripId: string,
  stop: TripStop,
): TripStopInsert {
  return {
    trip_id: tripId,
    name: stop.name,
    country: stop.country ?? null,
    start_date: stop.startDate || null,
    end_date: stop.endDate || null,
    order_index: stop.order,
    location_ref_id: getPersistedLocationRefId(stop.locationRef),
    notes: stop.notes ?? null,
    image: stop.image ?? null,
    latitude: stop.latitude ?? null,
    longitude: stop.longitude ?? null,
  };
}

export function mapTransportSegmentRowToTransportSegment(
  row: TransportSegmentRow | TransportSegmentWithLocationRefs,
  stops: TripStopRow[] = [],
  previousSegments: TransportSegment[] = [],
): TransportSegment {
  return mapTransportSegment(row, stops, previousSegments);
}

export function mapTransportSegmentToInsert(
  tripId: string,
  segment: TransportSegment,
): TransportSegmentInsert {
  return {
    trip_id: tripId,
    from_stop_id: segment.fromStopId ?? null,
    to_stop_id: segment.toStopId ?? null,
    mode: segment.mode,
    role: segment.role ?? null,
    is_primary: Boolean(segment.isPrimary),
    provider: segment.provider ?? null,
    confirmation_code: segment.confirmationCode ?? null,
    booking_url: segment.bookingUrl ?? null,
    cost: segment.price ?? null,
    departure_time: segment.departureDateTime ?? null,
    arrival_time: segment.arrivalDateTime ?? null,
    notes: segment.notes ?? null,
    from_text: segment.departureLocation || segment.fromLocation?.name || null,
    to_text: segment.arrivalLocation || segment.toLocation?.name || null,
    from_location_ref_id: getPersistedLocationRefId(segment.fromLocation),
    to_location_ref_id: getPersistedLocationRefId(segment.toLocation),
  };
}

export function mapTransportSegmentToUpdate(
  segment: TransportSegment,
): TransportSegmentUpdate {
  return {
    from_stop_id: segment.fromStopId ?? null,
    to_stop_id: segment.toStopId ?? null,
    mode: segment.mode,
    role: segment.role ?? null,
    is_primary: Boolean(segment.isPrimary),
    provider: segment.provider ?? null,
    confirmation_code: segment.confirmationCode ?? null,
    booking_url: segment.bookingUrl ?? null,
    cost: segment.price ?? null,
    departure_time: segment.departureDateTime ?? null,
    arrival_time: segment.arrivalDateTime ?? null,
    notes: segment.notes ?? null,
    from_text: segment.departureLocation || segment.fromLocation?.name || null,
    to_text: segment.arrivalLocation || segment.toLocation?.name || null,
    from_location_ref_id: getPersistedLocationRefId(segment.fromLocation),
    to_location_ref_id: getPersistedLocationRefId(segment.toLocation),
  };
}

export function mapHotelToLodgingOptionInsert(
  tripId: string,
  hotel: Hotel,
  isSelected: boolean,
): LodgingOptionInsert {
  return {
    trip_id: tripId,
    stop_id: hotel.stopId ?? null,
    location_ref_id: getPersistedLocationRefId(hotel.locationRef),
    name: hotel.name,
    address: hotel.locationRef?.formattedAddress ?? hotel.neighborhood ?? null,
    neighborhood: hotel.neighborhood,
    check_in: null,
    check_out: null,
    price_per_night: hotel.pricePerNight,
    total_cost: hotel.totalCost,
    booking_url: hotel.locationRef?.websiteUri ?? null,
    confirmation_code: null,
    notes: hotel.description,
    is_selected: isSelected,
    is_saved: isSelected,
    source: hotel.locationRef?.source ?? 'mock',
    source_id: hotel.id,
  };
}

export function mapHotelToLodgingOptionUpdate(
  hotel: Hotel,
  isSelected: boolean,
): LodgingOptionUpdate {
  return {
    stop_id: hotel.stopId ?? null,
    location_ref_id: getPersistedLocationRefId(hotel.locationRef),
    name: hotel.name,
    address: hotel.locationRef?.formattedAddress ?? hotel.neighborhood ?? null,
    neighborhood: hotel.neighborhood,
    price_per_night: hotel.pricePerNight,
    total_cost: hotel.totalCost,
    booking_url: hotel.locationRef?.websiteUri ?? null,
    notes: hotel.description,
    is_selected: isSelected,
    is_saved: isSelected,
    source: hotel.locationRef?.source ?? 'mock',
    source_id: hotel.id,
  };
}

export function getHotelIdFromLodgingOption(row: LodgingOptionRow): string {
  return row.source_id ?? row.id;
}

function getLodgingOptionLocationRef(
  row: LodgingOptionRow | LodgingOptionWithLocationRef,
) {
  if ('location_refs' in row && row.location_refs) {
    return mapLocationRefRowToLocationRef(row.location_refs);
  }

  return undefined;
}

export function mapLodgingOptionRowToHotel(
  row: LodgingOptionRow | LodgingOptionWithLocationRef,
  tripId: string,
): Hotel {
  const locationRef = getLodgingOptionLocationRef(row);
  const pricePerNight = row.price_per_night ?? 0;

  return {
    id: getHotelIdFromLodgingOption(row),
    tripId,
    stopId: row.stop_id ?? undefined,
    name: locationRef?.displayName ?? locationRef?.name ?? row.name,
    image: locationRef?.photoUrls?.[0] ?? GOOGLE_HOTEL_IMAGE,
    rating: locationRef?.rating ?? 0,
    reviewCount: locationRef?.reviewCount ?? 0,
    pricePerNight,
    totalCost: row.total_cost ?? pricePerNight,
    amenities: [],
    neighborhood:
      row.neighborhood ??
      row.address ??
      locationRef?.formattedAddress ??
      'Saved lodging',
    locationRef,
    distanceToCenter: '',
    description: row.notes ?? '',
    isSelected: row.is_selected || row.is_saved,
  };
}

export function mapPlaceToSavedPlaceInsert(
  tripId: string,
  place: Place,
  isSaved: boolean,
): SavedPlaceInsert {
  return {
    trip_id: tripId,
    stop_id: place.stopId ?? null,
    location_ref_id: getPersistedLocationRefId(place.locationRef),
    name: place.name,
    type: place.category,
    category: place.category,
    address: place.locationRef?.formattedAddress ?? place.location,
    notes: place.description ?? place.reviewSnippet ?? null,
    is_saved: isSaved,
    source: place.locationRef?.source ?? 'mock',
    source_id: place.id,
  };
}

export function mapPlaceToSavedPlaceUpdate(
  place: Place,
  isSaved: boolean,
): SavedPlaceUpdate {
  return {
    stop_id: place.stopId ?? null,
    location_ref_id: getPersistedLocationRefId(place.locationRef),
    name: place.name,
    type: place.category,
    category: place.category,
    address: place.locationRef?.formattedAddress ?? place.location,
    notes: place.description ?? place.reviewSnippet ?? null,
    is_saved: isSaved,
    source: place.locationRef?.source ?? 'mock',
    source_id: place.id,
  };
}

export function getPlaceIdFromSavedPlace(row: SavedPlaceRow): string {
  return row.source_id ?? row.id;
}

function getSavedPlaceLocationRef(
  row: SavedPlaceRow | SavedPlaceWithLocationRef,
) {
  if ('location_refs' in row && row.location_refs) {
    return mapLocationRefRowToLocationRef(row.location_refs);
  }

  return undefined;
}

export function mapSavedPlaceRowToPlace(
  row: SavedPlaceRow | SavedPlaceWithLocationRef,
  tripId: string,
): Place {
  const locationRef = getSavedPlaceLocationRef(row);
  const category =
    row.category && isPlaceCategory(row.category)
      ? row.category
      : 'Hidden Gems';

  return {
    id: getPlaceIdFromSavedPlace(row),
    tripId,
    stopId: row.stop_id ?? undefined,
    name: locationRef?.displayName ?? locationRef?.name ?? row.name,
    image: locationRef?.photoUrls?.[0] ?? GOOGLE_PLACE_IMAGE,
    category,
    rating: locationRef?.rating ?? 0,
    reviewCount: locationRef?.reviewCount ?? 0,
    priceRange: locationRef?.priceRange ?? locationRef?.priceLevel ?? '',
    location: locationRef?.formattedAddress ?? row.address ?? 'Saved place',
    locationRef,
    reviewSnippet: row.notes ?? '',
    tags: locationRef?.placeTypes?.slice(0, 3).map((type) => type.replace(/_/g, ' ')) ?? [category],
    description: row.notes ?? undefined,
    hours: locationRef?.regularOpeningHours?.[0],
    isSaved: row.is_saved,
  };
}

function getItineraryItemLocationRef(
  row: ItineraryItemRow | ItineraryItemWithLocationRef,
) {
  if ('location_refs' in row && row.location_refs) {
    return mapLocationRefRowToLocationRef(row.location_refs);
  }

  return undefined;
}

export function mapItineraryItemRowToItineraryItem(
  row: ItineraryItemRow | ItineraryItemWithLocationRef,
): ItineraryItem {
  const locationRef = getItineraryItemLocationRef(row);

  return {
    id: row.id,
    stopId: row.stop_id ?? undefined,
    time: row.start_time?.slice(0, 5) ?? '',
    name: row.title,
    type: isItineraryItemType(row.item_type) ? row.item_type : 'activity',
    location: locationRef?.formattedAddress ?? row.location_text ?? '',
    locationRef,
    estimatedCost: row.estimated_cost ?? 0,
    notes: row.notes ?? '',
  };
}

export function mapItineraryRowsToDays(
  rows: Array<ItineraryItemRow | ItineraryItemWithLocationRef>,
): ItineraryDay[] {
  const sortedRows = [...rows].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.order_index - b.order_index;
  });
  const dates = [...new Set(sortedRows.map((row) => row.date))];

  return dates.map((date, index) => {
    const dateRows = sortedRows.filter((row) => row.date === date);
    const day: ItineraryDay = {
      dayNumber: index + 1,
      date,
      stopId: dateRows[0]?.stop_id ?? undefined,
      morning: [],
      afternoon: [],
      evening: [],
    };

    for (const row of dateRows) {
      const timeOfDay = normalizeTimeOfDay(row.time_of_day, row.start_time);
      day[timeOfDay].push(mapItineraryItemRowToItineraryItem(row));
    }

    return day;
  });
}

export function mapBudgetExpenseRowToBudgetExpense(
  row: BudgetExpenseRow,
): BudgetExpense {
  return {
    id: row.id,
    tripId: row.trip_id,
    category: row.category,
    stopId: row.stop_id ?? undefined,
    title: row.title,
    amount: row.amount,
    date: row.expense_date ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export function mapBudgetExpenseToInsert(
  expense: BudgetExpense,
): BudgetExpenseInsert {
  return {
    trip_id: expense.tripId,
    stop_id: expense.stopId ?? null,
    category: expense.category,
    title: expense.title,
    amount: expense.amount,
    expense_date: expense.date ?? null,
    notes: expense.notes ?? null,
  };
}

export function mapBudgetExpenseToUpdate(
  expense: BudgetExpense,
): BudgetExpenseUpdate {
  return {
    stop_id: expense.stopId ?? null,
    category: expense.category,
    title: expense.title,
    amount: expense.amount,
    expense_date: expense.date ?? null,
    notes: expense.notes ?? null,
  };
}

export function mapBudgetCategoryRowToBudgetCategory(
  row: BudgetCategoryRow,
): BudgetCategory {
  return {
    stopId: row.stop_id ?? undefined,
    name: row.name,
    allocated: row.allocated,
    spent: 0,
    icon: row.icon ?? '',
  };
}

export function mapBudgetCategoryToInsert(
  tripId: string,
  category: BudgetCategory,
  orderIndex = 0,
): BudgetCategoryInsert {
  return {
    trip_id: tripId,
    stop_id: category.stopId ?? null,
    name: category.name,
    allocated: category.allocated,
    icon: category.icon || null,
    order_index: orderIndex,
  };
}

export function mapBudgetCategoryToUpdate(
  category: BudgetCategory,
  orderIndex?: number,
): BudgetCategoryUpdate {
  return {
    stop_id: category.stopId ?? null,
    name: category.name,
    allocated: category.allocated,
    icon: category.icon || null,
    ...(typeof orderIndex === 'number' ? { order_index: orderIndex } : {}),
  };
}

export function mapTripNoteRowToNote(row: TripNoteRow): Note {
  return {
    id: row.id,
    tripId: row.trip_id,
    stopId: row.stop_id ?? undefined,
    title: row.title,
    content: row.body,
    createdAt: row.created_at,
  };
}

export function mapNoteToTripNoteInsert(note: Note): TripNoteInsert {
  return {
    trip_id: note.tripId,
    stop_id: note.stopId ?? null,
    title: note.title,
    body: note.content,
  };
}

export function mapNoteToTripNoteUpdate(note: Note): TripNoteUpdate {
  return {
    stop_id: note.stopId ?? null,
    title: note.title,
    body: note.content,
  };
}

export function mapChecklistItemRowToChecklistItem(
  row: ChecklistItemRow,
): ChecklistItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    stopId: row.stop_id ?? undefined,
    text: row.text,
    checked: row.checked,
    category: isChecklistCategory(row.category) ? row.category : 'reminders',
  };
}

export function mapChecklistItemToInsert(
  item: ChecklistItem,
  orderIndex = 0,
): ChecklistItemInsert {
  return {
    trip_id: item.tripId,
    stop_id: item.stopId ?? null,
    text: item.text,
    checked: item.checked,
    category: item.category,
    order_index: orderIndex,
  };
}

export function mapChecklistItemToUpdate(
  item: ChecklistItem,
): ChecklistItemUpdate {
  return {
    stop_id: item.stopId ?? null,
    text: item.text,
    checked: item.checked,
    category: item.category,
  };
}
