import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

interface FlightFiltersProps {
  maxPrice: number;
  onMaxPriceChange: (price: number) => void;
  nonstopOnly: boolean;
  onNonstopOnlyChange: (value: boolean) => void;
  airlines: string[];
  selectedAirlines: string[];
  onAirlineToggle: (airline: string) => void;
}

const FlightFilters: React.FC<FlightFiltersProps> = ({
  maxPrice,
  onMaxPriceChange,
  nonstopOnly,
  onNonstopOnlyChange,
  airlines,
  selectedAirlines,
  onAirlineToggle,
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
        <span className="text-xs text-neutral-400">
          {nonstopOnly && 'Nonstop only'}
          {selectedAirlines.length > 0 &&
            ` | ${selectedAirlines.length} airline${selectedAirlines.length > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Filter content - always visible on desktop, toggleable on mobile */}
      <div
        className={[
          'space-y-5',
          isOpen ? 'block mt-4' : 'hidden',
          'lg:block lg:mt-0',
        ].join(' ')}
      >
        {/* Max Price */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Max Price
          </label>
          <input
            type="range"
            min={0}
            max={3000}
            step={50}
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-neutral-400">$0</span>
            <span className="text-sm font-semibold text-neutral-900">
              ${maxPrice.toLocaleString()}
            </span>
            <span className="text-xs text-neutral-400">$3,000</span>
          </div>
        </div>

        {/* Nonstop Only */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={nonstopOnly}
                onChange={(e) => onNonstopOnlyChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 rounded-full peer-checked:bg-primary-600 transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm font-medium text-neutral-700">
              Nonstop only
            </span>
          </label>
        </div>

        {/* Airlines */}
        {airlines.length > 0 && (
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-2">
              Airlines
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {airlines.map((airline) => (
                <label
                  key={airline}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedAirlines.includes(airline)}
                    onChange={() => onAirlineToggle(airline)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-1"
                  />
                  <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">
                    {airline}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightFilters;
