import { useMemo } from 'react';
import { getTripFromStorageOrMock } from './useTrip';
import { useServiceTrip } from './useServiceTrips';
import { getFlightsByTripId } from '../data/flights';
import { getHotelsByTripId } from '../data/hotels';
import { getPlacesByTripId } from '../data/places';
import { getItineraryByTripId } from '../data/itinerary';
import { getBudgetByTripId, type TripBudget } from '../data/budget';
import { getNotesByTripId, getChecklistByTripId } from '../data/notes';
import {
  getPrimaryStop,
  getTripDisplayName,
  getTripRouteLabel,
  isMultiStopTrip,
} from '../data/trips';
import { getTripLocationLabel } from '../utils/tripDisplay';
import type {
  ChecklistItem,
  Flight,
  Hotel,
  ItineraryDay,
  Note,
  Place,
  Trip,
  TripStop,
} from '../types';

export interface StopHighlight {
  stop: TripStop;
  hotel?: Hotel;
  places: Place[];
  dayCount: number;
}

export interface TripData {
  trip: Trip | undefined;
  isLoading: boolean;
  serviceError: string | null;
  tripName: string;
  routeLabel: string;
  locationLabel: string;
  isMultiStop: boolean;
  orderedStops: TripStop[];
  flights: Flight[];
  hotels: Hotel[];
  places: Place[];
  itinerary: ItineraryDay[];
  budget: TripBudget | undefined;
  notes: Note[];
  checklist: ChecklistItem[];
  selectedFlight: Flight | undefined;
  selectedHotel: Hotel | undefined;
  savedPlaces: Place[];
  hotelLink: string | undefined;
  totalAllocated: number;
  totalSpent: number;
  tripLengthDays: number;
  checkedCount: number;
  getStopForDay: (day: ItineraryDay) => TripStop | undefined;
  getStopName: (stopId?: string) => string | undefined;
  stopHighlights: StopHighlight[];
}

function calcTripLengthDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const startTime = new Date(`${start}T00:00:00`).getTime();
  const endTime = new Date(`${end}T00:00:00`).getTime();
  return Math.round((endTime - startTime) / 86_400_000) + 1;
}

export function useTripData(tripId: string | undefined): TripData {
  const fallbackTrip = tripId ? getTripFromStorageOrMock(tripId) : undefined;
  const {
    trip: serviceTrip,
    isLoading: isLoadingServiceTrip,
    error: serviceError,
  } = useServiceTrip(tripId);
  const trip = serviceTrip ?? fallbackTrip;

  const derived = useMemo(() => {
    const flights = trip ? getFlightsByTripId(trip.id) : [];
    const hotels = trip ? getHotelsByTripId(trip.id) : [];
    const places = trip ? getPlacesByTripId(trip.id) : [];
    const itinerary = trip ? getItineraryByTripId(trip.id) : [];
    const budget = trip ? getBudgetByTripId(trip.id) : undefined;
    const notes = trip ? getNotesByTripId(trip.id) : [];
    const checklist = trip ? getChecklistByTripId(trip.id) : [];
    const orderedStops = trip ? [...trip.stops].sort((a, b) => a.order - b.order) : [];

    const selectedFlight = flights.find((flight) => flight.isSelected);
    const selectedHotel = hotels.find((hotel) => hotel.isSelected);
    const savedPlaces = places.filter((place) => place.isSaved);
    const hotelLink =
      selectedHotel?.locationRef?.websiteUri ?? selectedHotel?.locationRef?.googleMapsUri;

    const totalAllocated = budget
      ? budget.categories.reduce((sum, cat) => sum + cat.allocated, 0)
      : (trip?.budget ?? 0);
    const totalSpent = budget ? budget.categories.reduce((sum, cat) => sum + cat.spent, 0) : 0;
    const checkedCount = checklist.filter((item) => item.checked).length;

    const getStopForDay = (day: ItineraryDay): TripStop | undefined =>
      orderedStops.find((stop) => stop.id === day.stopId) ??
      (trip ? getPrimaryStop(trip) : undefined);

    const getStopName = (stopId?: string) =>
      orderedStops.find((stop) => stop.id === stopId)?.name;

    const stopHighlights: StopHighlight[] = orderedStops.map((stop) => {
      const stopHotels = hotels.filter((hotel) => hotel.stopId === stop.id);
      return {
        stop,
        hotel: stopHotels.find((hotel) => hotel.isSelected) ?? stopHotels[0],
        places: places
          .filter((place) => place.stopId === stop.id && place.isSaved)
          .slice(0, 3),
        dayCount: itinerary.filter((day) => getStopForDay(day)?.id === stop.id).length,
      };
    });

    return {
      tripName: trip ? getTripDisplayName(trip) : '',
      routeLabel: trip ? getTripRouteLabel(trip) : '',
      locationLabel: trip ? getTripLocationLabel(trip) : '',
      isMultiStop: trip ? isMultiStopTrip(trip) : false,
      orderedStops,
      flights,
      hotels,
      places,
      itinerary,
      budget,
      notes,
      checklist,
      selectedFlight,
      selectedHotel,
      savedPlaces,
      hotelLink,
      totalAllocated,
      totalSpent,
      tripLengthDays: trip ? calcTripLengthDays(trip.startDate, trip.endDate) : 0,
      checkedCount,
      getStopForDay,
      getStopName,
      stopHighlights,
    };
  }, [trip]);

  return {
    trip,
    isLoading: isLoadingServiceTrip && !trip,
    serviceError,
    ...derived,
  };
}
