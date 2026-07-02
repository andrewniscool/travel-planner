import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';

interface HotelFiltersProps {
  selectedRatings: number[];
  onRatingToggle: (rating: number) => void;
  selectedAmenities: string[];
  onAmenityToggle: (amenity: string) => void;
  availableAmenities: string[];
}

const HotelFilters: React.FC<HotelFiltersProps> = ({
  selectedRatings,
  onRatingToggle,
  selectedAmenities,
  onAmenityToggle,
  availableAmenities,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-card p-4 border border-neutral-100">
      <div className="flex items-center justify-between lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-700"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div className={['space-y-5', isOpen ? 'block mt-4' : 'hidden', 'lg:block lg:mt-0'].join(' ')}>
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Google Rating</p>
          <div className="space-y-2">
            {[4.5, 4, 3.5].map((rating) => (
              <label key={rating} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedRatings.includes(rating)}
                  onChange={() => onRatingToggle(rating)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-1"
                />
                <span className="text-sm text-neutral-600 group-hover:text-neutral-900">
                  {rating}+ stars
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Amenities</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {availableAmenities.map((amenity) => (
              <label key={amenity} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => onAmenityToggle(amenity)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-1"
                />
                <span className="text-sm text-neutral-600 group-hover:text-neutral-900">
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

export default HotelFilters;
