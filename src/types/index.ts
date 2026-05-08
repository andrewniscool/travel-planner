export type TripStatus = 'upcoming' | 'planning' | 'booked' | 'past';
export type TripVibe = 'Relaxing' | 'Adventure' | 'Food-focused' | 'Romantic' | 'Family' | 'Budget-friendly' | 'Luxury' | 'Cultural';
export type PlaceCategory = 'Restaurants' | 'Cafes' | 'Museums' | 'Outdoor' | 'Nightlife' | 'Shopping' | 'Tours' | 'Landmarks' | 'Hidden Gems';
export type ItineraryItemType = 'flight' | 'hotel' | 'restaurant' | 'activity' | 'free-time' | 'transport';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface Trip {
  id: string;
  destination: string;
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
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  totalCost: number;
  amenities: string[];
  neighborhood: string;
  distanceToCenter: string;
  description: string;
  isSelected?: boolean;
}

export interface Place {
  id: string;
  tripId: string;
  name: string;
  image: string;
  category: PlaceCategory;
  rating: number;
  reviewCount: number;
  priceRange: string;
  location: string;
  reviewSnippet: string;
  tags: string[];
  description?: string;
  hours?: string;
  isSaved?: boolean;
}

export interface ItineraryItem {
  id: string;
  time: string;
  name: string;
  type: ItineraryItemType;
  location: string;
  estimatedCost: number;
  notes: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  morning: ItineraryItem[];
  afternoon: ItineraryItem[];
  evening: ItineraryItem[];
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  icon: string;
}

export interface Note {
  id: string;
  tripId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  tripId: string;
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
