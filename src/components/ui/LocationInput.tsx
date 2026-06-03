import React, { useId, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { mockLocationSuggestions } from '../../data/locationSuggestions';
import type { LocationRef } from '../../types';

interface LocationInputProps {
  label?: string;
  value?: LocationRef | null;
  onChange: (location: LocationRef | null) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const makeManualLocation = (name: string): LocationRef => ({
  id: `manual-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'location'}`,
  name: name.trim(),
  source: 'manual',
});

const LocationInput: React.FC<LocationInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Search for a place or enter a custom location',
  required = false,
  className = '',
}) => {
  const inputId = useId();
  const [query, setQuery] = useState(value?.name ?? '');
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return mockLocationSuggestions.slice(0, 6);
    return mockLocationSuggestions
      .filter((suggestion) =>
        [
          suggestion.name,
          suggestion.formattedAddress,
          ...(suggestion.placeTypes ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      )
      .slice(0, 6);
  }, [query]);

  const handleTextChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setIsOpen(true);
    onChange(nextQuery.trim() ? makeManualLocation(nextQuery) : null);
  };

  const handleSelect = (location: LocationRef) => {
    setQuery(location.name);
    setIsOpen(false);
    onChange(location);
  };

  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          id={inputId}
          type="text"
          value={query}
          required={required}
          onChange={(event) => handleTextChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-lg">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(suggestion)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
              >
                <MapPin className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-neutral-800 truncate">
                    {suggestion.name}
                  </span>
                  {suggestion.formattedAddress && (
                    <span className="block text-xs text-neutral-500 truncate">
                      {suggestion.formattedAddress}
                    </span>
                  )}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-500">
              Use “{query.trim()}” as a custom location
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
