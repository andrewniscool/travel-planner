export type TripStatus = 'upcoming' | 'planning' | 'booked' | 'past';
export type TripVibe = 'Relaxing' | 'Adventure' | 'Food-focused' | 'Romantic' | 'Family' | 'Budget-friendly' | 'Luxury' | 'Cultural';
export type PlaceCategory = 'Restaurants' | 'Cafes' | 'Museums' | 'Outdoor' | 'Nightlife' | 'Shopping' | 'Tours' | 'Landmarks' | 'Hidden Gems';
export type ItineraryItemType = 'flight' | 'hotel' | 'restaurant' | 'activity' | 'free-time' | 'transport';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export type TransportMode = 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'walk' | 'other';
export type TransportRole = 'arrival' | 'departure' | 'between-stops' | 'local';

export type LocationSource = 'mock' | 'manual' | 'google';

export interface LocationRef {
  id: string;
  googlePlaceId?: string;
  name: string;
  displayName?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  placeTypes?: string[];
  rating?: number;
  reviewCount?: number;
  photoUrls?: string[];
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: string[];
  priceLevel?: string;
  priceRange?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  source: LocationSource;
}

export interface Trip {
  id: string;
  title: string;
  stops: TripStop[];
  transportSegments: TransportSegment[];
  /** @deprecated Use title and stops instead. Kept while existing screens migrate. */
  destination: string;
  /** @deprecated Use stops[].country instead. Kept while existing screens migrate. */
  country: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  vibe: TripVibe;
  status: TripStatus;
  notes: string;
  image: string;
  planningProgress: number;
}

export interface TripStop {
  id: string;
  tripId: string;
  name: string;
  country?: string;
  startDate: string;
  endDate: string;
  order: number;
  image?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  locationRef?: LocationRef;
}

export interface TransportSegment {
  id: string;
  tripId: string;
  fromStopId?: string;
  toStopId?: string;
  mode: TransportMode;
  role?: TransportRole;
  isPrimary?: boolean;
  provider?: string;
  fromLocation?: LocationRef;
  toLocation?: LocationRef;
  departureLocation: string;
  arrivalLocation: string;
  departureDateTime?: string;
  arrivalDateTime?: string;
  duration?: string;
  price?: number;
  currency?: string;
  bookingSource?: string;
  bookingUrl?: string;
  confirmationCode?: string;
  isSelected?: boolean;
  notes?: string;
}

export interface Flight {
  id: string;
  tripId: string;
  airline: string;
  airlineLogo: string;
  price: number;
  departureAirport: string;
  departureAirportCode: string;
  arrivalAirport: string;
  arrivalAirportCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  stopCity?: string;
  baggage: string;
  bookingSource: string;
  isSelected?: boolean;
}

export interface Hotel {
  id: string;
  tripId: string;
  stopId?: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  totalCost: number;
  amenities: string[];
  neighborhood: string;
  locationRef?: LocationRef;
  distanceToCenter: string;
  description: string;
  isSelected?: boolean;
}

export interface Place {
  id: string;
  tripId: string;
  stopId?: string;
  name: string;
  image: string;
  category: PlaceCategory;
  rating: number;
  reviewCount: number;
  priceRange: string;
  location: string;
  locationRef?: LocationRef;
  reviewSnippet: string;
  tags: string[];
  description?: string;
  hours?: string;
  isSaved?: boolean;
}

export interface ItineraryItem {
  id: string;
  stopId?: string;
  time: string;
  name: string;
  type: ItineraryItemType;
  location: string;
  locationRef?: LocationRef;
  estimatedCost: number;
  notes: string;
}

export interface ItineraryDay {
  stopId?: string;
  dayNumber: number;
  date: string;
  morning: ItineraryItem[];
  afternoon: ItineraryItem[];
  evening: ItineraryItem[];
}

export interface BudgetCategory {
  stopId?: string;
  name: string;
  allocated: number;
  spent: number;
  icon: string;
}

export interface BudgetExpense {
  id: string;
  tripId: string;
  category: string;
  stopId?: string;
  title: string;
  amount: number;
  date?: string;
  notes?: string;
}

export interface Note {
  id: string;
  tripId: string;
  stopId?: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  tripId: string;
  stopId?: string;
  text: string;
  checked: boolean;
  category: 'packing' | 'documents' | 'reminders';
}

export interface WeatherData {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}

export interface ReviewSnippet {
  author: string;
  text: string;
  rating: number;
}

export interface Testimonial {
  author: string;
  role: string;
  quote: string;
  avatar: string;
}
