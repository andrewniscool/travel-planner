export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          location: string | null;
          website: string | null;
          bio: string | null;
          notification_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          website?: string | null;
          bio?: string | null;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          website?: string | null;
          bio?: string | null;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          destination: string | null;
          country: string | null;
          start_date: string | null;
          end_date: string | null;
          travelers: number;
          budget: number;
          budget_currency: string;
          vibe: string;
          status: string;
          planning_progress: number;
          description: string | null;
          cover_image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          destination?: string | null;
          country?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          travelers?: number;
          budget?: number;
          budget_currency?: string;
          vibe?: string;
          status?: string;
          planning_progress?: number;
          description?: string | null;
          cover_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          destination?: string | null;
          country?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          travelers?: number;
          budget?: number;
          budget_currency?: string;
          vibe?: string;
          status?: string;
          planning_progress?: number;
          description?: string | null;
          cover_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trips_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      location_refs: {
        Row: {
          id: string;
          user_id: string;
          google_place_id: string | null;
          name: string;
          display_name: string | null;
          formatted_address: string | null;
          lat: number | null;
          lng: number | null;
          place_types: string[];
          rating: number | null;
          review_count: number | null;
          photo_urls: string[];
          website_uri: string | null;
          national_phone_number: string | null;
          international_phone_number: string | null;
          regular_opening_hours: string[];
          price_level: string | null;
          price_range: string | null;
          google_maps_uri: string | null;
          business_status: string | null;
          raw_google_payload: Json | null;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          google_place_id?: string | null;
          name: string;
          display_name?: string | null;
          formatted_address?: string | null;
          lat?: number | null;
          lng?: number | null;
          place_types?: string[];
          rating?: number | null;
          review_count?: number | null;
          photo_urls?: string[];
          website_uri?: string | null;
          national_phone_number?: string | null;
          international_phone_number?: string | null;
          regular_opening_hours?: string[];
          price_level?: string | null;
          price_range?: string | null;
          google_maps_uri?: string | null;
          business_status?: string | null;
          raw_google_payload?: Json | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          google_place_id?: string | null;
          name?: string;
          display_name?: string | null;
          formatted_address?: string | null;
          lat?: number | null;
          lng?: number | null;
          place_types?: string[];
          rating?: number | null;
          review_count?: number | null;
          photo_urls?: string[];
          website_uri?: string | null;
          national_phone_number?: string | null;
          international_phone_number?: string | null;
          regular_opening_hours?: string[];
          price_level?: string | null;
          price_range?: string | null;
          google_maps_uri?: string | null;
          business_status?: string | null;
          raw_google_payload?: Json | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'location_refs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      trip_stops: {
        Row: {
          id: string;
          trip_id: string;
          name: string;
          country: string | null;
          start_date: string | null;
          end_date: string | null;
          order_index: number;
          location_ref_id: string | null;
          notes: string | null;
          image: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          name: string;
          country?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          order_index: number;
          location_ref_id?: string | null;
          notes?: string | null;
          image?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          name?: string;
          country?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          order_index?: number;
          location_ref_id?: string | null;
          notes?: string | null;
          image?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_stops_location_ref_id_fkey';
            columns: ['location_ref_id'];
            isOneToOne: false;
            referencedRelation: 'location_refs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trip_stops_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      transport_segments: {
        Row: {
          id: string;
          trip_id: string;
          from_stop_id: string | null;
          to_stop_id: string | null;
          mode: string;
          role: string | null;
          is_primary: boolean;
          provider: string | null;
          confirmation_code: string | null;
          booking_url: string | null;
          cost: number | null;
          departure_time: string | null;
          arrival_time: string | null;
          notes: string | null;
          from_text: string | null;
          to_text: string | null;
          from_location_ref_id: string | null;
          to_location_ref_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          from_stop_id?: string | null;
          to_stop_id?: string | null;
          mode: string;
          role?: string | null;
          is_primary?: boolean;
          provider?: string | null;
          confirmation_code?: string | null;
          booking_url?: string | null;
          cost?: number | null;
          departure_time?: string | null;
          arrival_time?: string | null;
          notes?: string | null;
          from_text?: string | null;
          to_text?: string | null;
          from_location_ref_id?: string | null;
          to_location_ref_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          from_stop_id?: string | null;
          to_stop_id?: string | null;
          mode?: string;
          role?: string | null;
          is_primary?: boolean;
          provider?: string | null;
          confirmation_code?: string | null;
          booking_url?: string | null;
          cost?: number | null;
          departure_time?: string | null;
          arrival_time?: string | null;
          notes?: string | null;
          from_text?: string | null;
          to_text?: string | null;
          from_location_ref_id?: string | null;
          to_location_ref_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transport_segments_from_location_ref_id_fkey';
            columns: ['from_location_ref_id'];
            isOneToOne: false;
            referencedRelation: 'location_refs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transport_segments_from_stop_id_fkey';
            columns: ['from_stop_id'];
            isOneToOne: false;
            referencedRelation: 'trip_stops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transport_segments_to_location_ref_id_fkey';
            columns: ['to_location_ref_id'];
            isOneToOne: false;
            referencedRelation: 'location_refs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transport_segments_to_stop_id_fkey';
            columns: ['to_stop_id'];
            isOneToOne: false;
            referencedRelation: 'trip_stops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transport_segments_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      lodging_options: {
        Row: {
          id: string;
          trip_id: string;
          stop_id: string | null;
          location_ref_id: string | null;
          name: string;
          address: string | null;
          neighborhood: string | null;
          check_in: string | null;
          check_out: string | null;
          price_per_night: number | null;
          total_cost: number | null;
          booking_url: string | null;
          confirmation_code: string | null;
          notes: string | null;
          is_selected: boolean;
          is_saved: boolean;
          source: string;
          source_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          stop_id?: string | null;
          location_ref_id?: string | null;
          name: string;
          address?: string | null;
          neighborhood?: string | null;
          check_in?: string | null;
          check_out?: string | null;
          price_per_night?: number | null;
          total_cost?: number | null;
          booking_url?: string | null;
          confirmation_code?: string | null;
          notes?: string | null;
          is_selected?: boolean;
          is_saved?: boolean;
          source?: string;
          source_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          stop_id?: string | null;
          location_ref_id?: string | null;
          name?: string;
          address?: string | null;
          neighborhood?: string | null;
          check_in?: string | null;
          check_out?: string | null;
          price_per_night?: number | null;
          total_cost?: number | null;
          booking_url?: string | null;
          confirmation_code?: string | null;
          notes?: string | null;
          is_selected?: boolean;
          is_saved?: boolean;
          source?: string;
          source_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lodging_options_location_ref_id_fkey';
            columns: ['location_ref_id'];
            isOneToOne: false;
            referencedRelation: 'location_refs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lodging_options_stop_id_fkey';
            columns: ['stop_id'];
            isOneToOne: false;
            referencedRelation: 'trip_stops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lodging_options_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_places: {
        Row: {
          id: string;
          trip_id: string;
          stop_id: string | null;
          location_ref_id: string | null;
          name: string;
          type: string | null;
          category: string | null;
          address: string | null;
          notes: string | null;
          is_saved: boolean;
          source: string;
          source_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          stop_id?: string | null;
          location_ref_id?: string | null;
          name: string;
          type?: string | null;
          category?: string | null;
          address?: string | null;
          notes?: string | null;
          is_saved?: boolean;
          source?: string;
          source_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          stop_id?: string | null;
          location_ref_id?: string | null;
          name?: string;
          type?: string | null;
          category?: string | null;
          address?: string | null;
          notes?: string | null;
          is_saved?: boolean;
          source?: string;
          source_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_places_location_ref_id_fkey';
            columns: ['location_ref_id'];
            isOneToOne: false;
            referencedRelation: 'location_refs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_places_stop_id_fkey';
            columns: ['stop_id'];
            isOneToOne: false;
            referencedRelation: 'trip_stops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_places_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      itinerary_items: {
        Row: {
          id: string;
          trip_id: string;
          stop_id: string | null;
          location_ref_id: string | null;
          title: string;
          item_type: string;
          date: string;
          start_time: string | null;
          end_time: string | null;
          time_of_day: string | null;
          location_text: string | null;
          estimated_cost: number | null;
          notes: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          stop_id?: string | null;
          location_ref_id?: string | null;
          title: string;
          item_type?: string;
          date: string;
          start_time?: string | null;
          end_time?: string | null;
          time_of_day?: string | null;
          location_text?: string | null;
          estimated_cost?: number | null;
          notes?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          stop_id?: string | null;
          location_ref_id?: string | null;
          title?: string;
          item_type?: string;
          date?: string;
          start_time?: string | null;
          end_time?: string | null;
          time_of_day?: string | null;
          location_text?: string | null;
          estimated_cost?: number | null;
          notes?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'itinerary_items_location_ref_id_fkey';
            columns: ['location_ref_id'];
            isOneToOne: false;
            referencedRelation: 'location_refs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'itinerary_items_stop_id_fkey';
            columns: ['stop_id'];
            isOneToOne: false;
            referencedRelation: 'trip_stops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'itinerary_items_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      budget_expenses: {
        Row: {
          id: string;
          trip_id: string;
          stop_id: string | null;
          category: string;
          title: string;
          amount: number;
          expense_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          stop_id?: string | null;
          category: string;
          title: string;
          amount: number;
          expense_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          stop_id?: string | null;
          category?: string;
          title?: string;
          amount?: number;
          expense_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_expenses_stop_id_fkey';
            columns: ['stop_id'];
            isOneToOne: false;
            referencedRelation: 'trip_stops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_expenses_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      budget_categories: {
        Row: {
          id: string;
          trip_id: string;
          stop_id: string | null;
          stop_key: string;
          name: string;
          allocated: number;
          icon: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          stop_id?: string | null;
          name: string;
          allocated?: number;
          icon?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          stop_id?: string | null;
          name?: string;
          allocated?: number;
          icon?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_categories_stop_id_fkey';
            columns: ['stop_id'];
            isOneToOne: false;
            referencedRelation: 'trip_stops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_categories_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      trip_notes: {
        Row: {
          id: string;
          trip_id: string;
          stop_id: string | null;
          title: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          stop_id?: string | null;
          title: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          stop_id?: string | null;
          title?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_notes_stop_id_fkey';
            columns: ['stop_id'];
            isOneToOne: false;
            referencedRelation: 'trip_stops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trip_notes_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      checklist_items: {
        Row: {
          id: string;
          trip_id: string;
          stop_id: string | null;
          text: string;
          checked: boolean;
          category: string;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          stop_id?: string | null;
          text: string;
          checked?: boolean;
          category?: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          stop_id?: string | null;
          text?: string;
          checked?: boolean;
          category?: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'checklist_items_stop_id_fkey';
            columns: ['stop_id'];
            isOneToOne: false;
            referencedRelation: 'trip_stops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'checklist_items_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type TripRow = Database['public']['Tables']['trips']['Row'];
export type TripInsert = Database['public']['Tables']['trips']['Insert'];
export type TripUpdate = Database['public']['Tables']['trips']['Update'];

export type LocationRefRow = Database['public']['Tables']['location_refs']['Row'];
export type LocationRefInsert = Database['public']['Tables']['location_refs']['Insert'];
export type LocationRefUpdate = Database['public']['Tables']['location_refs']['Update'];

export type TripStopRow = Database['public']['Tables']['trip_stops']['Row'];
export type TripStopInsert = Database['public']['Tables']['trip_stops']['Insert'];
export type TripStopUpdate = Database['public']['Tables']['trip_stops']['Update'];

export type TransportSegmentRow =
  Database['public']['Tables']['transport_segments']['Row'];
export type TransportSegmentInsert =
  Database['public']['Tables']['transport_segments']['Insert'];
export type TransportSegmentUpdate =
  Database['public']['Tables']['transport_segments']['Update'];

export type LodgingOptionRow =
  Database['public']['Tables']['lodging_options']['Row'];
export type LodgingOptionInsert =
  Database['public']['Tables']['lodging_options']['Insert'];
export type LodgingOptionUpdate =
  Database['public']['Tables']['lodging_options']['Update'];

export type SavedPlaceRow = Database['public']['Tables']['saved_places']['Row'];
export type SavedPlaceInsert =
  Database['public']['Tables']['saved_places']['Insert'];
export type SavedPlaceUpdate =
  Database['public']['Tables']['saved_places']['Update'];

export type ItineraryItemRow =
  Database['public']['Tables']['itinerary_items']['Row'];
export type ItineraryItemInsert =
  Database['public']['Tables']['itinerary_items']['Insert'];
export type ItineraryItemUpdate =
  Database['public']['Tables']['itinerary_items']['Update'];

export type BudgetExpenseRow =
  Database['public']['Tables']['budget_expenses']['Row'];
export type BudgetExpenseInsert =
  Database['public']['Tables']['budget_expenses']['Insert'];
export type BudgetExpenseUpdate =
  Database['public']['Tables']['budget_expenses']['Update'];

export type BudgetCategoryRow =
  Database['public']['Tables']['budget_categories']['Row'];
export type BudgetCategoryInsert =
  Database['public']['Tables']['budget_categories']['Insert'];
export type BudgetCategoryUpdate =
  Database['public']['Tables']['budget_categories']['Update'];

export type TripNoteRow = Database['public']['Tables']['trip_notes']['Row'];
export type TripNoteInsert =
  Database['public']['Tables']['trip_notes']['Insert'];
export type TripNoteUpdate =
  Database['public']['Tables']['trip_notes']['Update'];

export type ChecklistItemRow =
  Database['public']['Tables']['checklist_items']['Row'];
export type ChecklistItemInsert =
  Database['public']['Tables']['checklist_items']['Insert'];
export type ChecklistItemUpdate =
  Database['public']['Tables']['checklist_items']['Update'];
