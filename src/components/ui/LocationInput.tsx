import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { mockLocationSuggestions } from '../../data/locationSuggestions';
import {
  placesService,
  type PlaceAutocompleteSuggestion,
} from '../../services/placesService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import type { LocationRef } from '../../types';

interface LocationInputProps {
  label?: string;
  value?: LocationRef | null;
  onChange: (location: LocationRef | null) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  useGooglePlaces?: boolean;
}

type LocationSuggestion =
  | { kind: 'google'; suggestion: PlaceAutocompleteSuggestion }
  | { kind: 'location'; location: LocationRef };

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
  useGooglePlaces = true,
}) => {
  const inputId = useId();
  const [query, setQuery] = useState(value?.name ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [googleSuggestions, setGoogleSuggestions] = useState<
    PlaceAutocompleteSuggestion[]
  >([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState(() =>
    crypto.randomUUID?.() ?? String(Date.now()),
  );
  const requestIdRef = useRef(0);

  const mockSuggestions = useMemo(() => {
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

  const suggestions = useMemo<LocationSuggestion[]>(() => {
    if (googleSuggestions.length > 0) {
      return googleSuggestions.map((suggestion) => ({
        kind: 'google',
        suggestion,
      }));
    }

    return mockSuggestions.map((location) => ({
      kind: 'location',
      location,
    }));
  }, [googleSuggestions, mockSuggestions]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!useGooglePlaces || !isSupabaseConfigured || trimmedQuery.length < 3) {
      setGoogleSuggestions([]);
      setIsLoadingPlaces(false);
      setPlacesError(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoadingPlaces(true);
    setPlacesError(null);

    const timeoutId = window.setTimeout(() => {
      placesService
        .autocomplete(trimmedQuery, { sessionToken })
        .then((nextSuggestions) => {
          if (requestIdRef.current !== requestId) return;
          setGoogleSuggestions(nextSuggestions);
          setPlacesError(null);
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setGoogleSuggestions([]);
          setPlacesError('Google Places is unavailable. Using local suggestions.');
        })
        .finally(() => {
          if (requestIdRef.current !== requestId) return;
          setIsLoadingPlaces(false);
        });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query, sessionToken, useGooglePlaces]);

  const handleTextChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setIsOpen(true);
    setGoogleSuggestions([]);
    onChange(nextQuery.trim() ? makeManualLocation(nextQuery) : null);
  };

  const handleSelectLocation = (location: LocationRef) => {
    setQuery(location.name);
    setIsOpen(false);
    onChange(location);
  };

  const handleSelectGoogleSuggestion = async (
    suggestion: PlaceAutocompleteSuggestion,
  ) => {
    setQuery(suggestion.mainText ?? suggestion.text);
    setIsLoadingPlaces(true);
    setPlacesError(null);

    try {
      const location = await placesService.getDetails(suggestion.placeId, {
        sessionToken,
      });
      setQuery(location.name);
      setIsOpen(false);
      onChange(location);
      setSessionToken(crypto.randomUUID?.() ?? String(Date.now()));
    } catch {
      const manualLocation = makeManualLocation(suggestion.text);
      setQuery(manualLocation.name);
      onChange(manualLocation);
      setPlacesError('Place details could not be loaded. Saved as a manual location.');
    } finally {
      setIsLoadingPlaces(false);
    }
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
          {isLoadingPlaces && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching Google Places...
            </div>
          )}
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => {
              const key =
                suggestion.kind === 'google'
                  ? suggestion.suggestion.placeId
                  : suggestion.location.id;
              const name =
                suggestion.kind === 'google'
                  ? suggestion.suggestion.mainText ?? suggestion.suggestion.text
                  : suggestion.location.name;
              const description =
                suggestion.kind === 'google'
                  ? suggestion.suggestion.secondaryText
                  : suggestion.location.formattedAddress;

              return (
              <button
                key={key}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (suggestion.kind === 'google') {
                    void handleSelectGoogleSuggestion(suggestion.suggestion);
                  } else {
                    handleSelectLocation(suggestion.location);
                  }
                }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
              >
                <MapPin className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-neutral-800 truncate">
                    {name}
                  </span>
                  {description && (
                    <span className="block text-xs text-neutral-500 truncate">
                      {description}
                    </span>
                  )}
                </span>
              </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-500">
              Use “{query.trim()}” as a custom location
            </div>
          )}
          {placesError && (
            <div className="border-t border-neutral-100 px-4 py-2 text-xs text-warning-700">
              {placesError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
