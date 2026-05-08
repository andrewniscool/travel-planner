import React, { useState, useMemo } from 'react';
import {
  Building2,
  UtensilsCrossed,
  MapPin,
  Plane,
  Filter,
  Plus,
} from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getPlacesByTripId } from '../data/places';
import { getHotelsByTripId } from '../data/hotels';
import { getFlightsByTripId } from '../data/flights';
import RatingStars from '../components/ui/RatingStars';

import type { Place, PlaceCategory } from '../types';

type CategoryFilter = 'Hotels' | 'Food' | 'Activities' | 'Transport';

const categoryIcons: Record<CategoryFilter, React.ReactNode> = {
  Hotels: <Building2 className="w-4 h-4" />,
  Food: <UtensilsCrossed className="w-4 h-4" />,
  Activities: <MapPin className="w-4 h-4" />,
  Transport: <Plane className="w-4 h-4" />,
};

const placeCategoryMap: Record<PlaceCategory, CategoryFilter> = {
  Restaurants: 'Food',
  Cafes: 'Food',
  Museums: 'Activities',
  Outdoor: 'Activities',
  Nightlife: 'Activities',
  Shopping: 'Activities',
  Tours: 'Activities',
  Landmarks: 'Activities',
  'Hidden Gems': 'Activities',
};

const MapPinMarker: React.FC<{
  icon: React.ReactNode;
  bgColor: string;
  left: string;
  top: string;
  label: string;
}> = ({ icon, bgColor, left, top, label }) => (
  <div
    className="absolute group cursor-pointer"
    style={{ left, top }}
  >
    <div
      className={[
        'flex items-center justify-center w-10 h-10 rounded-full shadow-lg',
        'transition-transform duration-200 group-hover:scale-110',
        bgColor,
      ].join(' ')}
    >
      <div className="text-white">{icon}</div>
    </div>
    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-neutral-700 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm">
      {label}
    </span>
    <span
      className={[
        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full',
        'animate-ping opacity-20',
        bgColor,
      ].join(' ')}
    />
  </div>
);

