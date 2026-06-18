import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import type {
  BudgetExpense,
  BudgetCategory,
  ChecklistItem,
  Hotel,
  ItineraryDay,
  ItineraryItem,
  LocationRef,
  Note,
  Place,
  TransportSegment,
  Trip,
} from '../types';
import {
  mapBudgetExpenseRowToBudgetExpense,
  mapBudgetExpenseToInsert,
  mapBudgetExpenseToUpdate,
  mapBudgetCategoryRowToBudgetCategory,
  mapBudgetCategoryToInsert,
  mapBudgetCategoryToUpdate,
  mapChecklistItemRowToChecklistItem,
  mapChecklistItemToInsert,
  mapChecklistItemToUpdate,
  mapHotelToLodgingOptionInsert,
  mapHotelToLodgingOptionUpdate,
  mapItineraryItemRowToItineraryItem,
  mapPlaceToSavedPlaceInsert,
  mapPlaceToSavedPlaceUpdate,
  mapItineraryRowsToDays,
  mapNoteToTripNoteInsert,
  mapNoteToTripNoteUpdate,
  mapTripStopToTripStopInsert,
  mapTripNoteRowToNote,
  mapTripToTripInsert,
  mapTripToTripUpdate,
  mapTransportSegmentToInsert,
  mapTransportSegmentToUpdate,
} from './tripMappers';
import type {
  BudgetExpenseRow,
  BudgetCategoryRow,
  ChecklistItemRow,
  ItineraryItemInsert,
  ItineraryItemRow,
  ItineraryItemUpdate,
  LodgingOptionRow,
  LocationRefInsert,
  LocationRefRow,
  LocationRefUpdate,
  ProfileInsert,
  ProfileRow,
  ProfileUpdate,
  SavedPlaceRow,
  TransportSegmentInsert,
  TransportSegmentRow,
  TransportSegmentUpdate,
  TripNoteRow,
  TripInsert,
  TripRow,
  TripStopInsert,
  TripStopRow,
  TripStopUpdate,
  TripUpdate,
  Json,
} from './supabaseTypes';

export interface TripWithRelations extends TripRow {
  trip_stops: TripStopWithLocationRef[];
  transport_segments: TransportSegmentRow[];
}

export interface TripStopWithLocationRef extends TripStopRow {
  location_refs: LocationRefRow | null;
}

export interface LodgingOptionWithLocationRef extends LodgingOptionRow {
  location_refs: LocationRefRow | null;
}

export interface SavedPlaceWithLocationRef extends SavedPlaceRow {
  location_refs: LocationRefRow | null;
}

export interface ItineraryItemWithLocationRef extends ItineraryItemRow {
  location_refs: LocationRefRow | null;
}

export interface TransportSegmentWithLocationRefs extends TransportSegmentRow {
  from_location_ref: LocationRefRow | null;
  to_location_ref: LocationRefRow | null;
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const {
    data: { session },
    error,
  } = await getSupabaseClient().auth.getSession();

  if (error) throw error;
  return session?.user.id ?? null;
}

