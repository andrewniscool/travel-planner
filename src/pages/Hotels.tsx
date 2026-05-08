import React, { useState, useMemo } from 'react';
import {
  Hotel as HotelIcon,
  ChevronDown,
  Bookmark,
  GitCompare,
  Check,
  ExternalLink,
  MapPin,
  Star,
  Wifi,
  Waves,
  UtensilsCrossed,
  Wine,
  ConciergeBell,
  Dumbbell,
  Coffee,
  Phone,
  SlidersHorizontal,
  ChevronUp,
  X as XIcon,
  User,
} from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getHotelsByTripId } from '../data/hotels';
import type { Hotel } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import RatingStars from '../components/ui/RatingStars';
import PriceTag from '../components/ui/PriceTag';

// ==================== Amenity icon mapping ====================
const amenityIcons: Record<string, React.ReactNode> = {
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

// ==================== Mock reviews ====================
const mockReviews = [
  { author: 'Sarah M.', text: 'Wonderful experience! The staff was incredibly attentive and the amenities were top-notch.', rating: 5 },
  { author: 'James L.', text: 'Great location and comfortable rooms. Would definitely stay here again.', rating: 4 },
  { author: 'Emily R.', text: 'Beautiful property with excellent service. The breakfast buffet was a highlight.', rating: 5 },
];

// ==================== Sort options ====================
type HotelSortOption = 'recommended' | 'cheapest' | 'highest-rated' | 'closest';

// ==================== HotelCard ====================
interface HotelCardProps {
  hotel: Hotel;
  isSelected: boolean;
  onSelect: () => void;
  onSave: () => void;
  onCompare: () => void;
  onViewDetails: () => void;
}

const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  isSelected,
  onSelect,
  onSave,
  onCompare,
  onViewDetails,
}) => {
  return (
    <Card
      hover={false}
      className={[
        'transition-all duration-200 overflow-hidden',
        isSelected
          ? 'border-primary-500 bg-primary-50/30'
          : 'border-neutral-100 bg-white',
      ].join(' ')}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Hotel image */}
        <div className="sm:w-48 sm:shrink-0">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-full h-48 sm:h-full object-cover sm:rounded-l-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Right section */}
        <div className="flex-1 p-4 flex flex-col gap-2">
          {/* Top row: name + rating + price */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-neutral-900 text-base truncate">
                {hotel.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <RatingStars rating={hotel.rating} size="sm" />
                <span className="text-xs text-neutral-500">
                  ({hotel.reviewCount.toLocaleString()} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                <span>{hotel.neighborhood}</span>
                <span className="text-neutral-300">|</span>
                <span>{hotel.distanceToCenter}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-neutral-900">
                <PriceTag amount={hotel.pricePerNight} size="sm" />
                <span className="text-xs font-normal text-neutral-400">/night</span>
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Total: ${hotel.totalCost.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5">
            {hotel.amenities.slice(0, 5).map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-50 text-neutral-600 border border-neutral-100"
              >
                {amenityIcons[amenity] || null}
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 5 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-50 text-neutral-400 border border-neutral-100">
                +{hotel.amenities.length - 5} more
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-500 line-clamp-2">
            {hotel.description}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 mt-auto pt-1 flex-wrap">
            <Button variant="ghost" size="sm" onClick={onSave}>
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onCompare}>
              <GitCompare className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
            <Button
              variant={isSelected ? 'primary' : 'outline'}
              size="sm"
              onClick={onSelect}
            >
              <Check className="w-4 h-4 mr-1" />
              Select
            </Button>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" />
                Book Hotel
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ==================== HotelFilters ====================
interface HotelFiltersProps {
  minPrice: number;
  maxPrice: number;
  onMinPriceChange: (v: number) => void;
  onMaxPriceChange: (v: number) => void;
  selectedStars: number[];
  onStarToggle: (star: number) => void;
  selectedAmenities: string[];
  onAmenityToggle: (amenity: string) => void;
  availableAmenities: string[];
}

const HotelFilters: React.FC<HotelFiltersProps> = ({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  selectedStars,
  onStarToggle,
  selectedAmenities,
  onAmenityToggle,
  availableAmenities,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-card p-4 border border-neutral-100">
      {/* Mobile toggle */}
      <div className="flex items-center justify-between lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-700"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Filter content */}
      <div
        className={[
          'space-y-5',
          isOpen ? 'block mt-4' : 'hidden',
          'lg:block lg:mt-0',
        ].join(' ')}
      >
        {/* Price range */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Price per night
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-neutral-400 mb-1 block">Min</label>
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => onMinPriceChange(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <span className="text-neutral-300 mt-4">-</span>
            <div className="flex-1">
              <label className="text-xs text-neutral-400 mb-1 block">Max</label>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Star rating */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Star Rating</p>
          <div className="space-y-2">
            {[5, 4, 3].map((star) => (
              <label
                key={star}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedStars.includes(star)}
                  onChange={() => onStarToggle(star)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-1"
                />
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: star }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 text-warning-400 fill-warning-400"
                    />
                  ))}
                  {Array.from({ length: 5 - star }).map((_, i) => (
                    <Star
                      key={`empty-${i}`}
                      className="w-3.5 h-3.5 text-neutral-200"
                    />
                  ))}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Amenities</p>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {availableAmenities.map((amenity) => (
              <label
                key={amenity}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => onAmenityToggle(amenity)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-1"
                />
                <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">
                  {amenity}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Hotel Detail Modal ====================
interface HotelDetailModalProps {
  hotel: Hotel | null;
  isOpen: boolean;
  onClose: () => void;
}

const HotelDetailModal: React.FC<HotelDetailModalProps> = ({
  hotel,
  isOpen,
  onClose,
}) => {
  if (!hotel) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hotel.name}
      size="lg"
    >
      <div className="space-y-6">
        {/* Large image */}
        <div className="rounded-xl overflow-hidden">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-full h-56 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Rating + reviews */}
        <div className="flex items-center gap-3">
          <RatingStars rating={hotel.rating} />
          <span className="text-sm text-neutral-500">
            ({hotel.reviewCount.toLocaleString()} reviews)
          </span>
          <Badge variant={hotel.rating >= 5 ? 'success' : 'default'}>
            {hotel.rating}-star
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-neutral-700 leading-relaxed">
          {hotel.description}
        </p>

        {/* Amenities with icons */}
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 mb-2">
            Amenities
          </h4>
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 text-primary-700"
              >
                {amenityIcons[amenity] || null}
                {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Neighborhood info */}
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <MapPin className="w-4 h-4 text-neutral-400" />
          <span>{hotel.neighborhood}</span>
          <span className="text-neutral-300">|</span>
          <span>{hotel.distanceToCenter}</span>
        </div>

        {/* Price breakdown */}
        <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Price per night</span>
            <span className="font-medium text-neutral-900">
              ${hotel.pricePerNight.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Total stay cost</span>
            <span className="font-semibold text-neutral-900">
              ${hotel.totalCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Reviews section */}
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 mb-3">
            Guest Reviews
          </h4>
          <div className="space-y-3">
            {mockReviews.map((review, idx) => (
              <div
                key={idx}
                className="bg-neutral-50 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium text-neutral-900">
                    {review.author}
                  </span>
                  <RatingStars rating={review.rating} size="sm" />
                </div>
                <p className="text-sm text-neutral-600">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Book button */}
        <a href="#" target="_blank" rel="noopener noreferrer">
          <Button variant="primary" size="lg" className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Book Hotel
          </Button>
        </a>
      </div>
    </Modal>
  );
};

// ==================== Hotels Page ====================
const Hotels: React.FC = () => {
  const trip = useTrip();
  const allHotels = trip ? getHotelsByTripId(trip.id) : [];

  // Sort
  const [sortBy, setSortBy] = useState<HotelSortOption>('recommended');

  // Filter state
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Selection state
  const [savedHotels, setSavedHotels] = useState<Set<string>>(new Set());
  void savedHotels;
  const [comparedHotels, setComparedHotels] = useState<Set<string>>(new Set());

  // Detail modal
  const [detailHotel, setDetailHotel] = useState<Hotel | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Compare modal
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Available amenities
  const availableAmenities = useMemo(
    () => [...new Set(allHotels.flatMap((h) => h.amenities))].sort(),
    [allHotels]
  );

  // Filtering logic
  const filteredHotels = useMemo(() => {
    return allHotels.filter((hotel) => {
      if (hotel.pricePerNight < minPrice) return false;
      if (hotel.pricePerNight > maxPrice) return false;
      if (selectedStars.length > 0 && !selectedStars.includes(hotel.rating))
        return false;
      if (
        selectedAmenities.length > 0 &&
        !selectedAmenities.every((a) => hotel.amenities.includes(a))
      )
        return false;
      return true;
    });
  }, [allHotels, minPrice, maxPrice, selectedStars, selectedAmenities]);

  // Sorting logic
  const sortedHotels = useMemo(() => {
    const sorted = [...filteredHotels];
    switch (sortBy) {
      case 'cheapest':
        sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case 'highest-rated':
        sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      case 'closest':
        sorted.sort((a, b) => {
          const extractMin = (d: string) => {
            const match = d.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : 999;
          };
          return extractMin(a.distanceToCenter) - extractMin(b.distanceToCenter);
        });
        break;
      case 'recommended':
      default:
        break;
    }
    return sorted;
  }, [filteredHotels, sortBy]);

  // Handlers
  const handleStarToggle = (star: number) => {
    setSelectedStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star]
    );
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSave = (hotelId: string) => {
    setSavedHotels((prev) => {
      const next = new Set(prev);
      if (next.has(hotelId)) {
        next.delete(hotelId);
      } else {
        next.add(hotelId);
      }
      return next;
    });
  };

  const handleCompare = (hotelId: string) => {
    setComparedHotels((prev) => {
      const next = new Set(prev);
      if (next.has(hotelId)) {
        next.delete(hotelId);
      } else {
        next.add(hotelId);
      }
      return next;
    });
  };

  const handleViewDetails = (hotel: Hotel) => {
    setDetailHotel(hotel);
    setDetailModalOpen(true);
  };

  // Compared hotels data
  const comparedHotelList = useMemo(
    () => allHotels.filter((h) => comparedHotels.has(h.id)),
    [allHotels, comparedHotels]
  );

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<HotelIcon className="w-8 h-8" />}
          title="Trip not found"
          description="Could not find the trip for these hotels."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Hotels</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Compare and book hotels for your trip to {trip.destination}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Compare button */}
          {comparedHotels.size >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareModalOpen(true)}
            >
              <GitCompare className="w-4 h-4 mr-1.5" />
              Compare {comparedHotels.size} hotels
            </Button>
          )}

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as HotelSortOption)}
              className="appearance-none bg-white border border-neutral-200 rounded-xl px-4 py-2 pr-9 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="cheapest">Cheapest</option>
              <option value="highest-rated">Highest Rated</option>
              <option value="closest">Closest</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content: Sidebar + List */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <HotelFilters
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            selectedStars={selectedStars}
            onStarToggle={handleStarToggle}
            selectedAmenities={selectedAmenities}
            onAmenityToggle={handleAmenityToggle}
            availableAmenities={availableAmenities}
          />
        </aside>

        {/* Hotel list */}
        <div className="flex-1 space-y-3">
          {sortedHotels.length === 0 ? (
            <EmptyState
              icon={<HotelIcon className="w-8 h-8" />}
              title="No hotels match your filters"
              description="Try adjusting price range, star rating, or amenity preferences."
              actionLabel="Reset filters"
              onAction={() => {
                setMinPrice(0);
                setMaxPrice(1000);
                setSelectedStars([]);
                setSelectedAmenities([]);
              }}
            />
          ) : (
            sortedHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                isSelected={!!hotel.isSelected}
                onSelect={() => console.log('Selected hotel:', hotel.id)}
                onSave={() => handleSave(hotel.id)}
                onCompare={() => handleCompare(hotel.id)}
                onViewDetails={() => handleViewDetails(hotel)}
              />
            ))
          )}
        </div>
      </div>

      {/* Hotel Detail Modal */}
      <HotelDetailModal
        hotel={detailHotel}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />

      {/* Compare Modal */}
      <Modal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        title="Compare Hotels"
        size="lg"
      >
        {comparedHotelList.length >= 2 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left py-3 pr-4 font-medium text-neutral-500">
                    Attribute
                  </th>
                  {comparedHotelList.map((h) => (
                    <th
                      key={h.id}
                      className="text-left py-3 px-4 font-semibold text-neutral-900 min-w-[180px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{h.name}</span>
                        <button
                          onClick={() => handleCompare(h.id)}
                          className="p-0.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 shrink-0"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Image</td>
                  {comparedHotelList.map((h) => (
                    <td key={h.id} className="py-3 px-4">
                      <img
                        src={h.image}
                        alt={h.name}
                        className="w-32 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Rating</td>
                  {comparedHotelList.map((h) => (
                    <td key={h.id} className="py-3 px-4">
                      <RatingStars rating={h.rating} size="sm" showCount count={h.reviewCount} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Per Night</td>
                  {comparedHotelList.map((h) => (
                    <td key={h.id} className="py-3 px-4 font-semibold text-neutral-900">
                      ${h.pricePerNight.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Total Cost</td>
                  {comparedHotelList.map((h) => (
                    <td key={h.id} className="py-3 px-4 font-semibold text-neutral-900">
                      ${h.totalCost.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Location</td>
                  {comparedHotelList.map((h) => (
                    <td key={h.id} className="py-3 px-4 text-neutral-700">
                      {h.neighborhood}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Distance</td>
                  {comparedHotelList.map((h) => (
                    <td key={h.id} className="py-3 px-4 text-neutral-700">
                      {h.distanceToCenter}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Amenities</td>
                  {comparedHotelList.map((h) => (
                    <td key={h.id} className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {h.amenities.map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-600"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4" />
                  {comparedHotelList.map((h) => (
                    <td key={h.id} className="py-3 px-4">
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="w-full">
                          Book Hotel
                        </Button>
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Hotels;