const MapPage: React.FC = () => {
  const trip = useTrip();
  const [activeFilters, setActiveFilters] = useState<Set<CategoryFilter>>(
    new Set(['Hotels', 'Food', 'Activities', 'Transport'])
  );

  const places = trip ? getPlacesByTripId(trip.id) : [];
  const hotels = trip ? getHotelsByTripId(trip.id) : [];
  const flights = trip ? getFlightsByTripId(trip.id) : [];

  const savedPlaces = useMemo(
    () => places.filter((p) => p.isSaved),
    [places]
  );

  const selectedHotel = useMemo(
    () => hotels.find((h) => h.isSelected),
    [hotels]
  );

  const selectedFlight = useMemo(
    () => flights.find((f) => f.isSelected),
    [flights]
  );

  const toggleFilter = (category: CategoryFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredPlaces = useMemo(() => {
    return savedPlaces.filter((p) => {
      const mappedCategory = placeCategoryMap[p.category] || 'Activities';
      return activeFilters.has(mappedCategory);
    });
  }, [savedPlaces, activeFilters]);

  const showHotels = activeFilters.has('Hotels');
  const showTransport = activeFilters.has('Transport');

  const groupedPlaces = useMemo(() => {
    const groups: Record<CategoryFilter, Place[]> = {
      Hotels: [],
      Food: [],
      Activities: [],
      Transport: [],
    };
    filteredPlaces.forEach((p) => {
      const mappedCategory = placeCategoryMap[p.category] || 'Activities';
      groups[mappedCategory].push(p);
    });
    return groups;
  }, [filteredPlaces]);

  const restaurantPins = savedPlaces.filter(
    (p) => p.category === 'Restaurants' || p.category === 'Cafes'
  );
  const activityPins = savedPlaces.filter(
    (p) =>
      p.category === 'Museums' ||
      p.category === 'Outdoor' ||
      p.category === 'Landmarks' ||
      p.category === 'Tours'
  );

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Trip not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Map Area */}
      <div className="lg:w-[70%] w-full">
        <div className="relative w-full h-[400px] lg:h-full min-h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100">
          {/* Map integration banner */}
          <div className="absolute top-4 left-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <MapPin className="w-4 h-4 text-primary-500" />
            <span className="text-sm text-neutral-600">
              Map integration coming soon
            </span>
          </div>

          {/* Stylized map grid lines */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 bottom-0 left-[20%] w-px bg-primary-400" />
            <div className="absolute top-0 bottom-0 left-[40%] w-px bg-primary-400" />
            <div className="absolute top-0 bottom-0 left-[60%] w-px bg-primary-400" />
            <div className="absolute top-0 bottom-0 left-[80%] w-px bg-primary-400" />
            <div className="absolute left-0 right-0 top-[25%] h-px bg-primary-400" />
            <div className="absolute left-0 right-0 top-[50%] h-px bg-primary-400" />
            <div className="absolute left-0 right-0 top-[75%] h-px bg-primary-400" />
          </div>

          {/* Pin markers */}
          {/* Hotel pin */}
          {selectedHotel && (
            <MapPinMarker
              icon={<Building2 className="w-5 h-5" />}
              bgColor="bg-primary-600"
              left="48%"
              top="45%"
              label={selectedHotel.name}
            />
          )}

          {/* Restaurant pins */}
          {restaurantPins.slice(0, 3).map((place, i) => (
            <MapPinMarker
              key={place.id}
              icon={<UtensilsCrossed className="w-4 h-4" />}
              bgColor="bg-accent-600"
              left={`${25 + i * 22}%`}
              top={`${35 + i * 18}%`}
              label={place.name}
            />
          ))}

          {/* Activity pins */}
          {activityPins.slice(0, 3).map((place, i) => (
            <MapPinMarker
              key={place.id}
              icon={<MapPin className="w-4 h-4" />}
              bgColor="bg-success-500"
              left={`${15 + i * 25}%`}
              top={`${55 + i * 12}%`}
              label={place.name}
            />
          ))}

          {/* Airport pin */}
          {selectedFlight && (
            <MapPinMarker
              icon={<Plane className="w-4 h-4" />}
              bgColor="bg-error-500"
              left="85%"
              top="15%"
              label={selectedFlight.departureAirportCode}
            />
          )}
        </div>
      </div>

      {/* Side Panel */}
      <div className="lg:w-[30%] w-full flex flex-col">
        {/* Category filter toggles */}
        <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-neutral-500" />
            <h3 className="text-sm font-semibold text-neutral-700">
              Filter by Category
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(categoryIcons) as CategoryFilter[]).map(
              (category) => (
                <button
                  key={category}
                  onClick={() => toggleFilter(category)}
                  className={[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                    activeFilters.has(category)
                      ? 'bg-primary-50 text-primary-600 border border-primary-200'
                      : 'bg-neutral-50 text-neutral-400 border border-neutral-200',
                  ].join(' ')}
                >
                  {categoryIcons[category]}
                  {category}
                </button>
              )
            )}
          </div>
        </div>

        {/* Saved places list */}
        <div className="flex-1 bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-700">
              Saved Places
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
            {/* Hotels group */}
            {showHotels && selectedHotel && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Hotels
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors duration-150">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-50 text-primary-600 shrink-0">
                      <Building2 className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 truncate">
                        {selectedHotel.name}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {selectedHotel.neighborhood}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <RatingStars
                          rating={selectedHotel.rating}
                          size="sm"
                        />
                        <span className="text-xs text-neutral-400">
                          {selectedHotel.distanceToCenter}
                        </span>
                      </div>
                    </div>
                    <button className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors duration-150">
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transport group */}
            {showTransport && selectedFlight && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5" />
                  Transport
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors duration-150">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-error-50 text-error-500 shrink-0">
                      <Plane className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 truncate">
                        {selectedFlight.airline}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {selectedFlight.departureAirportCode} -{' '}
                        {selectedFlight.arrivalAirportCode}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {selectedFlight.duration}
                      </p>
                    </div>
                    <button className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors duration-150">
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Food group */}
            {activeFilters.has('Food') && groupedPlaces.Food.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  Food
                </h4>
                <div className="space-y-2">
                  {groupedPlaces.Food.map((place) => (
                    <div
                      key={place.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent-50 text-accent-600 shrink-0">
                        <UtensilsCrossed className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-800 truncate">
                          {place.name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {place.category} - {place.priceRange}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <RatingStars rating={place.rating} size="sm" />
                          <span className="text-xs text-neutral-400">
                            {place.location}
                          </span>
                        </div>
                      </div>
                      <button className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors duration-150">
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities group */}
            {activeFilters.has('Activities') &&
              groupedPlaces.Activities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Activities
                  </h4>
                  <div className="space-y-2">
                    {groupedPlaces.Activities.map((place) => (
                      <div
                        key={place.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-success-50 text-success-600 shrink-0">
                          <MapPin className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-800 truncate">
                            {place.name}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {place.category} - {place.priceRange}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <RatingStars rating={place.rating} size="sm" />
                            <span className="text-xs text-neutral-400">
                              {place.location}
                            </span>
                          </div>
                        </div>
                        <button className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors duration-150">
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Empty state */}
            {filteredPlaces.length === 0 && !selectedHotel && !selectedFlight && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mb-3">
                  <MapPin className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-neutral-600">
                  No saved places
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Save places from the Explore tab to see them here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
