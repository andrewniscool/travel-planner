import React from 'react';
import {
  Coffee,
  ConciergeBell,
  Dumbbell,
  Phone,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wine,
} from 'lucide-react';
import type { Hotel, LocationRef } from '../../types';

export const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-3.5 h-3.5" />,
  Pool: <Waves className="w-3.5 h-3.5" />,
  Spa: <Wine className="w-3.5 h-3.5" />,
  Restaurant: <UtensilsCrossed className="w-3.5 h-3.5" />,
  Bar: <Wine className="w-3.5 h-3.5" />,
  'Room Service': <Phone className="w-3.5 h-3.5" />,
  Concierge: <ConciergeBell className="w-3.5 h-3.5" />,
  Gym: <Dumbbell className="w-3.5 h-3.5" />,
  Breakfast: <Coffee className="w-3.5 h-3.5" />,
};

export const getLocationLabel = (hotel: Hotel) =>
  hotel.locationRef?.formattedAddress || hotel.neighborhood;

export const getGoogleRating = (hotel: Hotel) =>
  hotel.locationRef?.rating ?? hotel.rating;

export const getGoogleReviewCount = (hotel: Hotel) =>
  hotel.locationRef?.reviewCount ?? hotel.reviewCount;

export const getGooglePhoto = (hotel: Hotel) =>
  hotel.locationRef?.photoUrls?.[0] || hotel.image;

export const getGoogleTypes = (locationRef?: LocationRef) =>
  locationRef?.placeTypes?.map((type) => type.replace(/_/g, ' ')) ?? ['lodging'];

export const extractDistanceNumber = (distance: string) => {
  const match = distance.match(/(\d+)/);
  return match ? Number(match[1]) : 999;
};