export const profileService = {
  async getProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsertProfile(profile: ProfileInsert): Promise<ProfileRow> {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(
    userId: string,
    updates: ProfileUpdate,
  ): Promise<ProfileRow> {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export const tripService = {
  async listTrips(userId: string): Promise<TripRow[]> {
    const { data, error } = await getSupabaseClient()
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data;
  },

  async listTripsWithRelations(userId: string): Promise<TripWithRelations[]> {
    const { data, error } = await getSupabaseClient()
      .from('trips')
      .select('*, trip_stops(*, location_refs(*)), transport_segments(*, from_location_ref:location_refs!transport_segments_from_location_ref_id_fkey(*), to_location_ref:location_refs!transport_segments_to_location_ref_id_fkey(*))')
      .eq('user_id', userId)
      .order('start_date', { ascending: true, nullsFirst: false })
      .order('order_index', {
        ascending: true,
        referencedTable: 'trip_stops',
      })
      .order('departure_time', {
        ascending: true,
        nullsFirst: false,
        referencedTable: 'transport_segments',
      });

    if (error) throw error;
    return data;
  },

  async getTrip(tripId: string): Promise<TripWithRelations | null> {
    const { data, error } = await getSupabaseClient()
      .from('trips')
      .select('*, trip_stops(*, location_refs(*)), transport_segments(*, from_location_ref:location_refs!transport_segments_from_location_ref_id_fkey(*), to_location_ref:location_refs!transport_segments_to_location_ref_id_fkey(*))')
      .eq('id', tripId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createTrip(trip: TripInsert): Promise<TripRow> {
    const { data, error } = await getSupabaseClient()
      .from('trips')
      .insert(trip)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createTripWithStops(userId: string, trip: Trip): Promise<TripWithRelations> {
    const createdTrip = await this.createTrip(mapTripToTripInsert(userId, trip));

    if (trip.stops.length > 0) {
      const stopInserts = trip.stops.map((stop) =>
        mapTripStopToTripStopInsert(createdTrip.id, stop),
      );
      const { error } = await getSupabaseClient()
        .from('trip_stops')
        .insert(stopInserts);

      if (error) throw error;
    }

    const createdTripWithRelations = await this.getTrip(createdTrip.id);
    if (!createdTripWithRelations) {
      throw new Error('Created trip could not be loaded from Supabase.');
    }

    return createdTripWithRelations;
  },

  async updateTrip(tripId: string, updates: TripUpdate): Promise<TripRow> {
    const { data, error } = await getSupabaseClient()
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTripWithStops(trip: Trip): Promise<TripWithRelations> {
    await this.updateTrip(trip.id, mapTripToTripUpdate(trip));

    const existingStops = await tripStopService.listTripStops(trip.id);
    const existingStopIds = new Set(existingStops.map((stop) => stop.id));
    const keptStopIds = new Set<string>();

    for (const stop of trip.stops) {
      const stopPayload = mapTripStopToTripStopInsert(trip.id, stop);

      if (existingStopIds.has(stop.id)) {
        keptStopIds.add(stop.id);
        await tripStopService.updateTripStop(stop.id, stopPayload);
      } else {
        const createdStop = await tripStopService.createTripStop(stopPayload);
        keptStopIds.add(createdStop.id);
      }
    }

    const removedStops = existingStops.filter(
      (stop) => !keptStopIds.has(stop.id),
    );
    await Promise.all(
      removedStops.map((stop) => tripStopService.deleteTripStop(stop.id)),
    );

    const updatedTripWithRelations = await this.getTrip(trip.id);
    if (!updatedTripWithRelations) {
      throw new Error('Updated trip could not be loaded from Supabase.');
    }

    return updatedTripWithRelations;
  },

  async deleteTrip(tripId: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) throw error;
  },
};

export const tripStopService = {
  async listTripStops(tripId: string): Promise<TripStopRow[]> {
    const { data, error } = await getSupabaseClient()
      .from('trip_stops')
      .select('*')
      .eq('trip_id', tripId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createTripStop(stop: TripStopInsert): Promise<TripStopRow> {
    const { data, error } = await getSupabaseClient()
      .from('trip_stops')
      .insert(stop)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTripStop(
    stopId: string,
    updates: TripStopUpdate,
  ): Promise<TripStopRow> {
    const { data, error } = await getSupabaseClient()
      .from('trip_stops')
      .update(updates)
      .eq('id', stopId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTripStop(stopId: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('trip_stops')
      .delete()
      .eq('id', stopId);

    if (error) throw error;
  },
};

export const locationRefService = {
  async listLocationRefs(userId: string): Promise<LocationRefRow[]> {
    const { data, error } = await getSupabaseClient()
      .from('location_refs')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createLocationRef(
    location: LocationRefInsert,
  ): Promise<LocationRefRow> {
    const { data, error } = await getSupabaseClient()
      .from('location_refs')
      .insert(location)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsertGoogleLocationRef(
    userId: string,
    location: LocationRef,
    rawGooglePayload?: Json,
  ): Promise<LocationRefRow> {
    if (!location.googlePlaceId) {
      throw new Error('googlePlaceId is required to upsert a Google location.');
    }

    const payload: LocationRefInsert = {
      user_id: userId,
      google_place_id: location.googlePlaceId,
      name: location.name,
      display_name: location.displayName ?? location.name,
      formatted_address: location.formattedAddress ?? null,
      lat: location.latitude ?? null,
      lng: location.longitude ?? null,
      place_types: location.placeTypes ?? [],
      rating: location.rating ?? null,
      review_count: location.reviewCount ?? null,
      photo_urls: location.photoUrls ?? [],
      website_uri: location.websiteUri ?? null,
      national_phone_number: location.nationalPhoneNumber ?? null,
      international_phone_number: location.internationalPhoneNumber ?? null,
      regular_opening_hours: location.regularOpeningHours ?? [],
      price_level: location.priceLevel ?? null,
      price_range: location.priceRange ?? null,
      google_maps_uri: location.googleMapsUri ?? null,
      business_status: location.businessStatus ?? null,
      raw_google_payload: rawGooglePayload ?? null,
      source: 'google',
    };

    const { data: existing, error: lookupError } = await getSupabaseClient()
      .from('location_refs')
      .select('*')
      .eq('user_id', userId)
      .eq('google_place_id', location.googlePlaceId)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing) {
      return this.updateLocationRef(existing.id, payload);
    }

    return this.createLocationRef(payload);
  },

  async updateLocationRef(
    locationId: string,
    updates: LocationRefUpdate,
  ): Promise<LocationRefRow> {
    const { data, error } = await getSupabaseClient()
      .from('location_refs')
      .update(updates)
      .eq('id', locationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteLocationRef(locationId: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('location_refs')
      .delete()
      .eq('id', locationId);

    if (error) throw error;
  },
};

export const transportSegmentService = {
  async listTransportSegments(tripId: string): Promise<TransportSegmentWithLocationRefs[]> {
    const { data, error } = await getSupabaseClient()
      .from('transport_segments')
      .select('*, from_location_ref:location_refs!transport_segments_from_location_ref_id_fkey(*), to_location_ref:location_refs!transport_segments_to_location_ref_id_fkey(*)')
      .eq('trip_id', tripId)
      .order('departure_time', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data;
  },

  async createTransportSegment(
    segment: TransportSegmentInsert,
  ): Promise<TransportSegmentWithLocationRefs> {
    const { data, error } = await getSupabaseClient()
      .from('transport_segments')
      .insert(segment)
      .select('*, from_location_ref:location_refs!transport_segments_from_location_ref_id_fkey(*), to_location_ref:location_refs!transport_segments_to_location_ref_id_fkey(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async createTravelSegment(
    tripId: string,
    segment: TransportSegment,
  ): Promise<TransportSegmentWithLocationRefs> {
    return this.createTransportSegment(
      mapTransportSegmentToInsert(tripId, segment),
    );
  },

  async updateTransportSegment(
    segmentId: string,
    updates: TransportSegmentUpdate,
  ): Promise<TransportSegmentWithLocationRefs> {
    const { data, error } = await getSupabaseClient()
      .from('transport_segments')
      .update(updates)
      .eq('id', segmentId)
      .select('*, from_location_ref:location_refs!transport_segments_from_location_ref_id_fkey(*), to_location_ref:location_refs!transport_segments_to_location_ref_id_fkey(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async updateTravelSegment(
    segment: TransportSegment,
  ): Promise<TransportSegmentWithLocationRefs> {
    return this.updateTransportSegment(
      segment.id,
      mapTransportSegmentToUpdate(segment),
    );
  },

  async deleteTransportSegment(segmentId: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('transport_segments')
      .delete()
      .eq('id', segmentId);

    if (error) throw error;
  },
};

export const transportService = transportSegmentService;

export const lodgingService = {
  async listLodgingOptions(tripId: string): Promise<LodgingOptionWithLocationRef[]> {
    const { data, error } = await getSupabaseClient()
      .from('lodging_options')
      .select('*, location_refs(*)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async upsertHotelSelection(
    tripId: string,
    hotel: Hotel,
    isSelected: boolean,
  ): Promise<LodgingOptionRow> {
    const insertPayload = mapHotelToLodgingOptionInsert(
      tripId,
      hotel,
      isSelected,
    );
    const updatePayload = mapHotelToLodgingOptionUpdate(hotel, isSelected);

    const { data, error } = await getSupabaseClient()
      .from('lodging_options')
      .upsert(
        {
          ...insertPayload,
          ...updatePayload,
        },
        { onConflict: 'trip_id,source,source_id' },
      )
      .select('*, location_refs(*)')
      .single();

    if (error) throw error;
    return data;
  },
};

export const savedPlaceService = {
  async listSavedPlaces(tripId: string): Promise<SavedPlaceWithLocationRef[]> {
    const { data, error } = await getSupabaseClient()
      .from('saved_places')
      .select('*, location_refs(*)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async upsertSavedPlace(
    tripId: string,
    place: Place,
    isSaved: boolean,
  ): Promise<SavedPlaceRow> {
    const insertPayload = mapPlaceToSavedPlaceInsert(tripId, place, isSaved);
    const updatePayload = mapPlaceToSavedPlaceUpdate(place, isSaved);

    const { data, error } = await getSupabaseClient()
      .from('saved_places')
      .upsert(
        {
          ...insertPayload,
          ...updatePayload,
        },
        { onConflict: 'trip_id,source,source_id' },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export const itineraryService = {
  async listItineraryItems(tripId: string): Promise<ItineraryItemWithLocationRef[]> {
    const { data, error } = await getSupabaseClient()
      .from('itinerary_items')
      .select('*, location_refs(*)')
      .eq('trip_id', tripId)
      .order('date', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  },

  async listItineraryDays(tripId: string): Promise<ItineraryDay[]> {
    const rows = await this.listItineraryItems(tripId);
    return mapItineraryRowsToDays(rows);
  },

  async createItineraryItem(
    item: ItineraryItemInsert,
  ): Promise<ItineraryItem> {
    const { data, error } = await getSupabaseClient()
      .from('itinerary_items')
      .insert(item)
      .select('*, location_refs(*)')
      .single();

    if (error) throw error;
    return mapItineraryItemRowToItineraryItem(data);
  },

  async updateItineraryItem(
    itemId: string,
    updates: ItineraryItemUpdate,
  ): Promise<ItineraryItem> {
    const { data, error } = await getSupabaseClient()
      .from('itinerary_items')
      .update(updates)
      .eq('id', itemId)
      .select('*, location_refs(*)')
      .single();

    if (error) throw error;
    return mapItineraryItemRowToItineraryItem(data);
  },

  async deleteItineraryItem(itemId: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('itinerary_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  },
};

export const budgetService = {
  async listBudgetCategoryRows(tripId: string): Promise<BudgetCategoryRow[]> {
    const { data, error } = await getSupabaseClient()
      .from('budget_categories')
      .select('*')
      .eq('trip_id', tripId)
      .order('order_index', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async listBudgetCategories(tripId: string): Promise<BudgetCategory[]> {
    const rows = await this.listBudgetCategoryRows(tripId);
    return rows.map(mapBudgetCategoryRowToBudgetCategory);
  },

  async upsertBudgetCategory(
    tripId: string,
    category: BudgetCategory,
    orderIndex = 0,
  ): Promise<BudgetCategory> {
    const insertPayload = mapBudgetCategoryToInsert(
      tripId,
      category,
      orderIndex,
    );
    const updatePayload = mapBudgetCategoryToUpdate(category, orderIndex);

    const { data, error } = await getSupabaseClient()
      .from('budget_categories')
      .upsert(
        {
          ...insertPayload,
          ...updatePayload,
        },
        { onConflict: 'trip_id,stop_key,name' },
      )
      .select()
      .single();

    if (error) throw error;
    return mapBudgetCategoryRowToBudgetCategory(data);
  },

  async deleteBudgetCategory(categoryId: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('budget_categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
  },

  async listBudgetExpenseRows(tripId: string): Promise<BudgetExpenseRow[]> {
    const { data, error } = await getSupabaseClient()
      .from('budget_expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async listBudgetExpenses(tripId: string): Promise<BudgetExpense[]> {
    const rows = await this.listBudgetExpenseRows(tripId);
    return rows.map(mapBudgetExpenseRowToBudgetExpense);
  },

  async createBudgetExpense(
    expense: BudgetExpense,
  ): Promise<BudgetExpense> {
    const { data, error } = await getSupabaseClient()
      .from('budget_expenses')
      .insert(mapBudgetExpenseToInsert(expense))
      .select()
      .single();

    if (error) throw error;
    return mapBudgetExpenseRowToBudgetExpense(data);
  },

  async updateBudgetExpense(
    expense: BudgetExpense,
  ): Promise<BudgetExpense> {
    const { data, error } = await getSupabaseClient()
      .from('budget_expenses')
      .update(mapBudgetExpenseToUpdate(expense))
      .eq('id', expense.id)
      .select()
      .single();

    if (error) throw error;
    return mapBudgetExpenseRowToBudgetExpense(data);
  },

  async deleteBudgetExpense(expenseId: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('budget_expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
  },
};

export const notesService = {
  async listTripNotes(tripId: string): Promise<TripNoteRow[]> {
    const { data, error } = await getSupabaseClient()
      .from('trip_notes')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async listNotes(tripId: string): Promise<Note[]> {
    const rows = await this.listTripNotes(tripId);
    return rows.map(mapTripNoteRowToNote);
  },

  async createNote(note: Note): Promise<Note> {
    const { data, error } = await getSupabaseClient()
      .from('trip_notes')
      .insert(mapNoteToTripNoteInsert(note))
      .select()
      .single();

    if (error) throw error;
    return mapTripNoteRowToNote(data);
  },

  async updateNote(note: Note): Promise<Note> {
    const { data, error } = await getSupabaseClient()
      .from('trip_notes')
      .update(mapNoteToTripNoteUpdate(note))
      .eq('id', note.id)
      .select()
      .single();

    if (error) throw error;
    return mapTripNoteRowToNote(data);
  },

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('trip_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  async listChecklistItemRows(tripId: string): Promise<ChecklistItemRow[]> {
    const { data, error } = await getSupabaseClient()
      .from('checklist_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async listChecklistItems(tripId: string): Promise<ChecklistItem[]> {
    const rows = await this.listChecklistItemRows(tripId);
    return rows.map(mapChecklistItemRowToChecklistItem);
  },

  async createChecklistItem(
    item: ChecklistItem,
    orderIndex = 0,
  ): Promise<ChecklistItem> {
    const { data, error } = await getSupabaseClient()
      .from('checklist_items')
      .insert(mapChecklistItemToInsert(item, orderIndex))
      .select()
      .single();

    if (error) throw error;
    return mapChecklistItemRowToChecklistItem(data);
  },

  async updateChecklistItem(item: ChecklistItem): Promise<ChecklistItem> {
    const { data, error } = await getSupabaseClient()
      .from('checklist_items')
      .update(mapChecklistItemToUpdate(item))
      .eq('id', item.id)
      .select()
      .single();

    if (error) throw error;
    return mapChecklistItemRowToChecklistItem(data);
  },

  async deleteChecklistItem(itemId: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('checklist_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  },
};
